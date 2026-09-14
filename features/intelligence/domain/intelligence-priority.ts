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
