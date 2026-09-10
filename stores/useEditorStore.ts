import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
  MarkerType,
} from '@xyflow/react';
import {
  EditorNode,
  EditorEdge,
  generateNodeId,
  generateEdgeId,
} from '@/features/editor/types/editor';
import {
  EditorSection,
  generateSectionId,
  DEFAULT_INITIAL_SECTIONS,
} from '@/features/editor/types/section';

export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

/**
 * [LOCK 01 & 03] In-Memory History Snapshot for Undo / Redo
 */
export interface EditorHistorySnapshot {
  sections: EditorSection[];
  nodes: EditorNode[];
  edges: EditorEdge[];
}

interface EditorState {
  // Panel visibility
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;

  // Save state machine
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;

  // Selection
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedEdgeId: string | null;
  setSelectedEdgeId: (id: string | null) => void;

  // Inspector active tab
  activePropertiesTab: 'properties' | 'execution';
  setActivePropertiesTab: (tab: 'properties' | 'execution') => void;

  // [LOCK 01] Multi-Section State
  sections: EditorSection[];
  setSections: (sections: EditorSection[]) => void;
  addSection: (name?: string) => string;
  updateSection: (id: string, name: string) => void;
  deleteSection: (id: string) => void;
  toggleSectionCollapse: (id: string) => void;

  // Canvas Nodes State
  nodes: EditorNode[];
  setNodes: (nodes: EditorNode[]) => void;
  onNodesChange: (changes: NodeChange<EditorNode>[]) => void;
  addNode: (
    name?: string,
    position?: { x: number; y: number },
    sectionId?: string
  ) => string;
  deleteNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<EditorNode['data']>) => void;

  // [LOCK 01] Canvas Edges State
  edges: EditorEdge[];
  setEdges: (edges: EditorEdge[]) => void;
  onEdgesChange: (changes: EdgeChange<EditorEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  deleteEdge: (id: string) => void;

  // [LOCK 01 ~ 05] In-Memory Undo / Redo History
  past: EditorHistorySnapshot[];
  future: EditorHistorySnapshot[];
  isInternalHistoryAction: boolean;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  onNodeDragStart: () => void;

  // Reset store
  resetEditor: () => void;
}

const DEFAULT_INITIAL_NODES: EditorNode[] = [
  {
    id: 'step-1',
    type: 'workflowNode',
    position: { x: 120, y: 140 },
    data: {
      workflowNodeId: 'step-1',
      sectionId: 'section-1',
      name: '1. 기본 정보 입력',
      owner: '인사담당자',
      role: 'HR Manager',
      tool: 'Google Forms',
      description: '신규 입사자의 기본 인적사항 및 서류를 수집합니다.',
    },
  },
  {
    id: 'step-2',
    type: 'workflowNode',
    position: { x: 440, y: 140 },
    data: {
      workflowNodeId: 'step-2',
      sectionId: 'section-1',
      name: '2. 계약서 검토 및 서명',
      owner: '법무팀장',
      role: 'Legal Lead',
      tool: 'DocuSign',
      description: '근로계약서 및 보안 서약서를 전자 서명합니다.',
    },
  },
];

const DEFAULT_INITIAL_EDGES: EditorEdge[] = [
  {
    id: 'edge-step-1-step-2',
    source: 'step-1',
    target: 'step-2',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: '#64748b',
    },
    style: {
      stroke: '#64748b',
      strokeWidth: 2,
    },
  },
];

