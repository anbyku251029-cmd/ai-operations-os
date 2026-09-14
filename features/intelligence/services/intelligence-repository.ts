import { getWorkflows } from '@/features/workflow/actions/workflow-actions';
import { loadWorkflowBundle } from '@/lib/persistence/workflow-repository';
import { WorkflowAnalysisInput } from '../types/intelligence-types';

/**
 * Operations Intelligence Read-Only Repository Adapter
 * 기존 V1 영속성 계층을 100% 읽기 전용으로 재사용하여 분석용 데이터 번들을 수집합니다.
 */
export async function fetchAllWorkflowAnalysisInputs(): Promise<WorkflowAnalysisInput[]> {
  try {
    // 1. 전체 워크플로우 목록 조회
    const workflows = await getWorkflows();
    if (!workflows || workflows.length === 0) {
      return [];
    }

    // 2. 각 워크플로우의 번들(노드, 엣지, 섹션)을 안전하게 읽기 전용으로 병렬/순차 수집
    const inputs: WorkflowAnalysisInput[] = [];

    for (const workflow of workflows) {
      try {
        const bundle = await loadWorkflowBundle(workflow.id);
        if (bundle) {
          inputs.push({
            workflow: bundle.workflow,
            nodes: bundle.nodes || [],
            edges: bundle.edges || [],
            sections: bundle.sections || [],
          });
        } else {
          // 번들이 비어있는 경우 기본 빈 노드/엣지 번들로 처리
          inputs.push({
            workflow,
            nodes: [],
            edges: [],
            sections: [],
          });
        }
      } catch (bundleErr) {
        console.error(`[IntelligenceRepository] Failed to load bundle for ${workflow.id}:`, bundleErr);
        // 특정 워크플로우 로드 실패 시에도 전체 분석이 중단되지 않도록 최소 정보 유지
        inputs.push({
          workflow,
          nodes: [],
          edges: [],
          sections: [],
        });
      }
    }

    return inputs;
  } catch (error) {
    console.error('[IntelligenceRepository] Failed to fetch workflows for intelligence:', error);
    throw new Error(
      error instanceof Error
        ? `운영 분석 데이터를 조회하는 중 오류가 발생했습니다: ${error.message}`
        : '운영 분석 데이터 조회 실패'
    );
  }
}
