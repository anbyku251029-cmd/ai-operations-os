import { fetchAllWorkflowAnalysisInputs } from './intelligence-repository';
import {
  calculateTotalMinutes,
  calculateTotalCost,
  calculateOwnerLoads,
  calculateToolUsages,
  calculateOverviewMetrics,
} from '../domain/intelligence-calculations';
import {
  detectWorkflowBottlenecks,
  detectAllBottlenecks,
} from '../domain/intelligence-rules';
import { deriveImprovementPriorities } from '../domain/intelligence-priority';
import {
  IntelligenceAnalysisBundle,
  WorkflowAnalysisInput,
  WorkflowAnalysisResult,
} from '../types/intelligence-types';

/**
 * 주어진 WorkflowAnalysisInput 목록에 대해 동기식으로 종합 분석을 수행하는 서비스 함수
 */
export function analyzeWorkflows(inputs: WorkflowAnalysisInput[]): IntelligenceAnalysisBundle {
  if (!inputs || inputs.length === 0) {
    return {
      overview: {
        totalWorkflows: 0,
        totalTimeMinutes: 0,
        totalCostAmount: 0,
        bottleneckCount: 0,
        totalNodes: 0,
      },
      workflows: [],
      bottlenecks: [],
      ownerLoads: [],
      toolUsages: [],
      priorities: [],
      analyzedAt: new Date().toISOString(),
    };
  }

  // 1. 개별 워크플로우별 분석 결과 산출
  const workflows: WorkflowAnalysisResult[] = inputs.map((input) => {
    const { workflow, nodes, edges } = input;
    const bottlenecks = detectWorkflowBottlenecks(input);
    const totalMinutes = calculateTotalMinutes(nodes);
    const totalCost = calculateTotalCost(nodes);

    const uniqueOwners = new Set(
      nodes.map((n) => n.owner?.trim()).filter((o): o is string => Boolean(o && o !== '담당자 미지정'))
    );
    const uniqueTools = new Set(
      nodes.map((n) => n.tool?.trim()).filter((t): t is string => Boolean(t && t !== '도구 미지정'))
    );

    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      description: workflow.description,
      updatedAt: workflow.updated_at,
      totalNodes: nodes.length,
      totalEdges: edges.length,
      totalMinutes,
      totalCost,
      bottlenecks,
      ownerCount: uniqueOwners.size,
      toolCount: uniqueTools.size,
    };
  });

  // 2. 전체 병목 종합
  const allBottlenecks = detectAllBottlenecks(inputs);

  // 3. 담당자별 부하 분석
  const ownerLoads = calculateOwnerLoads(inputs);

  // 4. 도구 활용 분석
  const toolUsages = calculateToolUsages(inputs);

  // 5. 종합 개요 메트릭 산출
  const overview = calculateOverviewMetrics(workflows, allBottlenecks);

  // 6. 개선 우선순위 산출
  const priorities = deriveImprovementPriorities(workflows, allBottlenecks, ownerLoads);

  return {
    overview,
    workflows,
    bottlenecks: allBottlenecks,
    ownerLoads,
    toolUsages,
    priorities,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * 전체 분석 데이터 파이프라인 실행 (Server Action / Service Entry Point)
 */
export async function getOperationsIntelligenceAnalysis(): Promise<IntelligenceAnalysisBundle> {
  const inputs = await fetchAllWorkflowAnalysisInputs();
  return analyzeWorkflows(inputs);
}