export const useEditorStore = create<EditorState>((set, get) => ({
  isLeftPanelOpen: true,
  isRightPanelOpen: true,
  toggleLeftPanel: () => set((state) => ({ isLeftPanelOpen: !state.isLeftPanelOpen })),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  setLeftPanelOpen: (open) => set({ isLeftPanelOpen: open }),
  setRightPanelOpen: (open) => set({ isRightPanelOpen: open }),

  saveStatus: 'saved',
  setSaveStatus: (status) => set({ saveStatus: status }),

  selectedNodeId: null,
  setSelectedNodeId: (id) => {
    set((state) => ({
      selectedNodeId: id,
      selectedEdgeId: id ? null : state.selectedEdgeId,
      nodes: state.nodes.map((node) => ({
        ...node,
        selected: node.id === id,
      })),
      edges: id ? state.edges.map((e) => ({ ...e, selected: false })) : state.edges,
    }));
  },

  selectedEdgeId: null,
  setSelectedEdgeId: (id) => {
    set((state) => ({
      selectedEdgeId: id,
      selectedNodeId: id ? null : state.selectedNodeId,
      edges: state.edges.map((edge) => ({
        ...edge,
        selected: edge.id === id,
      })),
      nodes: id ? state.nodes.map((n) => ({ ...n, selected: false })) : state.nodes,
    }));
  },

  activePropertiesTab: 'properties',
  setActivePropertiesTab: (tab) => set({ activePropertiesTab: tab }),

  nodes: DEFAULT_INITIAL_NODES,
  setNodes: (nodes) => set({ nodes }),

  onNodesChange: (changes) => {
    set((state) => {
      const nextNodes = applyNodeChanges(changes, state.nodes) as EditorNode[];

      const hasMovementOrRemoval = changes.some(
        (c) => c.type === 'position' || c.type === 'remove'
      );

      const selectionChange = changes.find((c) => c.type === 'select');
      let nextSelectedId = state.selectedNodeId;
      if (selectionChange && selectionChange.type === 'select') {
        if (selectionChange.selected) {
          nextSelectedId = selectionChange.id;
        } else if (nextSelectedId === selectionChange.id) {
          nextSelectedId = null;
        }
      }

      return {
        nodes: nextNodes,
        selectedNodeId: nextSelectedId,
        saveStatus: hasMovementOrRemoval ? 'unsaved' : state.saveStatus,
      };
    });
  },

  // [LOCK 01 ~ 05] In-Memory Undo / Redo History State
  past: [],
  future: [],
  isInternalHistoryAction: false,

  pushHistory: () => {
    const { sections, nodes, edges, past, isInternalHistoryAction } = get();
    if (isInternalHistoryAction) return;

    // 현재 상태의 깊은 복사 스냅샷 생성
    const snapshot: EditorHistorySnapshot = {
      sections: JSON.parse(JSON.stringify(sections)),
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };

    const nextPast = [...past, snapshot];
    // [LOCK 05] 최대 50개 유지 (오래된 것부터 제거)
    if (nextPast.length > 50) {
      nextPast.shift();
    }

    set({
      past: nextPast,
      future: [], // [LOCK 04] Redo Stack Invalidation
    });
  },

  onNodeDragStart: () => {
    // 노드 드래그 시작 시 1회 스냅샷 캡처 (Section 8)
    get().pushHistory();
  },

  undo: () => {
    const { past, future, sections, nodes, edges } = get();
    if (past.length === 0) return;

    const previousSnapshot = past[past.length - 1];
    const nextPast = past.slice(0, past.length - 1);

    const currentSnapshot: EditorHistorySnapshot = {
      sections: JSON.parse(JSON.stringify(sections)),
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };

    set({
      isInternalHistoryAction: true,
      sections: previousSnapshot.sections || DEFAULT_INITIAL_SECTIONS,
      nodes: previousSnapshot.nodes,
      edges: previousSnapshot.edges,
      past: nextPast,
      future: [currentSnapshot, ...future],
      saveStatus: 'unsaved', // [LOCK 02 & 14]
      selectedNodeId: null,
      selectedEdgeId: null,
    });

    set({ isInternalHistoryAction: false });
  },

  redo: () => {
    const { past, future, sections, nodes, edges } = get();
    if (future.length === 0) return;

    const nextSnapshot = future[0];
    const nextFuture = future.slice(1);

    const currentSnapshot: EditorHistorySnapshot = {
      sections: JSON.parse(JSON.stringify(sections)),
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };

    set({
      isInternalHistoryAction: true,
      sections: nextSnapshot.sections || DEFAULT_INITIAL_SECTIONS,
      nodes: nextSnapshot.nodes,
      edges: nextSnapshot.edges,
      past: [...past, currentSnapshot],
      future: nextFuture,
      saveStatus: 'unsaved', // [LOCK 02 & 14]
      selectedNodeId: null,
      selectedEdgeId: null,
    });

    set({ isInternalHistoryAction: false });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  // [LOCK 01] Multi-Section state & actions
  sections: DEFAULT_INITIAL_SECTIONS,
  setSections: (sections) => set({ sections }),

  addSection: (customName) => {
    get().pushHistory();
    const newId = generateSectionId();
    const currentSections = get().sections;
    const position = currentSections.length;
    const name = customName || `새 섹션 ${position + 1}`;

    const newSection: EditorSection = {
      id: newId,
      name,
      position,
      isCollapsed: false,
    };

    set((state) => ({
      sections: [...state.sections, newSection],
      saveStatus: 'unsaved',
    }));

    return newId;
  },

  updateSection: (id, name) => {
    set((state) => ({
      sections: state.sections.map((s) => (s.id === id ? { ...s, name } : s)),
      saveStatus: 'unsaved',
    }));
  },

  deleteSection: (id) => {
    const { sections, nodes } = get();
    if (sections.length <= 1) {
      // [LOCK 02] 최소 1개의 섹션은 유지
      return;
    }

    get().pushHistory();

    const remainingSections = sections.filter((s) => s.id !== id);
    const fallbackSectionId = remainingSections[0]?.id || 'section-1';

    // [LOCK 02] 삭제된 섹션에 속한 노드들은 남아있는 첫 번째 섹션으로 안전하게 재할당
    const updatedNodes = nodes.map((n) =>
      n.data.sectionId === id
        ? { ...n, data: { ...n.data, sectionId: fallbackSectionId } }
        : n
    );

    set({
      sections: remainingSections,
      nodes: updatedNodes,
      saveStatus: 'unsaved',
    });
  },

  toggleSectionCollapse: (id) => {
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === id ? { ...s, isCollapsed: !s.isCollapsed } : s
      ),
    }));
  },

  addNode: (customName, customPosition, sectionId) => {
    // [LOCK 03] 새 노드 추가 전 스냅샷 기록
    get().pushHistory();

    const newId = generateNodeId();
    const currentNodes = get().nodes;
    const currentSections = get().sections;
    const targetSectionId =
      sectionId && currentSections.some((s) => s.id === sectionId)
        ? sectionId
        : currentSections[0]?.id || 'section-1';

    const position = customPosition || {
      x: 100 + (currentNodes.length % 4) * 80,
      y: 120 + currentNodes.length * 60,
    };

    const stepNumber = currentNodes.length + 1;
    const name = customName || `새 단계 ${stepNumber}`;

    const newNode: EditorNode = {
      id: newId,
      type: 'workflowNode',
      position,
      data: {
        workflowNodeId: newId,
        sectionId: targetSectionId,
        name,
        owner: '담당자 미지정',
        role: '역할 미지정',
        tool: '도구 미지정',
        description: '',
      },
      selected: true,
    };

    set((state) => ({
      nodes: [
        ...state.nodes.map((n) => ({ ...n, selected: false })),
        newNode,
      ],
      selectedNodeId: newId,
      selectedEdgeId: null,
      saveStatus: 'unsaved',
    }));

    return newId;
  },

  // [LOCK 03] Node 삭제 시 연결된 Edge는 Cascade Delete하며, 전체 상태를 1회 pushHistory한다
  deleteNode: (id) => {
    get().pushHistory();

    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      saveStatus: 'unsaved',
    }));
  },

  updateNodeData: (id, partialData) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...partialData } } : n
      ),
      saveStatus: 'unsaved',
    }));
  },

  // [LOCK 01 & 02] Edges management
  edges: DEFAULT_INITIAL_EDGES,
  setEdges: (edges) => set({ edges }),

  onEdgesChange: (changes) => {
    set((state) => {
      const nextEdges = applyEdgeChanges(changes, state.edges) as EditorEdge[];
      const hasRemoval = changes.some((c) => c.type === 'remove');

      const selectionChange = changes.find((c) => c.type === 'select');
      let nextSelectedEdgeId = state.selectedEdgeId;
      if (selectionChange && selectionChange.type === 'select') {
        if (selectionChange.selected) {
          nextSelectedEdgeId = selectionChange.id;
        } else if (nextSelectedEdgeId === selectionChange.id) {
          nextSelectedEdgeId = null;
        }
      }

      return {
        edges: nextEdges,
        selectedEdgeId: nextSelectedEdgeId,
        saveStatus: hasRemoval ? 'unsaved' : state.saveStatus,
      };
    });
  },

  // [LOCK 02] Duplicate Edge는 동일한 source + target 조합으로 정의
  onConnect: (connection) => {
    if (!connection.source || !connection.target) return;

    // 자기 자신 연결 차단
    if (connection.source === connection.target) {
      return;
    }

    const { nodes, edges } = get();

    // [LOCK 01 & PHASE 12] 소스 및 타겟 노드 실존 여부 검증 (고아 엣지 방지)
    const sourceExists = nodes.some((n) => n.id === connection.source);
    const targetExists = nodes.some((n) => n.id === connection.target);
    if (!sourceExists || !targetExists) {
      return;
    }

    // 동일 source + target 중복 연결 차단
    const isDuplicate = edges.some(
      (e) => e.source === connection.source && e.target === connection.target
    );
    if (isDuplicate) {
      return;
    }

    // [LOCK 03] 유효한 엣지 생성 전 스냅샷 기록
    get().pushHistory();

    const newEdge: EditorEdge = {
      id: generateEdgeId(),
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: '#64748b',
      },
      style: {
        stroke: '#64748b',
        strokeWidth: 2,
      },
    };

    set((state) => ({
      edges: [...state.edges, newEdge],
      saveStatus: 'unsaved',
    }));
  },

  deleteEdge: (id) => {
    // [LOCK 03] 엣지 삭제 전 스냅샷 기록
    get().pushHistory();

    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
      saveStatus: 'unsaved',
    }));
  },

  resetEditor: () =>
    set({
      isLeftPanelOpen: true,
      isRightPanelOpen: true,
      saveStatus: 'saved',
      selectedNodeId: null,
      selectedEdgeId: null,
      activePropertiesTab: 'properties',
      past: [],
      future: [],
      isInternalHistoryAction: false,
      nodes: DEFAULT_INITIAL_NODES,
      edges: DEFAULT_INITIAL_EDGES,
      sections: DEFAULT_INITIAL_SECTIONS,
    }),
}));
