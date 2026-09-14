import { DbNode, DbEdge } from '@/lib/persistence/workflow-types';
import { BottleneckItem, WorkflowAnalysisInput } from '../types/intelligence-types';
import { safeNumber } from './intelligence-calculations';

// 룰셋 임계치 상수 정의
export const BOTTLENECK_THRESHOLDS = {
  HIGH_DURATION_MINUTES: 120, // 2시간 이상 단일 작업 -> 심각 병목
  MEDIUM_DURATION_MINUTES: 60, // 1시간 이상 단일 작업 -> 주의 병목
  HIGH_COST_AMOUNT: 100000,    // 10만원 이상 단일 단계 -> 고비용 병목
  MEDIUM_COST_AMOUNT: 50000,   // 5만원 이상 단일 단계 -> 주의 비용
  HIGH_FAN_IN_EDGES: 3,        // 3개 이상 유입 연결 -> 병목 집중점
};

/**
 * 단일 워크플로우에서 룰 기반 병목 노드 탐지 (Pure Function)
 */
export function detectWorkflowBottlenecks(input: WorkflowAnalysisInput): BottleneckItem[] {
  const { workflow, nodes, edges } = input;
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return [];
  }

  const bottlenecks: BottleneckItem[] = [];
  const safeEdges = edges && Array.isArray(edges) ? edges : [];

  // 각 노드별 입력/출력 엣지 수 카운트
  const incomingEdgeMap = new Map<string, number>();
  const outgoingEdgeMap = new Map<string, number>();

  for (const edge of safeEdges) {
    if (edge.target_node_id) {
      incomingEdgeMap.set(
        edge.target_node_id,
        (incomingEdgeMap.get(edge.target_node_id) || 0) + 1
      );
    }
    if (edge.source_node_id) {
      outgoingEdgeMap.set(
        edge.source_node_id,
        (outgoingEdgeMap.get(edge.source_node_id) || 0) + 1
      );
    }
  }

  for (const node of nodes) {
    const duration = safeNumber(node.duration);
    const cost = safeNumber(node.cost);
    const incomingCount = incomingEdgeMap.get(node.id) || 0;
    const outgoingCount = outgoingEdgeMap.get(node.id) || 0;
    const isOrphan = nodes.length > 1 && incomingCount === 0 && outgoingCount === 0;

    // Rule 1: 소요 시간 과다 (Duration Overload)
    if (duration >= BOTTLENECK_THRESHOLDS.HIGH_DURATION_MINUTES) {
      bottlenecks.push({
        id: `btn-dur-h-${workflow.id}-${node.id}`,
        workflowId: workflow.id,
        workflowName: workflow.name,
        nodeId: node.id,
        nodeName: node.name || '무제 노드',
        type: 'duration_overload',
        severity: 'high',
        reason: `단일 단계 소요 시간이 ${duration}분으로 기준치(${BOTTLENECK_THRESHOLDS.HIGH_DURATION_MINUTES}분)를 크게 초과하여 전체 프로세스 완수를 지연시킵니다.`,
        recommendation: '세부 하위 단계로 분할하거나 자동화 도구 도입을 검토하세요.',
        metricValue: duration,
        thresholdValue: BOTTLENECK_THRESHOLDS.HIGH_DURATION_MINUTES,
      });
    } else if (duration >= BOTTLENECK_THRESHOLDS.MEDIUM_DURATION_MINUTES) {
      bottlenecks.push({
        id: `btn-dur-m-${workflow.id}-${node.id}`,
        workflowId: workflow.id,
        workflowName: workflow.name,
        nodeId: node.id,
        nodeName: node.name || '무제 노드',
        type: 'duration_overload',
        severity: 'medium',
        reason: `소요 시간이 ${duration}분으로 1시간 이상 소요되는 집중 관리 대상입니다.`,
        recommendation: '담당자 업무 절차 가이드라인 및 템플릿 제공을 권장합니다.',
        metricValue: duration,
        thresholdValue: BOTTLENECK_THRESHOLDS.MEDIUM_DURATION_MINUTES,
      });
    }

    // Rule 2: 비용 과다 (Cost Overload)
    if (cost >= BOTTLENECK_THRESHOLDS.HIGH_COST_AMOUNT) {
      bottlenecks.push({
        id: `btn-cost-h-${workflow.id}-${node.id}`,
        workflowId: workflow.id,
        workflowName: workflow.name,
        nodeId: node.id,
        nodeName: node.name || '무제 노드',
        type: 'cost_overload',
        severity: 'high',
        reason: `단일 실행 비용이 ${cost.toLocaleString()}원으로 기준치(${BOTTLENECK_THRESHOLDS.HIGH_COST_AMOUNT.toLocaleString()}원)를 초과하여 운영비 부담이 큽니다.`,
        recommendation: '외주 비용 계약 재검토 또는 내부 표준화 도구 활용을 권장합니다.',
        metricValue: cost,
        thresholdValue: BOTTLENECK_THRESHOLDS.HIGH_COST_AMOUNT,
      });
    }

    // Rule 3: 다중 유입 병목 (High Fan-in Concentration)
    if (incomingCount >= BOTTLENECK_THRESHOLDS.HIGH_FAN_IN_EDGES) {
      bottlenecks.push({
        id: `btn-fanin-${workflow.id}-${node.id}`,
        workflowId: workflow.id,
        workflowName: workflow.name,
        nodeId: node.id,
        nodeName: node.name || '무제 노드',
        type: 'high_fan_in',
        severity: 'high',
        reason: `${incomingCount}개의 선행 단계가 이 한 단계로 동시 유입되어, 지연 발생 시 후속 프로세스 전체가 블로킹됩니다.`,
        recommendation: '사전 승인 단계 병렬화 또는 분산 처리를 고려하세요.',
        metricValue: incomingCount,
        thresholdValue: BOTTLENECK_THRESHOLDS.HIGH_FAN_IN_EDGES,
      });
    }

    // Rule 4: 고립 노드 (Orphan Node)
    if (isOrphan) {
      bottlenecks.push({
        id: `btn-orphan-${workflow.id}-${node.id}`,
        workflowId: workflow.id,
        workflowName: workflow.name,
        nodeId: node.id,
        nodeName: node.name || '무제 노드',
        type: 'orphan_node',
        severity: 'medium',
        reason: '어떤 선행/후속 단계와도 연결선(Edge)이 연결되어 있지 않아 누락되거나 방치될 위험이 있습니다.',
        recommendation: '캔버스 에디터에서 전후 작업 단계와 연결 엣지를 연결하세요.',
      });
    }

    // Rule 5: 담당자 미지정 (Unassigned Owner)
    const isUnassigned = !node.owner || node.owner.trim() === '' || node.owner.trim() === '담당자 미지정';
    if (isUnassigned) {
      bottlenecks.push({
        id: `btn-unassigned-${workflow.id}-${node.id}`,
        workflowId: workflow.id,
        workflowName: workflow.name,
        nodeId: node.id,
        nodeName: node.name || '무제 노드',
        type: 'unassigned_owner',
        severity: 'low',
        reason: '실행 책임자가 지정되지 않아 업무 누락 위험이 있습니다.',
        recommendation: '속성 패널에서 업무 담당자 및 직무 역할을 지정하세요.',
      });
    }
  }

  // 심각도 순 정렬 (high -> medium -> low)
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return bottlenecks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * 전체 워크플로우에 대한 병목 목록 통합 수집
 */
export function detectAllBottlenecks(inputs: WorkflowAnalysisInput[]): BottleneckItem[] {
  if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
    return [];
  }

  const all: BottleneckItem[] = [];
  for (const input of inputs) {
    const list = detectWorkflowBottlenecks(input);
    all.push(...list);
  }

  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return all.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
