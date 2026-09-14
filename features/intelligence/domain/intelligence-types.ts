/**
 * Operations Intelligence Domain Types
 * Phase 22 — Pure Domain Contracts
 */

/**
 * 4단계 운영 개선 우선순위
 */
export type OperationalPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * 입력 단계(Node) 계약 인터페이스
 * DB 노드(duration, cost)와 에디터 노드(durationMinutes, costAmount)를 모두 안전하게 수용
 */
export interface IntelligenceInputNode {
  id: string;
  name: string;
  owner?: string | null;
  role?: string | null;
  tool?: string | null;
  duration?: number | null;
  durationMinutes?: number | null;
  cost?: number | null;
  costAmount?: number | null;
  description?: string | null;
  sectionId?: string | null;
}

/**
 * 입력 연결선(Edge) 계약 인터페이스
 */
export interface IntelligenceInputEdge {
  id?: string;
  source: string;
  target: string;
  source_node_id?: string;
  target_node_id?: string;
}

/**
 * 분석 대상 워크플로우 입력 계약
 */
export interface IntelligenceInputWorkflow {
  id: string;
  name: string;
  description?: string | null;
  nodes: IntelligenceInputNode[];
  edges?: IntelligenceInputEdge[];
}

/**
 * 워크플로우 단위 종합 수치 메트릭
 */
export interface WorkflowMetrics {
  totalMinutes: number;
  totalCost: number;
  averageMinutes: number;
  nodeCount: number;
  missingDurationCount: number;
  missingCostCount: number;
}

/**
 * 담당자(Owner)별 업무 부하 집계
 */
export interface OwnerLoad {
  ownerName: string;
  stepCount: number;
  totalMinutes: number;
  totalCost: number;
}

/**
 * 도구(Tool)별 활용 집계
 */
export interface ToolUsage {
  toolName: string;
  usageCount: number;
}

/**
 * 단일 병목 원인 상세 설명
 */
export interface BottleneckReason {
  ruleId: string;
  title: string;
  description: string;
  measuredValue?: number | string;
  thresholdValue?: number | string;
}

/**
 * 개별 노드에 대한 운영 및 병목 분석 결과
 */
export interface NodeAnalysis {
  nodeId: string;
  nodeName: string;
  isBottleneck: boolean;
  reasons: string[];
  priority: OperationalPriority;
  durationMinutes: number;
  costAmount: number;
  owner: string;
  tool: string;
  incomingEdgeCount: number;
  outgoingEdgeCount: number;
  isMissingDuration: boolean;
  isMissingCost: boolean;
  isMissingOwner: boolean;
  isMissingTool: boolean;
}

/**
 * 워크플로우 단위 종합 분석 결과
 */
export interface WorkflowAnalysis {
  workflowId: string;
  workflowName: string;
  description?: string | null;
  metrics: WorkflowMetrics;
  nodeAnalyses: NodeAnalysis[];
  bottlenecks: NodeAnalysis[];
  ownerLoads: OwnerLoad[];
  toolUsages: ToolUsage[];
  longestNode: IntelligenceInputNode | null;
  mostExpensiveNode: IntelligenceInputNode | null;
  operationalPriority: OperationalPriority;
  priorityReasons: string[];
}
