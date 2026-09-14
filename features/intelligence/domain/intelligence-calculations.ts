/**
 * Operations Intelligence Pure Calculation Engine
 * Phase 22 — Pure Deterministic Functions
 */

import {
  IntelligenceInputNode,
  WorkflowMetrics,
  OwnerLoad,
  ToolUsage,
} from './intelligence-types';

/**
 * 노드에서 시간(분)을 추출하는 정규화 헬퍼 (null/undefined/음수/NaN 안전 처리)
 */
export function extractNodeMinutes(node: IntelligenceInputNode): number {
  const val = node.durationMinutes ?? node.duration;
  if (val === null || val === undefined || isNaN(val)) {
    return 0;
  }
  return Math.max(0, val);
}

/**
 * 노드의 소요 시간이 누락(null/undefined)되었는지 판별
 */
export function isNodeMinutesMissing(node: IntelligenceInputNode): boolean {
  const val = node.durationMinutes ?? node.duration;
  return val === null || val === undefined || isNaN(val);
}

/**
 * 노드에서 비용(원)을 추출하는 정규화 헬퍼 (null/undefined/음수/NaN 안전 처리)
 */
export function extractNodeCost(node: IntelligenceInputNode): number {
  const val = node.costAmount ?? node.cost;
  if (val === null || val === undefined || isNaN(val)) {
    return 0;
  }
  return Math.max(0, val);
}

/**
 * 노드의 비용이 누락(null/undefined)되었는지 판별
 */
export function isNodeCostMissing(node: IntelligenceInputNode): boolean {
  const val = node.costAmount ?? node.cost;
  return val === null || val === undefined || isNaN(val);
}

/**
 * 총 소요 시간(분) 합산
 * 빈 배열이거나 데이터가 없으면 0 반환
 */
export function calculateTotalMinutes(nodes: IntelligenceInputNode[]): number {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return 0;
  }
  return nodes.reduce((acc, node) => acc + extractNodeMinutes(node), 0);
}

/**
 * 총 운영 비용 합산
 * 빈 배열이거나 데이터가 없으면 0 반환
 */
export function calculateTotalCost(nodes: IntelligenceInputNode[]): number {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return 0;
  }
  return nodes.reduce((acc, node) => acc + extractNodeCost(node), 0);
}

/**
 * 단계당 평균 소요 시간(분) 계산
 * 빈 배열이거나 데이터가 없으면 0 반환
 */
export function calculateAverageMinutes(nodes: IntelligenceInputNode[]): number {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return 0;
  }
  const total = calculateTotalMinutes(nodes);
  return Number((total / nodes.length).toFixed(1));
}

/**
 * 워크플로우 단위 종합 메트릭 집계
 */
export function calculateWorkflowMetrics(nodes: IntelligenceInputNode[]): WorkflowMetrics {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return {
      totalMinutes: 0,
      totalCost: 0,
      averageMinutes: 0,
      nodeCount: 0,
      missingDurationCount: 0,
      missingCostCount: 0,
    };
  }

  const totalMinutes = calculateTotalMinutes(nodes);
  const totalCost = calculateTotalCost(nodes);
  const averageMinutes = calculateAverageMinutes(nodes);
  const missingDurationCount = nodes.filter(isNodeMinutesMissing).length;
  const missingCostCount = nodes.filter(isNodeCostMissing).length;

  return {
    totalMinutes,
    totalCost,
    averageMinutes,
    nodeCount: nodes.length,
    missingDurationCount,
    missingCostCount,
  };
}

/**
 * 담당자(Owner)별 업무 부하 집계
 * 담당자 누락 시 "Unassigned"로 집계
 */
export function calculateOwnerLoad(nodes: IntelligenceInputNode[]): OwnerLoad[] {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return [];
  }

  const map = new Map<
    string,
    { stepCount: number; totalMinutes: number; totalCost: number }
  >();

  for (const node of nodes) {
    const rawOwner = node.owner ? node.owner.trim() : '';
    const ownerName = rawOwner === '' || rawOwner === '담당자 미지정' ? 'Unassigned' : rawOwner;

    const minutes = extractNodeMinutes(node);
    const cost = extractNodeCost(node);

    const existing = map.get(ownerName);
    if (existing) {
      existing.stepCount += 1;
      existing.totalMinutes += minutes;
      existing.totalCost += cost;
    } else {
      map.set(ownerName, {
        stepCount: 1,
        totalMinutes: minutes,
        totalCost: cost,
      });
    }
  }

  return Array.from(map.entries())
    .map(([ownerName, data]) => ({
      ownerName,
      stepCount: data.stepCount,
      totalMinutes: data.totalMinutes,
      totalCost: data.totalCost,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes || b.stepCount - a.stepCount);
}

/**
 * 도구(Tool)별 활용 집계
 * 도구 누락 시 "No tool specified"로 집계
 */
export function calculateToolUsage(nodes: IntelligenceInputNode[]): ToolUsage[] {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return [];
  }

  const map = new Map<string, number>();

  for (const node of nodes) {
    const rawTool = node.tool ? node.tool.trim() : '';
    const toolName = rawTool === '' || rawTool === '도구 미지정' ? 'No tool specified' : rawTool;

    map.set(toolName, (map.get(toolName) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([toolName, usageCount]) => ({
      toolName,
      usageCount,
    }))
    .sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * 소요 시간이 가장 긴 노드 탐색
 * 빈 배열이면 null 반환
 */
export function findLongestNode(nodes: IntelligenceInputNode[]): IntelligenceInputNode | null {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return null;
  }

  let longest: IntelligenceInputNode = nodes[0];
  let maxMinutes = extractNodeMinutes(nodes[0]);

  for (let i = 1; i < nodes.length; i++) {
    const minutes = extractNodeMinutes(nodes[i]);
    if (minutes > maxMinutes) {
      maxMinutes = minutes;
      longest = nodes[i];
    }
  }

  return longest;
}

/**
 * 비용이 가장 비싼 노드 탐색
 * 빈 배열이면 null 반환
 */
export function findMostExpensiveNode(
  nodes: IntelligenceInputNode[]
): IntelligenceInputNode | null {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return null;
  }

  let mostExpensive: IntelligenceInputNode = nodes[0];
  let maxCost = extractNodeCost(nodes[0]);

  for (let i = 1; i < nodes.length; i++) {
    const cost = extractNodeCost(nodes[i]);
    if (cost > maxCost) {
      maxCost = cost;
      mostExpensive = nodes[i];
    }
  }

  return mostExpensive;
}
