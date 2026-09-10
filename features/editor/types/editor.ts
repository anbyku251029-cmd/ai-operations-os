import { Node, Edge } from '@xyflow/react';

/**
 * Node Data Contract for OPS Blueprint V1
 */
export interface WorkflowNodeData {
  workflowNodeId: string;
  name: string;
  owner?: string;
  role?: string;
  tool?: string;
  description?: string;
  sectionId?: string | null;
  durationMinutes?: number | null;
  costAmount?: number | null;
  notes?: string;
  [key: string]: unknown;
}

export type EditorNode = Node<WorkflowNodeData, 'workflowNode'>;

/**
 * [LOCK 01] Edge Data Contract for OPS Blueprint V1 (최소 데이터 구조)
 * V1에서는 id, source, target, type 기반의 최소 데이터만 사용
 */
export interface WorkflowEdgeData {
  [key: string]: unknown;
}

export type EditorEdge = Edge<WorkflowEdgeData>;

/**
 * 범용 UUID 생성 유틸리티 (Database UUID 호환)
 */
export function generateNodeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateEdgeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `edge-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
