import { create } from 'zustand';
import {
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
  Connection,
} from '@xyflow/react';
import { toast } from 'sonner';

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  cost?: number;
  timeMinutes?: number;
}

interface CanvasState {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNode: Node<WorkflowNodeData> | null;
  isSaving: boolean;
  isLoading: boolean;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setSelectedNode: (node: Node<WorkflowNodeData> | null) => void;
  updateNodeData: (id: string, data: Partial<WorkflowNodeData>) => void;
  addNode: () => void;
  deleteNode: (nodeId: string) => void;
  loadCanvas: () => Promise<void>;
  saveCanvas: () => Promise<void>;
}

const defaultNodes: Node<WorkflowNodeData>[] = [
  {
    id: 'node-1',
    type: 'workflowNode',
    position: { x: 100, y: 150 },
    data: { label: '고객 문의 접수', description: '채널톡 및 이메일 인바운드 수집', cost: 5000, timeMinutes: 10 },
  },
  {
    id: 'node-2',
    type: 'workflowNode',
    position: { x: 450, y: 150 },
    data: { label: '견적서 작성 및 검토', description: '요구사항 분석 후 맞춤 견적서 발송', cost: 20000, timeMinutes: 45 },
  },
  {
    id: 'node-3',
    type: 'workflowNode',
    position: { x: 800, y: 150 },
    data: { label: '계약 체결 및 Handoff', description: '전자 계약 체결 및 온보딩 팀 이관', cost: 15000, timeMinutes: 30 },
  },
];

const defaultEdges: Edge[] = [
  { id: 'edge-1-2', source: 'node-1', target: 'node-2', animated: true },
  { id: 'edge-2-3', source: 'node-2', target: 'node-3', animated: true },
];

/** 새 노드 추가 시 기존 노드와 겹치지 않도록 오프셋 기반 좌표 계산 */
function calcNextPosition(nodes: Node<WorkflowNodeData>[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 100, y: 100 };

  const last = nodes[nodes.length - 1];
  let x = last.position.x + 50;
  let y = last.position.y + 50;

  // 충돌 감지: 40px 이내에 다른 노드가 있으면 추가로 오프셋 적용 (최대 20회)
  const COLLISION_THRESHOLD = 40;
  let attempts = 0;
  while (
    attempts < 20 &&
    nodes.some(
      (n) =>
        Math.abs(n.position.x - x) < COLLISION_THRESHOLD &&
        Math.abs(n.position.y - y) < COLLISION_THRESHOLD
    )
  ) {
    x += 50;
    y += 50;
    attempts++;
  }

  return { x, y };
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: defaultNodes,
  edges: defaultEdges,
  selectedNode: null,
  isSaving: false,
  isLoading: false,

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as Node<WorkflowNodeData>[],
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ ...connection, animated: true }, get().edges),
    });
  },

  setSelectedNode: (node) => {
    set({ selectedNode: node });
  },

  // ✅ 중첩 set() 제거 — 노드와 selectedNode를 단일 set() 호출로 통합
  updateNodeData: (id, partialData) => {
    const updatedNodes = get().nodes.map((node) => {
      if (node.id !== id) return node;
      return { ...node, data: { ...node.data, ...partialData } };
    });

    const updatedSelected =
      get().selectedNode?.id === id
        ? (updatedNodes.find((n) => n.id === id) ?? null)
        : get().selectedNode;

    set({ nodes: updatedNodes, selectedNode: updatedSelected });
  },

  addNode: () => {
    const position = calcNextPosition(get().nodes);
    const newNode: Node<WorkflowNodeData> = {
      id: `node-${Date.now()}`,
      type: 'workflowNode',
      position,
      data: {
        label: '새 작업 단계',
        description: '단계 설명을 입력하세요.',
        cost: 10000,
        timeMinutes: 20,
      },
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  // ✅ 연쇄(cascade) 삭제 — 노드와 연결된 모든 엣지 동시 제거
  deleteNode: (nodeId) => {
    const { nodes, edges, selectedNode } = get();

    const nextNodes = nodes.filter((n) => n.id !== nodeId);
    const nextEdges = edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );

    // 삭제된 노드가 현재 선택 상태면 Inspector 패널도 닫기
    const nextSelected = selectedNode?.id === nodeId ? null : selectedNode;

    set({ nodes: nextNodes, edges: nextEdges, selectedNode: nextSelected });
    toast.success('단계가 삭제되었습니다.');
  },

  loadCanvas: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/canvas');
      const data = await res.json();
      if (data.nodes && data.nodes.length > 0) {
        set({ nodes: data.nodes, edges: data.edges || [] });
      }
    } catch (e) {
      console.error('캔버스 로드 실패:', e);
      toast.error('저장된 캔버스를 불러오지 못했습니다.');
    } finally {
      set({ isLoading: false });
    }
  },

  // ✅ alert() 완전 제거 — sonner toast로 교체
  saveCanvas: async () => {
    set({ isSaving: true });
    try {
      await fetch('/api/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: get().nodes, edges: get().edges }),
      });
      toast.success('캔버스가 저장되었습니다.');
    } catch (e) {
      toast.error(`저장 실패: ${e}`);
    } finally {
      set({ isSaving: false });
    }
  },
}));
export type WorkflowNodeType = Node<WorkflowNodeData, 'workflowNode'>;
