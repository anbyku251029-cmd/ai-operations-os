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
      // 테이블 미생성 또는 에러 시 폴백 조회
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
  } catch {
    const fallback = global.__mockEditorData?.[workflowId];
    return {
      workflow,
      sections: fallback?.sections || [],
      nodes: fallback?.nodes || [],
      edges: fallback?.edges || [],
    };
  }
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

    // Fallback 스토어도 동기화
    if (global.__mockEditorData) {
      global.__mockEditorData[workflowId] = {
        sections: dbSections,
        nodes: dbNodes,
        edges: dbEdges,
      };
    }

    return { success: true };
  } catch (error: unknown) {
    // Supabase DB 저장 실패 시 인메모리 폴백으로 처리
    if (global.__mockEditorData) {
      global.__mockEditorData[workflowId] = {
        sections: dbSections || [],
        nodes: dbNodes,
        edges: dbEdges,
      };
      return { success: true };
    }

    const errorMsg =
      error instanceof Error ? error.message : '워크플로우 저장 중 알 수 없는 오류가 발생했습니다.';
    return {
      success: false,
      error: errorMsg,
    };
  }
}
