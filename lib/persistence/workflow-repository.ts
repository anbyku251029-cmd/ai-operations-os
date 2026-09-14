'use server';

import { createClient } from '@/lib/supabase/server';
import {
  DbSection,
  DbNode,
  DbEdge,
  DbWorkflowBundle,
  EditorWorkflowSnapshot,
  SaveWorkflowResult,
} from './workflow-types';
import { mapSnapshotToDbPayload } from './workflow-mapper';
import { getWorkflowById } from '@/features/workflow/actions/workflow-actions';

// Supabase 미연결 또는 테스트 환경을 위한 글로벌 인메모리 스토리지 폴백
declare global {
  var __mockEditorData:
    | Record<string, { sections: DbSection[]; nodes: DbNode[]; edges: DbEdge[] }>
    | undefined;
}

if (!global.__mockEditorData) {
  global.__mockEditorData = {};
}

/**
 * 워크플로우 전체 번들 로드 (Server Action)
 */
export async function loadWorkflowBundle(workflowId: string): Promise<DbWorkflowBundle | null> {
  const workflow = await getWorkflowById(workflowId);
  if (!workflow) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();

      // 1. sections 조회
      const { data: sectionsData, error: secError } = await supabase
        .from('sections')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('position', { ascending: true });

      // 2. nodes 조회
      const { data: nodesData, error: nodeError } = await supabase
        .from('nodes')
        .select('*')
        .eq('workflow_id', workflowId);

      // 3. edges 조회
      const { data: edgesData, error: edgeError } = await supabase
        .from('edges')
        .select('*')
        .eq('workflow_id', workflowId);

      if (secError || nodeError || edgeError) {
        // 테스트 환경이 아닐 경우 목 폴백을 하지 않고 null 반환
        if (process.env.NODE_ENV !== 'test') {
          console.error('[Persistence] Supabase query error:', secError || nodeError || edgeError);
          return null;
        }
        const fallback = global.__mockEditorData?.[workflowId];
        return {
          workflow,
          sections: fallback?.sections || [],
          nodes: fallback?.nodes || [],
          edges: fallback?.edges || [],
        };
      }

      return {
        workflow,
        sections: (sectionsData as DbSection[]) || [],
        nodes: (nodesData as DbNode[]) || [],
        edges: (edgesData as DbEdge[]) || [],
      };
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[Persistence] Supabase connection error:', err);
        return null;
      }
      const fallback = global.__mockEditorData?.[workflowId];
      return {
        workflow,
        sections: fallback?.sections || [],
        nodes: fallback?.nodes || [],
        edges: fallback?.edges || [],
      };
    }
  }

  // Supabase 환경변수가 없는 경우: 테스트 환경에서만 mock fallback 허용
  if (process.env.NODE_ENV === 'test') {
    const fallback = global.__mockEditorData?.[workflowId];
    return {
      workflow,
      sections: fallback?.sections || [],
      nodes: fallback?.nodes || [],
      edges: fallback?.edges || [],
    };
  }

  return null;
}

/**
 * [LOCK 01 & 03] 워크플로우 스냅샷 명시적 저장 (Server Action)
 */
export async function saveWorkflowSnapshot(
  snapshot: EditorWorkflowSnapshot
): Promise<SaveWorkflowResult> {
  const { workflowId } = snapshot;
  if (!workflowId) {
    return { success: false, error: '워크플로우 ID가 유효하지 않습니다.' };
  }

  const { sections: dbSections, nodes: dbNodes, edges: dbEdges } = mapSnapshotToDbPayload(snapshot);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

  // 1. 테스트 환경이면서 Supabase 미설정 시에만 단위 테스트용 in-memory mock 저장 수행
  if (!isSupabaseConfigured && process.env.NODE_ENV === 'test') {
    if (global.__mockEditorData) {
      global.__mockEditorData[workflowId] = {
        sections: dbSections || [],
        nodes: dbNodes,
        edges: dbEdges,
      };
    }
    return { success: true };
  }

  // 2. 프로덕션/개발 환경에서 환경변수 미설정 시 즉시 명확한 에러 반환
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: 'Supabase 클라우드 데이터베이스 연결 설정이 구성되지 않았습니다.',
    };
  }

  // 3. 실제 Supabase 클라우드 저장 시도
  try {
    const supabase = await createClient();

    // 0. 섹션 Upsert 및 삭제 정리
    if (dbSections && dbSections.length > 0) {
      const currentSectionIds = dbSections.map((s) => s.id);
      await supabase
        .from('sections')
        .delete()
        .eq('workflow_id', workflowId)
        .not('id', 'in', `(${currentSectionIds.join(',')})`);

      const { error: secUpsertError } = await supabase
        .from('sections')
        .upsert(dbSections, { onConflict: 'id' });

      if (secUpsertError) {
        throw new Error(`섹션 저장 중 오류: ${secUpsertError.message}`);
      }
    }

    // 1. 기존 Edges 삭제 (외래키 제약조건 방지를 위해 항상 엣지 먼저 삭제)
    const { error: edgeDelError } = await supabase
      .from('edges')
      .delete()
      .eq('workflow_id', workflowId);

    if (edgeDelError) {
      throw new Error(`엣지 정리 중 오류: ${edgeDelError.message}`);
    }

    // 2. 현재 스냅샷에 없는 노드 삭제
    const currentNodeIds = dbNodes.map((n) => n.id);
    if (currentNodeIds.length > 0) {
      await supabase
        .from('nodes')
        .delete()
        .eq('workflow_id', workflowId)
        .not('id', 'in', `(${currentNodeIds.join(',')})`);
    } else {
      // 노드가 전부 삭제된 경우 전체 노드 삭제
      await supabase
        .from('nodes')
        .delete()
        .eq('workflow_id', workflowId);
    }

    // 3. 노드 Upsert (삽입 및 업데이트)
    if (dbNodes.length > 0) {
      const { error: nodeUpsertError } = await supabase
        .from('nodes')
        .upsert(dbNodes, { onConflict: 'id' });

      if (nodeUpsertError) {
        throw new Error(`노드 저장 중 오류: ${nodeUpsertError.message}`);
      }
    }

    // 4. 새 Edges 삽입
    if (dbEdges.length > 0) {
      const { error: edgeInsertError } = await supabase
        .from('edges')
        .insert(dbEdges);

      if (edgeInsertError) {
        throw new Error(`엣지 연결 저장 중 오류: ${edgeInsertError.message}`);
      }
    }

    // 워크플로우 updated_at 갱신
    await supabase
      .from('workflows')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', workflowId);

    // 테스트 환경 호환용 mock 동기화
    if (process.env.NODE_ENV === 'test' && global.__mockEditorData) {
      global.__mockEditorData[workflowId] = {
        sections: dbSections || [],
        nodes: dbNodes,
        edges: dbEdges,
      };
    }

    return { success: true };
  } catch (error: unknown) {
    // [P1 FIX: Silent Fallback 제거]
    // 저장이 실패했을 때 절대 mock 저장으로 대체하고 success: true를 반환하지 않음!
    const errorMsg =
      error instanceof Error ? error.message : '워크플로우 저장 중 알 수 없는 오류가 발생했습니다.';
    return {
      success: false,
      error: errorMsg,
    };
  }
}
