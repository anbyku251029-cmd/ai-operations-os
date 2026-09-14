/**
 * Operations Intelligence Rule-Based Bottleneck Detection
 * Phase 22 — Explainable Rules Engine
 */

import {
  IntelligenceInputNode,
  IntelligenceInputEdge,
  IntelligenceInputWorkflow,
  NodeAnalysis,
  OperationalPriority,
} from './intelligence-types';
import {
  extractNodeMinutes,
  extractNodeCost,
  isNodeMinutesMissing,
  isNodeCostMissing,
  calculateTotalMinutes,
  calculateTotalCost,
  calculateAverageMinutes,
} from './intelligence-calculations';

// 룰셋 기준치 상수
export const RULE_THRESHOLDS = {
  DURATION_MULTIPLIER_VS_AVERAGE: 2.0, // 평균 시간 대비 2배 이상
  DURATION_SHARE_RATIO: 0.3,          // 전체 프로세스 시간의 30% 이상 점유
  ABSOLUTE_HIGH_COST: 100000,          // 100,000원 이상 단일 단계
  COST_SHARE_RATIO: 0.35,              // 전체 프로세스 비용의 35% 이상 점유
  HIGH_FAN_IN_EDGES: 3,                // 3개 이상 유입 연결 집중
};

/**
 * 1. 소요 시간 과다 병목 탐지 (평균 대비 2배 이상 또는 전체의 30% 이상)
 */
export function detectLongDurationBottleneck(
  node: IntelligenceInputNode,
  averageMinutes: number,
  totalMinutes: number
): { isBottleneck: boolean; reasons: string[]; measuredValue: number; thresholdDescription: string } {
  const minutes = extractNodeMinutes(node);
  const reasons: string[] = [];

  if (averageMinutes > 0 && minutes >= averageMinutes * RULE_THRESHOLDS.DURATION_MULTIPLIER_VS_AVERAGE) {
    const ratio = (minutes / averageMinutes).toFixed(1);
    reasons.push(
      `평균 단계 소요 시간(${averageMinutes}분)보다 ${ratio}배 길어 전체 일정을 지연시킵니다.`
    );
  }

  if (totalMinutes > 0 && minutes / totalMinutes >= RULE_THRESHOLDS.DURATION_SHARE_RATIO) {
    const sharePercent = Math.round((minutes / totalMinutes) * 100);
    reasons.push(`전체 워크플로우 시간의 ${sharePercent}%를 단독 점유하고 있습니다.`);
  }

  return {
    isBottleneck: reasons.length > 0,
    reasons,
    measuredValue: minutes,
    thresholdDescription: `평균 대비 ${RULE_THRESHOLDS.DURATION_MULTIPLIER_VS_AVERAGE}배 이상 또는 전체의 ${RULE_THRESHOLDS.DURATION_SHARE_RATIO * 100}% 이상`,
  };
}

/**
 * 2. 고비용 단계 병목 탐지 (10만원 이상 또는 전체 비용의 35% 이상)
 */
export function detectHighCostBottleneck(
  node: IntelligenceInputNode,
  totalCost: number
): { isBottleneck: boolean; reasons: string[]; measuredValue: number; thresholdDescription: string } {
  const cost = extractNodeCost(node);
  const reasons: string[] = [];

  if (cost >= RULE_THRESHOLDS.ABSOLUTE_HIGH_COST) {
    reasons.push(
      `단일 실행 비용이 ${cost.toLocaleString()}원으로 기준치(${RULE_THRESHOLDS.ABSOLUTE_HIGH_COST.toLocaleString()}원)를 초과합니다.`
    );
  }

  if (totalCost > 0 && cost / totalCost >= RULE_THRESHOLDS.COST_SHARE_RATIO) {
    const sharePercent = Math.round((cost / totalCost) * 100);
    reasons.push(`전체 프로세스 운영비의 ${sharePercent}%를 차지하는 주요 지출 단계입니다.`);
  }

  return {
    isBottleneck: reasons.length > 0,
    reasons,
    measuredValue: cost,
    thresholdDescription: `${RULE_THRESHOLDS.ABSOLUTE_HIGH_COST.toLocaleString()}원 이상 또는 전체 비용의 ${RULE_THRESHOLDS.COST_SHARE_RATIO * 100}% 이상`,
  };
}

/**
 * 3. 담당자 누락 탐지
 */
export function detectMissingOwner(
  node: IntelligenceInputNode
): { isBottleneck: boolean; reasons: string[]; measuredValue: string; thresholdDescription: string } {
  const rawOwner = node.owner ? node.owner.trim() : '';
  const isMissing = rawOwner === '' || rawOwner === '담당자 미지정' || rawOwner === 'Unassigned';

  return {
    isBottleneck: isMissing,
    reasons: isMissing ? ['실행 책임자(Owner)가 지정되지 않아 업무 누락 위험이 있습니다.'] : [],
    measuredValue: rawOwner || 'Unassigned',
    thresholdDescription: '담당자가 지정되어 있어야 함',
  };
}

/**
 * 4. 도구 누락 탐지
 */
export function detectMissingTool(
  node: IntelligenceInputNode
): { isBottleneck: boolean; reasons: string[]; measuredValue: string; thresholdDescription: string } {
  const rawTool = node.tool ? node.tool.trim() : '';
  const isMissing = rawTool === '' || rawTool === '도구 미지정' || rawTool === 'No tool specified';

  return {
    isBottleneck: isMissing,
    reasons: isMissing ? ['사용 소프트웨어 도구가 정의되지 않아 작업 표준화가 필요합니다.'] : [],
    measuredValue: rawTool || 'No tool specified',
    thresholdDescription: '사용 도구가 명시되어 있어야 함',
  };
}

