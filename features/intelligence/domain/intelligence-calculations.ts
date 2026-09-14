/**
 * Operations Intelligence Pure Calculation Engine
 * Phase 22 — Pure Deterministic Functions & Backward Compatible Core
 */

import { DbNode } from '@/lib/persistence/workflow-types';
import {
  OperationsOverviewMetrics,
  OwnerLoadItem,
  ToolUsageItem,
  WorkflowAnalysisInput,
  WorkflowAnalysisResult,
  BottleneckItem,
} from '../types/intelligence-types';
import {
  IntelligenceInputNode,
  WorkflowMetrics,
  OwnerLoad,
  ToolUsage,
} from './intelligence-types';

/**
 * 안전한 숫자 파싱 (null, undefined, NaN, 음수 방어)
 */
export function safeNumber(value: number | null | undefined): number {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  return Math.max(0, value);
}

/**
 * 노드에서 시간(분)을 추출하는 정규화 헬퍼 (null/undefined/음수/NaN 안전 처리)
 */
export function extractNodeMinutes(node: IntelligenceInputNode | DbNode): number {
  const n = node as any;
  const val = n.durationMinutes ?? n.duration;
  return safeNumber(val);
}

/**
 * 노드의 소요 시간이 누락(null/undefined/NaN)되었는지 판별
 */
export function isNodeMinutesMissing(node: IntelligenceInputNode | DbNode): boolean {
  const n = node as any;
  const val = n.durationMinutes ?? n.duration;
  return val === null || val === undefined || isNaN(val);
}

/**
 * 노드에서 비용(원)을 추출하는 정규화 헬퍼 (null/undefined/음수/NaN 안전 처리)
 */
export function extractNodeCost(node: IntelligenceInputNode | DbNode): number {
  const n = node as any;
  const val = n.costAmount ?? n.cost;
  return safeNumber(val);
}

/**
 * 노드의 비용이 누락(null/undefined/NaN)되었는지 판별
 */
export function isNodeCostMissing(node: IntelligenceInputNode | DbNode): boolean {
  const n = node as any;
  const val = n.costAmount ?? n.cost;
  return val === null || val === undefined || isNaN(val);
}

/**
 * 단일 노드 목록으로부터 총 소요 시간(분) 합산
 * 빈 배열이거나 데이터가 없으면 0 반환
 */
export function calculateTotalMinutes(nodes: (IntelligenceInputNode | DbNode)[]): number {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return 0;
  }
  return nodes.reduce((acc, node) => acc + extractNodeMinutes(node), 0);
}

/**
 * 단일 노드 목록으로부터 총 비용(원) 합산
 * 빈 배열이거나 데이터가 없으면 0 반환
 */
export function calculateTotalCost(nodes: (IntelligenceInputNode | DbNode)[]): number {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return 0;
  }
  return nodes.reduce((acc, node) => acc + extractNodeCost(node), 0);
}

/**
 * 단계당 평균 소요 시간(분) 계산 (소수점 1자리 반올림)
 * 빈 배열이거나 데이터가 없으면 0 반환
 */
export function calculateAverageMinutes(nodes: (IntelligenceInputNode | DbNode)[]): number {
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
 * 단일 워크플로우 내 담당자(Owner)별 업무 부하 집계 (Phase 22 신규)
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
 * 복수 워크플로우 입력 데이터로부터 담당자(Owner)별 부하 분석 집계 (기존 V1.1 서비스 호환)
 */
export function calculateOwnerLoads(inputs: WorkflowAnalysisInput[]): OwnerLoadItem[] {
  if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
    return [];
  }

  const map = new Map<
    string,
    {
      ownerName: string;
      role: string;
      stepCount: number;
      totalMinutes: number;
      totalCost: number;
      workflowIds: Set<string>;
    }
  >();

  for (const input of inputs) {
    const { workflow, nodes } = input;
    if (!nodes || !Array.isArray(nodes)) continue;

    for (const node of nodes) {
      const ownerName = (node.owner && node.owner.trim()) || '담당자 미지정';
      const role = (node.role && node.role.trim()) || '역할 미지정';
      const key = `${ownerName}___${role}`;

      const existing = map.get(key);
      const minutes = safeNumber(node.duration);
      const cost = safeNumber(node.cost);

      if (existing) {
        existing.stepCount += 1;
        existing.totalMinutes += minutes;
        existing.totalCost += cost;
        existing.workflowIds.add(workflow.id);
      } else {
        map.set(key, {
          ownerName,
          role,
          stepCount: 1,
          totalMinutes: minutes,
          totalCost: cost,
          workflowIds: new Set([workflow.id]),
        });
      }
    }
  }

  return Array.from(map.values())
    .map((item) => ({
      ownerName: item.ownerName,
      role: item.role,
      stepCount: item.stepCount,
      totalMinutes: item.totalMinutes,
      totalCost: item.totalCost,
      workflowIds: Array.from(item.workflowIds),
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes || b.stepCount - a.stepCount);
}

/**
 * 단일 워크플로우 내 도구(Tool)별 활용 집계 (Phase 22 신규)
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
 * 복수 워크플로우 입력 데이터로부터 도구(Tool)별 활용 통계 집계 (기존 V1.1 서비스 호환)
 */
export function calculateToolUsages(inputs: WorkflowAnalysisInput[]): ToolUsageItem[] {
  if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
    return [];
  }

  const map = new Map<
    string,
    {
      toolName: string;
      usageCount: number;
      associatedOwners: Set<string>;
      workflowIds: Set<string>;
    }
  >();

  for (const input of inputs) {
    const { workflow, nodes } = input;
    if (!nodes || !Array.isArray(nodes)) continue;

    for (const node of nodes) {
      const toolName = (node.tool && node.tool.trim()) || '도구 미지정';
      const ownerName = (node.owner && node.owner.trim()) || '담당자 미지정';

      const existing = map.get(toolName);
      if (existing) {
        existing.usageCount += 1;
        existing.associatedOwners.add(ownerName);
        existing.workflowIds.add(workflow.id);
      } else {
        map.set(toolName, {
          toolName,
          usageCount: 1,
          associatedOwners: new Set([ownerName]),
          workflowIds: new Set([workflow.id]),
        });
      }
    }
  }

  return Array.from(map.values())
    .map((item) => ({
      toolName: item.toolName,
      usageCount: item.usageCount,
      associatedOwners: Array.from(item.associatedOwners),
      workflowIds: Array.from(item.workflowIds),
    }))
    .sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * 전체 운영 메트릭 요약 집계 (기존 V1.1 서비스 호환)
 */
export function calculateOverviewMetrics(
  workflowResults: WorkflowAnalysisResult[],
  allBottlenecks: BottleneckItem[]
): OperationsOverviewMetrics {
  if (!workflowResults || workflowResults.length === 0) {
    return {
      totalWorkflows: 0,
      totalTimeMinutes: 0,
      totalCostAmount: 0,
      bottleneckCount: 0,
      totalNodes: 0,
    };
  }

  const totalTimeMinutes = workflowResults.reduce((acc, w) => acc + w.totalMinutes, 0);
  const totalCostAmount = workflowResults.reduce((acc, w) => acc + w.totalCost, 0);
  const totalNodes = workflowResults.reduce((acc, w) => acc + w.totalNodes, 0);
  const bottleneckCount = (allBottlenecks && allBottlenecks.length) || 0;

  return {
    totalWorkflows: workflowResults.length,
    totalTimeMinutes,
    totalCostAmount,
    bottleneckCount,
    totalNodes,
  };
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
