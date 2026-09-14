import {
  OperationalPriority,
  WorkflowMetrics,
  NodeAnalysis,
  WorkflowAnalysis,
  IntelligenceInputWorkflow,
} from './intelligence-types';
import {
  calculateWorkflowMetrics,
  calculateOwnerLoad,
  calculateToolUsage,
  findLongestNode,
  findMostExpensiveNode,
} from './intelligence-calculations';
import {
  analyzeNodeBottlenecks,
} from './intelligence-rules';
import {
  BottleneckItem,
  ImprovementPriorityItem,
  WorkflowAnalysisResult,
  OwnerLoadItem,
} from '../types/intelligence-types';

// -------------------------------------------------------------
// 1. 기존 V1.1 서비스 호환 우선순위 산출 (deriveImprovementPriorities)
// -------------------------------------------------------------
/**
 * 탐지된 병목 및 부하 분석을 기반으로 운영 개선 우선순위 항목(P1 / P2 / P3)을 산출하는 순수 함수
 */
export function deriveImprovementPriorities(
  workflows: WorkflowAnalysisResult[],
  bottlenecks: BottleneckItem[],
  ownerLoads: OwnerLoadItem[]
): ImprovementPriorityItem[] {
  const priorities: ImprovementPriorityItem[] = [];

  if (!workflows || workflows.length === 0) {
    return [];
  }

  // 1. [P1] 심각 병목 (High Severity: 120분 이상 초과 노드, 다중 유입 병목)
  const highBottlenecks = bottlenecks.filter((b) => b.severity === 'high');
  for (const hb of highBottlenecks) {
    priorities.push({
      id: `priority-p1-${hb.id}`,
      priority: 'P1',
      title: `[핵심 병목] ${hb.nodeName} 처리 절차 간소화`,
      targetWorkflowId: hb.workflowId,
      targetWorkflowName: hb.workflowName,
      description: hb.reason,
      expectedBenefit: `${hb.type === 'duration_overload' ? '프로세스 소요 시간 40% 이상 단축' : '운영 지연 리스크 50% 완화'}`,
    });
  }

  // 2. [P2] 특정 담당자 과부하 개선 권고 (총 소요 시간 180분 이상 또는 4개 이상 단계 집중)
  const overloadedOwners = ownerLoads.filter(
    (o) => o.ownerName !== '담당자 미지정' && (o.totalMinutes >= 180 || o.stepCount >= 4)
  );
  for (const owner of overloadedOwners) {
    const primaryWfId = owner.workflowIds[0] || '';
    const targetWf = workflows.find((w) => w.workflowId === primaryWfId);
    priorities.push({
      id: `priority-p2-owner-${owner.ownerName}`,
      priority: 'P2',
      title: `[부하 분산] ${owner.ownerName}(${owner.role}) 업무 재분장 권장`,
      targetWorkflowId: primaryWfId,
      targetWorkflowName: targetWf ? targetWf.workflowName : '관련 워크플로우',
      description: `총 ${owner.stepCount}개 단계, ${owner.totalMinutes}분의 업무가 집중되어 담당자 부재 시 업무 마비 위험이 있습니다.`,
      expectedBenefit: '팀 내 업무 다변화 및 특정 인원 의존도 위험 완화',
    });
  }

  // 3. [P2] 고비용 워크플로우 비용 효율화
  const highCostWorkflows = workflows.filter((w) => w.totalCost >= 200000);
  for (const wf of highCostWorkflows) {
    priorities.push({
      id: `priority-p2-cost-${wf.workflowId}`,
      priority: 'P2',
      title: `[비용 최적화] ${wf.workflowName} 단계별 비용 절감 검토`,
      targetWorkflowId: wf.workflowId,
      targetWorkflowName: wf.workflowName,
      description: `전체 워크플로우 비용이 ${wf.totalCost.toLocaleString()}원으로 조직 내 최상위 운영비 지출 프로세스입니다.`,
      expectedBenefit: '반복 실행 시 분기별 수백만 원 운영비 절감 효과',
    });
  }

  // 4. [P3] 고립 노드 및 담당자 미지정 정리
  const mediumOrLowBottlenecks = bottlenecks.filter(
    (b) => b.type === 'orphan_node' || b.type === 'unassigned_owner'
  );
  for (const mb of mediumOrLowBottlenecks.slice(0, 5)) {
    priorities.push({
      id: `priority-p3-${mb.id}`,
      priority: 'P3',
      title: `[데이터 정돈] ${mb.nodeName} 담당자 및 연결선 보완`,
      targetWorkflowId: mb.workflowId,
      targetWorkflowName: mb.workflowName,
      description: mb.reason,
      expectedBenefit: '프로세스 가시성 100% 확보 및 신규 참여자 인수인계 용이',
    });
  }

  // 우선순위 정렬 (P1 -> P2 -> P3)
  const priorityRank: Record<string, number> = { P1: 1, P2: 2, P3: 3 };
  return priorities.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
}

