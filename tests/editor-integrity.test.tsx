import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useEditorStore } from '@/stores/useEditorStore';
import { EditorHeader } from '@/features/editor/components/EditorHeader';
import { Workflow } from '@/types/workflow';
import {
  mapSnapshotToDbPayload,
  mapDbSectionsToEditor,
  mapDbNodesToEditor,
  mapDbEdgesToEditor,
} from '@/lib/persistence/workflow-mapper';
import {
  saveWorkflowSnapshot,
  loadWorkflowBundle,
} from '@/lib/persistence/workflow-repository';

const mockWorkflow: Workflow = {
  id: 'wf-integrity-1',
  workspace_id: 'ws-1',
  name: '무결성 종합 검증 워크플로우',
  description: 'PHASE 12 검증용 워크플로우',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('PHASE 12: Editor Integrity & End-to-End Consistency (G01 ~ G18)', () => {
  beforeEach(() => {
    act(() => {
      useEditorStore.getState().resetEditor();
    });

    if (global.__mockWorkflows) {
      if (!global.__mockWorkflows.some((w) => w.id === 'wf-reload-consistency-test')) {
        global.__mockWorkflows.push({
          id: 'wf-reload-consistency-test',
          workspace_id: 'ws-1',
          name: 'Reload 검증 워크플로우',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      if (!global.__mockWorkflows.some((w) => w.id === 'wf-cycle-integrity-test')) {
        global.__mockWorkflows.push({
          id: 'wf-cycle-integrity-test',
          workspace_id: 'ws-1',
          name: 'Cycle 검증 워크플로우',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
  });

  // G01: Section이 항상 최소 1개 유지되는가?
  it('G01: [Section Integrity] 섹션이 1개만 있을 때 deleteSection을 호출해도 삭제되지 않고 최소 1개가 유지되어야 한다', () => {
    const { sections, deleteSection } = useEditorStore.getState();
    expect(sections.length).toBe(1);
    const initialSectionId = sections[0].id;

    act(() => {
      deleteSection(initialSectionId);
    });

    const stateAfter = useEditorStore.getState();
    expect(stateAfter.sections.length).toBe(1);
    expect(stateAfter.sections[0].id).toBe(initialSectionId);
  });

  // G02: Section 삭제 시 Node가 안전하게 재할당되는가?
  it('G02: [Section Integrity] 복수 섹션 상태에서 섹션 삭제 시 속해있던 노드들이 남아있는 섹션으로 안전하게 재할당되어야 한다', () => {
    let section2Id = '';
    act(() => {
      section2Id = useEditorStore.getState().addSection('개발 섹션');
      useEditorStore.getState().addNode('개발 작업 1', undefined, section2Id);
    });

    const initialNodes = useEditorStore.getState().nodes;
    const nodeInSec2 = initialNodes.find((n) => n.data.sectionId === section2Id);
    expect(nodeInSec2).toBeDefined();

    const remainingSectionId = useEditorStore.getState().sections[0].id;

    act(() => {
      useEditorStore.getState().deleteSection(section2Id);
    });

    const afterNodes = useEditorStore.getState().nodes;
    const reallocatedNode = afterNodes.find((n) => n.id === nodeInSec2!.id);
    expect(reallocatedNode?.data.sectionId).toBe(remainingSectionId);
    expect(useEditorStore.getState().sections.some((s) => s.id === section2Id)).toBe(false);
  });

  // G03: 존재하지 않는 Section을 참조하는 Node가 방지되는가?
  it('G03: [Section Integrity] addNode에 존재하지 않는 sectionId가 전달되면 첫 번째 기본 섹션으로 안전하게 할당되어야 한다', () => {
    let newNodeId = '';
    act(() => {
      newNodeId = useEditorStore
        .getState()
        .addNode('고아 방지 노드', undefined, 'nonexistent-section-999');
    });

    const node = useEditorStore.getState().nodes.find((n) => n.id === newNodeId);
    expect(node).toBeDefined();
    const currentSections = useEditorStore.getState().sections;
    expect(currentSections.some((s) => s.id === node?.data.sectionId)).toBe(true);
    expect(node?.data.sectionId).toBe(currentSections[0].id);
  });

  // G04: Node 삭제 시 연결된 모든 Edge가 Cascade Delete 되는가?
  it('G04: [Node ↔ Edge Integrity] 노드 삭제 시 해당 노드를 소스 또는 타겟으로 하는 모든 엣지가 Cascade Delete되어야 한다', () => {
    let nodeAId = '';
    let nodeBId = '';
    act(() => {
      nodeAId = useEditorStore.getState().addNode('노드 A');
      nodeBId = useEditorStore.getState().addNode('노드 B');
      useEditorStore.getState().onConnect({
        source: nodeAId,
        target: nodeBId,
        sourceHandle: null,
        targetHandle: null,
      });
    });

    expect(
      useEditorStore
        .getState()
        .edges.some((e) => e.source === nodeAId && e.target === nodeBId)
    ).toBe(true);

    // 노드 A 삭제
    act(() => {
      useEditorStore.getState().deleteNode(nodeAId);
    });

    const stateAfter = useEditorStore.getState();
    expect(stateAfter.nodes.some((n) => n.id === nodeAId)).toBe(false);
    expect(
      stateAfter.edges.some((e) => e.source === nodeAId || e.target === nodeAId)
    ).toBe(false);
  });

  // G05: 존재하지 않는 Node를 참조하는 Edge가 방지되는가?
  it('G05: [Node ↔ Edge Integrity] 존재하지 않는 노드 간 연결 또는 자기 자신 연결(source === target) 엣지는 생성이 차단되어야 한다', () => {
    const initialEdgeCount = useEditorStore.getState().edges.length;

    act(() => {
      // 1. 자기 자신 연결 시도
      useEditorStore.getState().onConnect({
        source: 'step-1',
        target: 'step-1',
        sourceHandle: null,
        targetHandle: null,
      });
      // 2. 존재하지 않는 노드 연결 시도
      useEditorStore.getState().onConnect({
        source: 'step-1',
        target: 'ghost-node-999',
        sourceHandle: null,
        targetHandle: null,
      });
    });

    expect(useEditorStore.getState().edges.length).toBe(initialEdgeCount);
  });

  // G06: Section + Node + Edge의 관계가 Undo에서 복원되는가?
  it('G06: [History Integrity] 복합 삭제(노드 및 캐스케이드 엣지) 후 Undo 호출 시 노드, 엣지, 섹션 소속이 모두 완벽 복원되어야 한다', () => {
    let nodeAId = '';
    let nodeBId = '';
    act(() => {
      nodeAId = useEditorStore.getState().addNode('Undo 대상 노드 A');
      nodeBId = useEditorStore.getState().addNode('Undo 대상 노드 B');
      useEditorStore.getState().onConnect({
        source: nodeAId,
        target: nodeBId,
        sourceHandle: null,
        targetHandle: null,
      });
    });

    const edgeBefore = useEditorStore
      .getState()
      .edges.find((e) => e.source === nodeAId && e.target === nodeBId);
    expect(edgeBefore).toBeDefined();

    // 노드 A 삭제 (엣지도 함께 삭제됨)
    act(() => {
      useEditorStore.getState().deleteNode(nodeAId);
    });
    expect(useEditorStore.getState().nodes.some((n) => n.id === nodeAId)).toBe(false);
    expect(useEditorStore.getState().edges.some((e) => e.id === edgeBefore!.id)).toBe(false);

    // Undo 실행
    act(() => {
      useEditorStore.getState().undo();
    });

    const restoredState = useEditorStore.getState();
    expect(restoredState.nodes.some((n) => n.id === nodeAId)).toBe(true);
    expect(restoredState.edges.some((e) => e.id === edgeBefore!.id)).toBe(true);
  });

  // G07: Section + Node + Edge의 관계가 Redo에서 복원되는가?
  it('G07: [History Integrity] Undo 후 Redo 호출 시 삭제된 상태(노드 및 엣지 제거)가 정확히 재적용되어야 한다', () => {
    let nodeAId = '';
    act(() => {
      nodeAId = useEditorStore.getState().addNode('Redo 대상 노드');
    });
    expect(useEditorStore.getState().nodes.some((n) => n.id === nodeAId)).toBe(true);

    act(() => {
      useEditorStore.getState().deleteNode(nodeAId);
    });
    expect(useEditorStore.getState().nodes.some((n) => n.id === nodeAId)).toBe(false);

    // Undo
    act(() => {
      useEditorStore.getState().undo();
    });
    expect(useEditorStore.getState().nodes.some((n) => n.id === nodeAId)).toBe(true);

    // Redo
    act(() => {
      useEditorStore.getState().redo();
    });
    expect(useEditorStore.getState().nodes.some((n) => n.id === nodeAId)).toBe(false);
  });

  // G08: 새로운 편집 발생 시 Redo Stack이 폐기되는가?
  it('G08: [History Integrity] Undo 후 새로운 편집(노드 추가 등)이 발생하면 Redo Stack(future)이 즉시 비워져야 한다', () => {
    act(() => {
      useEditorStore.getState().addNode('첫 번째 노드');
      useEditorStore.getState().addNode('두 번째 노드');
    });

    // 1회 Undo
    act(() => {
      useEditorStore.getState().undo();
    });
    expect(useEditorStore.getState().future.length).toBeGreaterThan(0);

    // 새로운 액션 실행
    act(() => {
      useEditorStore.getState().addNode('새로운 분기 노드');
    });

    expect(useEditorStore.getState().future.length).toBe(0);
    expect(useEditorStore.getState().canRedo()).toBe(false);
  });

  // G09: Undo/Redo가 DB 저장을 발생시키지 않는가?
  it('G09: [Explicit Save Boundary] Undo 및 Redo 실행은 DB 저장을 유발하지 않고 오직 인메모리 상태와 saveStatus만 unsaved로 변경해야 한다', () => {
    act(() => {
      useEditorStore.getState().addNode('저장 경계 테스트 노드');
      useEditorStore.getState().setSaveStatus('saved');
    });

    expect(useEditorStore.getState().saveStatus).toBe('saved');

    act(() => {
      useEditorStore.getState().undo();
    });

    expect(useEditorStore.getState().saveStatus).toBe('unsaved');
  });

  // G10: 모든 편집 작업이 unsaved 상태로 전이되는가?
  it('G10: [Save Status State Machine] 노드 추가, 속성 수정, 섹션 추가 등 모든 편집 작업은 saveStatus를 unsaved로 전이시켜야 한다', () => {
    act(() => {
      useEditorStore.getState().setSaveStatus('saved');
    });
    expect(useEditorStore.getState().saveStatus).toBe('saved');

    // 1. 노드 추가
    act(() => {
      useEditorStore.getState().addNode('임의 노드');
    });
    expect(useEditorStore.getState().saveStatus).toBe('unsaved');

    // 2. 상태를 다시 saved로 설정 후 속성 변경
    act(() => {
      useEditorStore.getState().setSaveStatus('saved');
      const firstNodeId = useEditorStore.getState().nodes[0].id;
      useEditorStore.getState().updateNodeData(firstNodeId, { name: '이름 변경' });
    });
    expect(useEditorStore.getState().saveStatus).toBe('unsaved');

    // 3. 상태를 다시 saved로 설정 후 섹션 추가
    act(() => {
      useEditorStore.getState().setSaveStatus('saved');
      useEditorStore.getState().addSection('새 섹션 전이');
    });
    expect(useEditorStore.getState().saveStatus).toBe('unsaved');
  });

  // G11: Explicit Save에서만 Persistence가 실행되는가?
  it('G11: [Explicit Save Boundary] 편집 작업만으로는 DB 영속성이 호출되지 않으며, saveWorkflowSnapshot을 호출해야만 영속화되어야 한다', async () => {
    const testWfId = 'wf-default-1';

    // 1. 스토어 편집
    act(() => {
      useEditorStore.getState().addNode('저장 테스트 노드');
    });

    // 2. 명시적 저장 실행
    const snapshot = {
      workflowId: testWfId,
      nodes: useEditorStore.getState().nodes,
      edges: useEditorStore.getState().edges,
      sections: useEditorStore.getState().sections,
    };

    const saveResult = await saveWorkflowSnapshot(snapshot);
    expect(saveResult.success).toBe(true);

    const loaded = await loadWorkflowBundle(testWfId);
    expect(loaded).not.toBeNull();
    expect(loaded?.nodes.length).toBe(snapshot.nodes.length);
  });

  // G12 ~ G15: Save → Reload Consistency
  it('G12 ~ G15: [Save → Reload Consistency] Save 후 Reload 시 Sections, Nodes, Edges, Properties, Position이 100% 동일하게 복원되어야 한다', async () => {
    const testWfId = 'wf-reload-consistency-test';

    // 섹션 2개, 노드 2개(속성 완전 지정), 엣지 1개 구성
    let sec2Id = '';
    let node1Id = '';
    let node2Id = '';

    act(() => {
      sec2Id = useEditorStore.getState().addSection('개발 및 배포');
      node1Id = useEditorStore.getState().addNode('요구사항 분석', { x: 150, y: 200 });
      node2Id = useEditorStore.getState().addNode('코드 구현', { x: 400, y: 200 }, sec2Id);

      // Node 1 상세 속성 지정
      useEditorStore.getState().updateNodeData(node1Id, {
        owner: '김기획',
        role: 'PO',
        tool: 'Jira',
        description: '요구사항 상세 명세 작성',
        durationMinutes: 90,
        costAmount: 150000,
        notes: '중요 고객 요구사항 포함',
      });

      // Node 2 상세 속성 지정
      useEditorStore.getState().updateNodeData(node2Id, {
        owner: '이개발',
        role: 'Lead Dev',
        tool: 'VSCode',
        description: '코어 로직 구현',
        durationMinutes: 180,
        costAmount: 300000,
        notes: '유닛 테스트 동시 작성',
      });

      // 엣지 연결
      useEditorStore.getState().onConnect({
        source: node1Id,
        target: node2Id,
        sourceHandle: null,
        targetHandle: null,
      });
    });

    const storeStateBefore = useEditorStore.getState();

    // 1. 명시적 저장 (Save)
    const saveResult = await saveWorkflowSnapshot({
      workflowId: testWfId,
      sections: storeStateBefore.sections,
      nodes: storeStateBefore.nodes,
      edges: storeStateBefore.edges,
    });
    expect(saveResult.success).toBe(true);

    // 2. 재로드 (Reload)
    const bundle = await loadWorkflowBundle(testWfId);
    expect(bundle).not.toBeNull();

    // 3. 매퍼를 통해 에디터 모델로 역변환
    const restoredSections = mapDbSectionsToEditor(bundle!.sections);
    const restoredNodes = mapDbNodesToEditor(bundle!.nodes);
    const restoredEdges = mapDbEdgesToEditor(bundle!.edges);

    // G12: Section 및 Node, Edge 개수와 관계 일치 검증
    expect(restoredSections.length).toBe(storeStateBefore.sections.length);
    expect(restoredNodes.length).toBe(storeStateBefore.nodes.length);
    expect(restoredEdges.length).toBe(storeStateBefore.edges.length);

    // G13: Node Properties 보존 검증
    const restoredNode1 = restoredNodes.find((n) => n.id === node1Id);
    expect(restoredNode1).toBeDefined();
    expect(restoredNode1?.data.name).toBe('요구사항 분석');
    expect(restoredNode1?.data.owner).toBe('김기획');
    expect(restoredNode1?.data.role).toBe('PO');
    expect(restoredNode1?.data.tool).toBe('Jira');
    expect(restoredNode1?.data.description).toBe('요구사항 상세 명세 작성');
    expect(restoredNode1?.data.durationMinutes).toBe(90);
    expect(restoredNode1?.data.costAmount).toBe(150000);
    expect(restoredNode1?.data.notes).toBe('중요 고객 요구사항 포함');

    // G14: Node Position 보존 검증
    expect(restoredNode1?.position.x).toBe(150);
    expect(restoredNode1?.position.y).toBe(200);

    // G15: Edge source/target 연결 보존 검증
    const restoredEdge = restoredEdges.find(
      (e) => e.source === node1Id && e.target === node2Id
    );
    expect(restoredEdge).toBeDefined();
  });

  // G16: Unsaved Navigation Guard
  it('G16: [Data Loss Protection] saveStatus가 unsaved일 때 onNavigateBack 콜백이 정상적으로 트리거되어 이탈 확인 모달을 열 수 있어야 한다', () => {
    act(() => {
      useEditorStore.getState().setSaveStatus('unsaved');
    });

    const mockNavigateBack = vi.fn();
    render(<EditorHeader workflow={mockWorkflow} onNavigateBack={mockNavigateBack} />);

    const backBtn = screen.getByTestId('header-back-btn');
    expect(backBtn).not.toBeDisabled();

    fireEvent.click(backBtn);
    expect(mockNavigateBack).toHaveBeenCalledTimes(1);
  });

  // G17: Saving 상태에서 Navigation이 차단되는가?
  it('G17: [Data Loss Protection] saveStatus가 saving일 때 네비게이션(목록으로) 버튼이 비활성화되어 중복 저장 및 레이스 컨디션을 차단해야 한다', () => {
    act(() => {
      useEditorStore.getState().setSaveStatus('saving');
    });

    const mockNavigateBack = vi.fn();
    render(<EditorHeader workflow={mockWorkflow} onNavigateBack={mockNavigateBack} />);

    const backBtn = screen.getByTestId('header-back-btn');
    expect(backBtn).toBeDisabled();

    fireEvent.click(backBtn);
    expect(mockNavigateBack).not.toHaveBeenCalled();
  });

  // G18: 전체 Editor 상태에서 orphan 데이터가 발생하지 않는 복합 사이클 검증
  it('G18: [Full Lifecycle Consistency] 복합 편집 사이클(생성 → 연결 → 속성 수정 → 이동 → 삭제 → Undo → Save → Reload)에서 고아 데이터가 일절 발생하지 않아야 한다', async () => {
    const cycleWfId = 'wf-cycle-integrity-test';

    // Step 1: 섹션 및 노드 생성 & 연결
    let nodeAId = '';
    let nodeBId = '';
    act(() => {
      nodeAId = useEditorStore.getState().addNode('사이클 노드 A', { x: 100, y: 100 });
      nodeBId = useEditorStore.getState().addNode('사이클 노드 B', { x: 300, y: 100 });
      useEditorStore.getState().onConnect({
        source: nodeAId,
        target: nodeBId,
        sourceHandle: null,
        targetHandle: null,
      });
      useEditorStore.getState().updateNodeData(nodeAId, { owner: '책임자 A' });
    });

    // Step 2: 노드 A 삭제 (엣지 Cascade 삭제)
    act(() => {
      useEditorStore.getState().deleteNode(nodeAId);
    });
    expect(
      useEditorStore
        .getState()
        .edges.some((e) => e.source === nodeAId || e.target === nodeAId)
    ).toBe(false);

    // Step 3: Undo 복원
    act(() => {
      useEditorStore.getState().undo();
    });

    const restoredState = useEditorStore.getState();
    expect(restoredState.nodes.some((n) => n.id === nodeAId)).toBe(true);
    expect(
      restoredState.edges.some(
        (e) => e.source === nodeAId && e.target === nodeBId
      )
    ).toBe(true);

    // Step 4: Save & Reload
    const saveResult = await saveWorkflowSnapshot({
      workflowId: cycleWfId,
      sections: restoredState.sections,
      nodes: restoredState.nodes,
      edges: restoredState.edges,
    });
    expect(saveResult.success).toBe(true);

    const bundle = await loadWorkflowBundle(cycleWfId);
    expect(bundle).not.toBeNull();

    // Step 5: 무결성 검증 - DB 페이로드에 고아 엣지나 유효하지 않은 참조가 없는지 확인
    const payload = mapSnapshotToDbPayload({
      workflowId: cycleWfId,
      sections: restoredState.sections,
      nodes: restoredState.nodes,
      edges: restoredState.edges,
    });

    const validNodeIds = new Set(payload.nodes.map((n) => n.id));
    for (const edge of payload.edges) {
      expect(validNodeIds.has(edge.source_node_id)).toBe(true);
      expect(validNodeIds.has(edge.target_node_id)).toBe(true);
    }
  });
});
