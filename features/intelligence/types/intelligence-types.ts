import { Workflow } from '@/types/workflow';
import { DbNode, DbEdge, DbSection } from '@/lib/persistence/workflow-types';

/**
 * 4대 핵심 운영 요약 메트릭
 */
export interface OperationsOverviewMetrics {
  totalWorkflows: number;
  totalTimeMinutes: number;
  totalCostAmount: number;
  bottleneckCount: number;
  totalNodes: number;
}

/**
 * 병목 위험도 심각성 수준
 */
export type BottleneckSeverity = 'high' | 'medium' | 'low';

/**
 * 병목 유형
 */
export type BottleneckType =
  | 'duration_overload' // 소요 시간 초과 (병목 노드)
  | 'cost_overload'     // 단일 노드 비용 과다
  | 'orphan_node'      // 엣지가 전혀 연결되지 않은 고립 단계
  | 'high_fan_in'      // 3개 이상의 다중 진입으로 지연 위험
  | 'unassigned_owner'; // 담당자 미지정으로 인한 책임 불분명

/**
 * 식별된 병목 항목 상세 인터페이스
 */
export interface BottleneckItem {
  id: string;
  workflowId: string;
  workflowName: string;
  nodeId: string;
  nodeName: string;
  type: BottleneckType;
  severity: BottleneckSeverity;
  reason: string;
  recommendation: string;
  metricValue?: number;
  thresholdValue?: number;
}

/**
 * 담당자(Owner)별 부하 분석 항목
 */
export interface OwnerLoadItem {
  ownerName: string;
  role: string;
  stepCount: number;
  totalMinutes: number;
  totalCost: number;
  workflowIds: string[];
}

/**
 * 도구(Tool)별 활용 통계 항목
 */
export interface ToolUsageItem {
  toolName: string;
  usageCount: number;
  associatedOwners: string[];
  workflowIds: string[];
}

/**
 * 운영 개선 권고 우선순위 항목
 */
export interface ImprovementPriorityItem {
  id: string;
  priority: 'P1' | 'P2' | 'P3';
  title: string;
  targetWorkflowId: string;
  targetWorkflowName: string;
  description: string;
  expectedBenefit: string;
}

/**
 * 워크플로우 단위 상세 분석 결과
 */
export interface WorkflowAnalysisResult {
  workflowId: string;
  workflowName: string;
  description?: string | null;
  updatedAt: string;
  totalNodes: number;
  totalEdges: number;
  totalMinutes: number;
  totalCost: number;
  bottlenecks: BottleneckItem[];
  ownerCount: number;
  toolCount: number;
}

/**
 * Operations Intelligence 종합 분석 페이로드
 */
export interface IntelligenceAnalysisBundle {
  overview: OperationsOverviewMetrics;
  workflows: WorkflowAnalysisResult[];
  bottlenecks: BottleneckItem[];
  ownerLoads: OwnerLoadItem[];
  toolUsages: ToolUsageItem[];
  priorities: ImprovementPriorityItem[];
  analyzedAt: string;
}

/**
 * 분석 입력 데이터 단위
 */
export interface WorkflowAnalysisInput {
  workflow: Workflow;
  nodes: DbNode[];
  edges: DbEdge[];
  sections?: DbSection[];
}