/**
 * 5. 시간 또는 비용 데이터 누락 탐지
 */
export function detectMissingMetrics(
  node: IntelligenceInputNode
): { isBottleneck: boolean; reasons: string[]; measuredValue: string; thresholdDescription: string } {
  const missingDuration = isNodeMinutesMissing(node);
  const missingCost = isNodeCostMissing(node);
  const reasons: string[] = [];

  if (missingDuration) {
    reasons.push('단계 소요 시간(duration) 데이터가 누락되어 있습니다.');
  }
  if (missingCost) {
    reasons.push('단계 실행 비용(cost) 데이터가 누락되어 있습니다.');
  }

  return {
    isBottleneck: reasons.length > 0,
    reasons,
    measuredValue: `시간:${missingDuration ? '누락' : '정상'}, 비용:${missingCost ? '누락' : '정상'}`,
    thresholdDescription: '시간 및 비용 수치 입력 필수',
  };
}

/**
 * 6. 연결 집중도(Fan-in) 과다 탐지
 */
export function detectHighConnectionConcentration(
  nodeId: string,
  edges: IntelligenceInputEdge[]
): { isBottleneck: boolean; reasons: string[]; measuredValue: number; thresholdDescription: string } {
  if (!edges || edges.length === 0) {
    return {
      isBottleneck: false,
      reasons: [],
      measuredValue: 0,
      thresholdDescription: `유입 연결선 ${RULE_THRESHOLDS.HIGH_FAN_IN_EDGES}개 이상`,
    };
  }

  const incomingCount = edges.filter(
    (e) => (e.target_node_id ?? e.target) === nodeId
  ).length;

  const isConcentrated = incomingCount >= RULE_THRESHOLDS.HIGH_FAN_IN_EDGES;

  return {
    isBottleneck: isConcentrated,
    reasons: isConcentrated
      ? [`${incomingCount}개의 선행 단계가 집중 유입되어 병목 블로킹 위험이 높습니다.`]
      : [],
    measuredValue: incomingCount,
    thresholdDescription: `유입 연결선 ${RULE_THRESHOLDS.HIGH_FAN_IN_EDGES}개 이상`,
  };
}

/**
 * 7. 종합 노드 병목 분석 (모든 룰 통합 및 설명 가능한 사유 목록 도출)
 */
export function analyzeNodeBottlenecks(
  node: IntelligenceInputNode,
  allNodes: IntelligenceInputNode[],
  edges: IntelligenceInputEdge[],
  totalMinutes: number,
  totalCost: number,
  averageMinutes: number
): NodeAnalysis {
  const durationCheck = detectLongDurationBottleneck(node, averageMinutes, totalMinutes);
  const costCheck = detectHighCostBottleneck(node, totalCost);
  const ownerCheck = detectMissingOwner(node);
  const toolCheck = detectMissingTool(node);
  const metricsCheck = detectMissingMetrics(node);
  const concentrationCheck = detectHighConnectionConcentration(node.id, edges);

  const rawReasons = [
    ...durationCheck.reasons,
    ...costCheck.reasons,
    ...concentrationCheck.reasons,
    ...ownerCheck.reasons,
    ...toolCheck.reasons,
    ...metricsCheck.reasons,
  ];

  // 중복 사유 제거
  const uniqueReasons = Array.from(new Set(rawReasons));
  const isBottleneck = uniqueReasons.length > 0;

  // 우선순위 판정
  let priority: OperationalPriority = 'low';
  if (durationCheck.isBottleneck && (costCheck.isBottleneck || concentrationCheck.isBottleneck)) {
    priority = 'critical';
  } else if (durationCheck.isBottleneck || costCheck.isBottleneck || concentrationCheck.isBottleneck) {
    priority = 'high';
  } else if (ownerCheck.isBottleneck || metricsCheck.isBottleneck) {
    priority = 'medium';
  } else if (toolCheck.isBottleneck) {
    priority = 'low';
  }

  const incomingEdgeCount = edges.filter((e) => (e.target_node_id ?? e.target) === node.id).length;
  const outgoingEdgeCount = edges.filter((e) => (e.source_node_id ?? e.source) === node.id).length;

  return {
    nodeId: node.id,
    nodeName: node.name || '무제 노드',
    isBottleneck,
    reasons: uniqueReasons,
    priority,
    durationMinutes: extractNodeMinutes(node),
    costAmount: extractNodeCost(node),
    owner: node.owner?.trim() || 'Unassigned',
    tool: node.tool?.trim() || 'No tool specified',
    incomingEdgeCount,
    outgoingEdgeCount,
    isMissingDuration: isNodeMinutesMissing(node),
    isMissingCost: isNodeCostMissing(node),
    isMissingOwner: ownerCheck.isBottleneck,
    isMissingTool: toolCheck.isBottleneck,
  };
}

/**
 * 전체 워크플로우에 대한 병목 노드 목록 탐지
 */
export function detectBottlenecks(workflow: IntelligenceInputWorkflow): NodeAnalysis[] {
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];

  if (nodes.length === 0) {
    return [];
  }

  const totalMinutes = calculateTotalMinutes(nodes);
  const totalCost = calculateTotalCost(nodes);
  const averageMinutes = calculateAverageMinutes(nodes);

  return nodes
    .map((node) => analyzeNodeBottlenecks(node, nodes, edges, totalMinutes, totalCost, averageMinutes))
    .filter((analysis) => analysis.isBottleneck);
}