// -------------------------------------------------------------
// 2. Phase 22 순수 도메인 운영 우선순위 (OperationalPriority)
// -------------------------------------------------------------
/**
 * 워크플로우의 지표와 병목 사항을 종합하여 운영 우선순위(OperationalPriority)와 판단 사유를 평가합니다.
 *
 * 평가 기준:
 * - 'critical' (긴급):
 *   - 총 소요시간 480분(8시간) 이상
 *   - 또는 총 비용 10,000 이상
 *   - 또는 병목 단계 수가 5개 이상
 *   - 또는 노드 중 심각한 우선순위('critical')가 1개 이상
 * - 'high' (높음):
 *   - 총 소요시간 180분(3시간) 이상
 *   - 또는 총 비용 3,000 이상
 *   - 또는 병목 단계 수가 2개 이상
 *   - 또는 노드 중 높은 우선순위('high')가 1개 이상
 * - 'medium' (보통):
 *   - 병목 단계 수가 1개 이상
 *   - 또는 총 소요시간 60분(1시간) 이상
 *   - 또는 총 비용 1,000 이상
 * - 'low' (낮음):
 *   - 상기 조건에 해당하지 않는 정상 및 경량 워크플로우
 */
export function calculateOperationalPriority(
  metrics: WorkflowMetrics,
  bottlenecks: NodeAnalysis[] = []
): { priority: OperationalPriority; reasons: string[] } {
  if (metrics.nodeCount === 0) {
    return {
      priority: 'low',
      reasons: ['등록된 노드가 없어 운영 리스크가 없습니다.'],
    };
  }

  const bottleneckCount = bottlenecks.length;
  const hasCriticalNode = bottlenecks.some((b) => b.priority === 'critical');
  const hasHighNode = bottlenecks.some((b) => b.priority === 'high');

  const reasons: string[] = [];

  if (
    metrics.totalMinutes >= 480 ||
    metrics.totalCost >= 10000 ||
    bottleneckCount >= 5 ||
    hasCriticalNode
  ) {
    if (metrics.totalMinutes >= 480) {
      reasons.push(`총 소요 시간(${metrics.totalMinutes}분)이 8시간을 초과하여 전면적인 공정 단축이 시급합니다.`);
    }
    if (metrics.totalCost >= 10000) {
      reasons.push(`총 실행 비용(${metrics.totalCost.toLocaleString()}원)이 한계치를 초과하여 비용 절감이 필요합니다.`);
    }
    if (bottleneckCount >= 5) {
      reasons.push(`전체 ${bottleneckCount}개의 다수 병목 구간이 누적되어 있습니다.`);
    }
    if (hasCriticalNode) {
      reasons.push('즉시 조치가 요구되는 긴급(Critical) 병목 단계가 포함되어 있습니다.');
    }
    return { priority: 'critical', reasons };
  }

  if (
    metrics.totalMinutes >= 180 ||
    metrics.totalCost >= 3000 ||
    bottleneckCount >= 2 ||
    hasHighNode
  ) {
    if (metrics.totalMinutes >= 180) {
      reasons.push(`총 소요 시간(${metrics.totalMinutes}분)이 3시간을 초과하여 단계별 최적화가 권장됩니다.`);
    }
    if (metrics.totalCost >= 3000) {
      reasons.push(`총 비용(${metrics.totalCost.toLocaleString()}원)이 높아 효율화 검토가 필요합니다.`);
    }
    if (bottleneckCount >= 2) {
      reasons.push(`${bottleneckCount}개의 병목 구간이 확인되었습니다.`);
    }
    if (hasHighNode) {
      reasons.push('집중 검토가 필요한 높은(High) 우선순위 노드가 존재합니다.');
    }
    return { priority: 'high', reasons };
  }

  if (
    bottleneckCount >= 1 ||
    metrics.totalMinutes >= 60 ||
    metrics.totalCost >= 1000
  ) {
    if (bottleneckCount >= 1) {
      reasons.push(`${bottleneckCount}개의 모니터링 대상 병목 단계가 있습니다.`);
    }
    if (metrics.totalMinutes >= 60) {
      reasons.push(`총 소요 시간(${metrics.totalMinutes}분)이 1시간 이상입니다.`);
    }
    if (metrics.totalCost >= 1000) {
      reasons.push(`총 비용(${metrics.totalCost.toLocaleString()}원) 검토가 가능합니다.`);
    }
    return { priority: 'medium', reasons };
  }

  return {
    priority: 'low',
    reasons: ['모든 지표가 안정 범위에 있으며 병목이 감지되지 않았습니다.'],
  };
}

