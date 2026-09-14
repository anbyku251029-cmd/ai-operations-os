import { DbNode } from '@/lib/persistence/workflow-types';
import {
  OperationsOverviewMetrics,
  OwnerLoadItem,
  ToolUsageItem,
  WorkflowAnalysisInput,
  WorkflowAnalysisResult,
  BottleneckItem,
} from '../types/intelligence-types';

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
 * 단일 노드 목록으로부터 총 소요 시간(분) 합산
 */
export function calculateTotalMinutes(nodes: DbNode[]): number {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return 0;
  }
  return nodes.reduce((acc, node) => acc + safeNumber(node.duration), 0);
}

/**
 * 단일 노드 목록으로부터 총 비용(원) 합산
 */
export function calculateTotalCost(nodes: DbNode[]): number {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return 0;
  }
  return nodes.reduce((acc, node) => acc + safeNumber(node.cost), 0);
}

/**
 * 전체 입력 데이터로부터 담당자(Owner)별 부하 분석 집계
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
 * 전체 입력 데이터로부터 도구(Tool)별 활용 통계 집계
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
 * 전체 운영 메트릭 요약 집계
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