/**
 * 운영 우선순위의 한국어 표시 라벨을 반환합니다.
 */
export function getPriorityLabel(priority: OperationalPriority): string {
  switch (priority) {
    case 'critical':
      return '긴급 (Critical)';
    case 'high':
      return '높음 (High)';
    case 'medium':
      return '보통 (Medium)';
    case 'low':
      return '낮음 (Low)';
    default:
      return '미정';
  }
}

/**
 * 운영 우선순위의 상세 한국어 설명 및 조치 권고사항을 반환합니다.
 */
export function getPriorityDescription(priority: OperationalPriority): string {
  switch (priority) {
    case 'critical':
      return '소요 시간이나 비용이 매우 높거나 다수의 운영 병목이 감지되어 즉각적인 최적화 및 담당자 지정이 요구됩니다.';
    case 'high':
      return '운영 부하 또는 병목 위험이 상당하여 단계적 검토와 리소스 재배치가 권장됩니다.';
    case 'medium':
      return '일부 병목 지점이나 메트릭 누락이 존재하므로 모니터링 및 부분 개선이 필요합니다.';
    case 'low':
      return '안정적인 운영 흐름을 유지하고 있으며 추가적인 긴급 조치가 필요하지 않습니다.';
    default:
      return '평가 결과가 없습니다.';
  }
}

/**
 * 입력된 워크플로우 전체를 분석하여 최종 운영 인텔리전스 분석 보고서(WorkflowAnalysis)를 생성합니다.
 */
export function analyzeWorkflow(
  workflow: IntelligenceInputWorkflow
): WorkflowAnalysis {
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];

  const metrics = calculateWorkflowMetrics(nodes);
  const totalMinutes = metrics.totalMinutes;
  const totalCost = metrics.totalCost;
  const averageMinutes = metrics.averageMinutes;

  const nodeAnalyses = nodes.map((node) =>
    analyzeNodeBottlenecks(node, nodes, edges, totalMinutes, totalCost, averageMinutes)
  );
  const bottlenecks = nodeAnalyses.filter((analysis) => analysis.isBottleneck);

  const ownerLoads = calculateOwnerLoad(nodes);
  const toolUsages = calculateToolUsage(nodes);
  const longestNode = findLongestNode(nodes);
  const mostExpensiveNode = findMostExpensiveNode(nodes);

  const { priority: operationalPriority, reasons: priorityReasons } =
    calculateOperationalPriority(metrics, bottlenecks);

  return {
    workflowId: workflow.id,
    workflowName: workflow.name,
    description: workflow.description ?? null,
    metrics,
    nodeAnalyses,
    bottlenecks,
    ownerLoads,
    toolUsages,
    longestNode,
    mostExpensiveNode,
    operationalPriority,
    priorityReasons,
  };
}
