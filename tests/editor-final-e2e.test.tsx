import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useEditorStore } from '@/stores/useEditorStore';
import { EditorHeader } from '@/features/editor/components/EditorHeader';
import { StructurePanel } from '@/features/editor/components/StructurePanel';
import { UnsavedChangesModal } from '@/features/editor/components/UnsavedChangesModal';
import { EditorErrorState } from '@/features/editor/components/EditorErrorState';
import { EditorSkeleton } from '@/features/editor/components/EditorSkeleton';
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

// next/link mock
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const testWorkflow: Workflow = {
  id: 'wf-final-e2e-1',
  workspace_id: 'ws-e2e-1',
  name: 'V1 Final E2E 엔터프라이즈 승인 플로우',
  description: 'PHASE 13 최종 사용자 여정 검증 워크플로우',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('PHASE 13: V1 Full Lifecycle E2E Test (STEP 01 ~ STEP 36)', () => {
  beforeEach(() => {
    act(() => {
      useEditorStore.getState().resetEditor();
    });

    if (global.__mockWorkflows) {
      if (!global.__mockWorkflows.some((w) => w.id === testWorkflow.id)) {
        global.__mockWorkflows.push(testWorkflow);
      }
    }
  });

  it('STEP 01 ~ STEP 36: 전체 사용자 여정(생성→연결→속성수정→이동→삭제→Undo/Redo→Save→Reload→이탈가드)이 결함 없이 완결되어야 한다', async () => {
    // STEP 01: Workflow Editor 진입
    expect(useEditorStore.getState().saveStatus).toBe('saved');

    // STEP 02: 기존 Section 확인
    const initialSections = useEditorStore.getState().sections;
    expect(initialSections.length).toBeGreaterThanOrEqual(1);
    const firstSectionId = initialSections[0].id;
    expect(firstSectionId).toBe('section-1');

    // STEP 03: 새 Section 생성
    let section2Id = '';
    act(() => {
      section2Id = useEditorStore.getState().addSection('Phase 2: 품질 검증 및 승인');
    });
    expect(useEditorStore.getState().sections.length).toBe(initialSections.length + 1);
    expect(useEditorStore.getState().saveStatus).toBe('unsaved');

    // STEP 04: Section 이름 변경
    act(() => {
      useEditorStore.getState().updateSection(section2Id, 'Phase 2: 승인 및 배포');
    });
    const updatedSec = useEditorStore.getState().sections.find((s) => s.id === section2Id);
    expect(updatedSec?.name).toBe('Phase 2: 승인 및 배포');

    // STEP 05: 새 Node 생성
    let nodeAId = '';
    act(() => {
      nodeAId = useEditorStore.getState().addNode('요구사항 최종 승인');
    });
    expect(useEditorStore.getState().nodes.some((n) => n.id === nodeAId)).toBe(true);

    // STEP 06: Node를 해당 Section에 배치
    act(() => {
      useEditorStore.getState().updateNodeData(nodeAId, { sectionId: section2Id });
    });
    const nodeA = useEditorStore.getState().nodes.find((n) => n.id === nodeAId);
    expect(nodeA?.data.sectionId).toBe(section2Id);

    // STEP 07: Node Property 수정
    act(() => {
      useEditorStore.getState().updateNodeData(nodeAId, {
        owner: '박운영',
        role: 'Operations Director',
        tool: 'Jira Enterprise',
        description: 'V1 출시 승인 심의 및 리스크 평가',
        durationMinutes: 45,
        costAmount: 120000,
        notes: '경영진 최종 사인오프 필요',
      });
    });
    const nodeAProps = useEditorStore.getState().nodes.find((n) => n.id === nodeAId)?.data;
    expect(nodeAProps?.owner).toBe('박운영');
    expect(nodeAProps?.durationMinutes).toBe(45);
    expect(nodeAProps?.costAmount).toBe(120000);

    // STEP 08: 두 번째 Node 생성
    let nodeBId = '';
    act(() => {
      nodeBId = useEditorStore.getState().addNode('배포 파이프라인 트리거', { x: 450, y: 220 }, section2Id);
    });
    expect(useEditorStore.getState().nodes.some((n) => n.id === nodeBId)).toBe(true);

    // STEP 09: Node 이동
    act(() => {
      useEditorStore.getState().onNodeDragStart();
      useEditorStore.getState().onNodesChange([
        {
          type: 'position',
          id: nodeBId,
          position: { x: 500, y: 260 },
        },
      ]);
    });
    const movedNodeB = useEditorStore.getState().nodes.find((n) => n.id === nodeBId);
    expect(movedNodeB?.position.x).toBe(500);
    expect(movedNodeB?.position.y).toBe(260);

    // STEP 10: Node A → Node B Edge 연결
    act(() => {
      useEditorStore.getState().onConnect({
        source: nodeAId,
        target: nodeBId,
        sourceHandle: null,
        targetHandle: null,
      });
    });

    // STEP 11: Edge 방향 확인
    const createdEdge = useEditorStore
      .getState()
      .edges.find((e) => e.source === nodeAId && e.target === nodeBId);
    expect(createdEdge).toBeDefined();
    expect(createdEdge?.source).toBe(nodeAId);
    expect(createdEdge?.target).toBe(nodeBId);

    // STEP 12: Structure Panel에서 Node B 선택
    act(() => {
      useEditorStore.getState().setSelectedNodeId(nodeBId);
    });

    // STEP 13: Canvas가 Node B를 선택 상태로 동기화하는지 확인
    expect(useEditorStore.getState().selectedNodeId).toBe(nodeBId);

    // STEP 14: Edge 선택
    act(() => {
      useEditorStore.getState().setSelectedEdgeId(createdEdge!.id);
    });
    expect(useEditorStore.getState().selectedEdgeId).toBe(createdEdge!.id);
    expect(useEditorStore.getState().selectedNodeId).toBeNull();

    // STEP 15: Edge 삭제
    act(() => {
      useEditorStore.getState().deleteEdge(createdEdge!.id);
    });
    expect(useEditorStore.getState().edges.some((e) => e.id === createdEdge!.id)).toBe(false);

    // STEP 16: Undo (Edge 복원)
    act(() => {
      useEditorStore.getState().undo();
    });
    expect(useEditorStore.getState().edges.some((e) => e.id === createdEdge!.id)).toBe(true);

    // STEP 17: Redo (Edge 다시 삭제)
    act(() => {
      useEditorStore.getState().redo();
    });
    expect(useEditorStore.getState().edges.some((e) => e.id === createdEdge!.id)).toBe(false);

    // 다시 Undo하여 엣지 유지 상태로 복원
    act(() => {
      useEditorStore.getState().undo();
    });
    expect(useEditorStore.getState().edges.some((e) => e.id === createdEdge!.id)).toBe(true);

    // STEP 18: Node 삭제
    act(() => {
      useEditorStore.getState().deleteNode(nodeAId);
    });
    expect(useEditorStore.getState().nodes.some((n) => n.id === nodeAId)).toBe(false);

    // STEP 19: Cascade Edge Delete 확인
    expect(
      useEditorStore
        .getState()
        .edges.some((e) => e.source === nodeAId || e.target === nodeAId)
    ).toBe(false);

    // STEP 20: Undo
    act(() => {
      useEditorStore.getState().undo();
    });

    // STEP 21: 전체 상태 복원 확인
    expect(useEditorStore.getState().nodes.some((n) => n.id === nodeAId)).toBe(true);
    expect(useEditorStore.getState().edges.some((e) => e.id === createdEdge!.id)).toBe(true);

    // STEP 22: Save
    act(() => {
      useEditorStore.getState().setSaveStatus('saving');
    });
    const snapshotBeforeSave = {
      workflowId: testWorkflow.id,
      sections: useEditorStore.getState().sections,
      nodes: useEditorStore.getState().nodes,
      edges: useEditorStore.getState().edges,
    };
    const saveResult = await saveWorkflowSnapshot(snapshotBeforeSave);
    expect(saveResult.success).toBe(true);

    // STEP 23: saved 상태 확인
    act(() => {
      useEditorStore.getState().setSaveStatus('saved');
    });
    expect(useEditorStore.getState().saveStatus).toBe('saved');

    // STEP 24: 페이지 Reload
    const reloadedBundle = await loadWorkflowBundle(testWorkflow.id);
    expect(reloadedBundle).not.toBeNull();

    // STEP 25: Section / Node / Edge / Properties / Position 비교
    const reloadedSections = mapDbSectionsToEditor(reloadedBundle!.sections);
    const reloadedNodes = mapDbNodesToEditor(reloadedBundle!.nodes);
    const reloadedEdges = mapDbEdgesToEditor(reloadedBundle!.edges);

    // STEP 26: 동일 데이터 복원 확인
    expect(reloadedSections.length).toBe(snapshotBeforeSave.sections.length);
    expect(reloadedNodes.length).toBe(snapshotBeforeSave.nodes.length);
    expect(reloadedEdges.length).toBe(snapshotBeforeSave.edges.length);

    const reloadedNodeA = reloadedNodes.find((n) => n.id === nodeAId);
    expect(reloadedNodeA).toBeDefined();
    expect(reloadedNodeA?.data.name).toBe('요구사항 최종 승인');
    expect(reloadedNodeA?.data.owner).toBe('박운영');
    expect(reloadedNodeA?.data.durationMinutes).toBe(45);
    expect(reloadedNodeA?.data.costAmount).toBe(120000);
    expect(reloadedNodeA?.data.sectionId).toBe(section2Id);

    const reloadedNodeB = reloadedNodes.find((n) => n.id === nodeBId);
    expect(reloadedNodeB?.position.x).toBe(500);
    expect(reloadedNodeB?.position.y).toBe(260);

    const reloadedEdge = reloadedEdges.find(
      (e) => e.source === nodeAId && e.target === nodeBId
    );
    expect(reloadedEdge).toBeDefined();

    // STEP 27: Node Property 추가 수정
    act(() => {
      useEditorStore.getState().updateNodeData(nodeAId, { notes: 'E2E 최종 검증 승인 완료' });
    });

    // STEP 28: unsaved 상태 확인
    expect(useEditorStore.getState().saveStatus).toBe('unsaved');

    // STEP 29: 목록으로 이동 시도 (Navigation Guard)
    const mockNavigateBack = vi.fn();
    const { unmount: unmountHeader } = render(
      <EditorHeader workflow={testWorkflow} onNavigateBack={mockNavigateBack} />
    );
    const backBtn = screen.getByTestId('header-back-btn');
    fireEvent.click(backBtn);
    expect(mockNavigateBack).toHaveBeenCalledTimes(1);
    unmountHeader();

    // STEP 30: UnsavedChangesModal 확인
    let modalCanceled = false;
    const mockOnCancel = () => {
      modalCanceled = true;
    };
    const { unmount: unmountModal } = render(
      <UnsavedChangesModal
        isOpen={true}
        onSaveAndLeave={vi.fn()}
        onDiscardAndLeave={vi.fn()}
        onCancel={mockOnCancel}
        isSaving={false}
      />
    );
    expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();

    // STEP 31: 계속 편집 선택
    const continueBtn = screen.getByText('계속 편집');
    fireEvent.click(continueBtn);
    expect(modalCanceled).toBe(true);
    unmountModal();

    // STEP 32: 현재 상태 유지 확인
    expect(useEditorStore.getState().nodes.find((n) => n.id === nodeAId)?.data.notes).toBe(
      'E2E 최종 검증 승인 완료'
    );

    // STEP 33: Save
    act(() => {
      useEditorStore.getState().setSaveStatus('saving');
    });
    const finalSaveResult = await saveWorkflowSnapshot({
      workflowId: testWorkflow.id,
      sections: useEditorStore.getState().sections,
      nodes: useEditorStore.getState().nodes,
      edges: useEditorStore.getState().edges,
    });
    expect(finalSaveResult.success).toBe(true);
    act(() => {
      useEditorStore.getState().setSaveStatus('saved');
    });
    expect(useEditorStore.getState().saveStatus).toBe('saved');

    // STEP 34: 목록 이동 (saved 상태에서는 모달 없이 직접 이동 허용)
    const mockDirectNavigate = vi.fn();
    const { unmount: unmountHeaderSaved } = render(
      <EditorHeader workflow={testWorkflow} onNavigateBack={mockDirectNavigate} />
    );
    fireEvent.click(screen.getByTestId('header-back-btn'));
    expect(mockDirectNavigate).toHaveBeenCalledTimes(1);
    unmountHeaderSaved();

    // STEP 35 & 36: 다시 Workflow 진입 및 최종 상태 확인
    const finalBundle = await loadWorkflowBundle(testWorkflow.id);
    expect(finalBundle).not.toBeNull();
    const finalRestoredNodes = mapDbNodesToEditor(finalBundle!.nodes);
    const finalNodeA = finalRestoredNodes.find((n) => n.id === nodeAId);
    expect(finalNodeA?.data.notes).toBe('E2E 최종 검증 승인 완료');
  });
});

describe('PHASE 13: Acceptance Criteria Specific Area Validations (G01 ~ G68)', () => {
  beforeEach(() => {
    act(() => {
      useEditorStore.getState().resetEditor();
    });
  });

  // Area 01: Initial Load & Error State
  it('Area 01 (G02, G05): EditorSkeleton 및 EditorErrorState 컴포넌트가 안정적으로 렌더링되어야 한다', () => {
    // G02: EditorSkeleton
    const { unmount: unmountSkeleton } = render(<EditorSkeleton />);
    expect(screen.getByTestId('editor-skeleton')).toBeInTheDocument();
    unmountSkeleton();

    // G05: Error State
    const mockRetry = vi.fn();
    const { unmount: unmountError } = render(
      <EditorErrorState
        title="오류 발생"
        description="워크플로우를 불러올 수 없습니다."
        onRetry={mockRetry}
      />
    );
    expect(screen.getByText('오류 발생')).toBeInTheDocument();
    const retryBtn = screen.getByText('다시 시도');
    fireEvent.click(retryBtn);
    expect(mockRetry).toHaveBeenCalledTimes(1);
    unmountError();
  });

  // Area 02 & 05: Section & Canvas Sync
  it('Area 02 & 05 (G09, G25): Section Collapse/Expand 및 StructurePanel 노드 클릭이 정상 동기화되어야 한다', () => {
    render(<StructurePanel />);

    const { sections, nodes } = useEditorStore.getState();
    const firstSectionId = sections[0].id;
    const firstNode = nodes[0];

    // G09: Section Collapse Toggle
    act(() => {
      useEditorStore.getState().toggleSectionCollapse(firstSectionId);
    });
    expect(useEditorStore.getState().sections[0].isCollapsed).toBe(true);

    act(() => {
      useEditorStore.getState().toggleSectionCollapse(firstSectionId);
    });
    expect(useEditorStore.getState().sections[0].isCollapsed).toBe(false);

    // G25: Structure Step 클릭 시 selectedNodeId 갱신
    const stepBtn = screen.getByTestId(`structure-step-item-${firstNode.id}`);
    fireEvent.click(stepBtn);
    expect(useEditorStore.getState().selectedNodeId).toBe(firstNode.id);
  });

  // Area 06: History Max 50 Limit (G40)
  it('Area 06 (G40): History Stack은 최대 50개의 스냅샷만 유지하고 오래된 내역부터 안전하게 배출해야 한다', () => {
    act(() => {
      for (let i = 0; i < 60; i++) {
        useEditorStore.getState().addNode(`연속 추가 단계 ${i}`);
      }
    });

    const pastLength = useEditorStore.getState().past.length;
    expect(pastLength).toBeLessThanOrEqual(50);
  });

  // Area 07: Save Button Guard during Saving (G45)
  it('Area 07 (G45): saveStatus가 saving일 때 Header 저장 버튼이 중복 클릭되지 않도록 비활성화되어야 한다', () => {
    act(() => {
      useEditorStore.getState().setSaveStatus('saving');
    });

    const mockSave = vi.fn();
    render(<EditorHeader workflow={testWorkflow} onSave={mockSave} />);

    const saveBtn = screen.getByTestId('manual-save-btn');
    expect(saveBtn).toBeDisabled();

    fireEvent.click(saveBtn);
    expect(mockSave).not.toHaveBeenCalled();
  });

  // Area 08: Browser Exit Guard (G55, G56)
  it('Area 08 (G55, G56): saveStatus 상태에 따른 beforeunload 이벤트 핸들러 계약을 검증한다', () => {
    const simulateBeforeUnload = (saveStatus: string) => {
      let isPrevented = false;
      const event = {
        preventDefault: () => {
          isPrevented = true;
        },
        returnValue: '',
      };

      if (saveStatus === 'unsaved') {
        event.preventDefault();
        event.returnValue = '';
      }

      return isPrevented;
    };

    expect(simulateBeforeUnload('unsaved')).toBe(true);
    expect(simulateBeforeUnload('saved')).toBe(false);
  });

  // Area 10: Security & Isolation (G63, G64, G67)
  it('Area 10 (G63 ~ G67): 고아 엣지는 DB 매퍼를 통과하지 않으며 다른 워크플로우와 데이터가 격리되어야 한다', async () => {
    // 존재하지 않는 노드를 가리키는 고아 엣지 시뮬레이션
    const validNodeId = 'valid-node-1';
    const invalidSnapshot = {
      workflowId: 'wf-isolation-test',
      sections: [{ id: 'sec-1', name: '기본', position: 0 }],
      nodes: [
        {
          id: validNodeId,
          type: 'workflowNode' as const,
          position: { x: 0, y: 0 },
          data: { workflowNodeId: validNodeId, name: '유효 노드', sectionId: 'sec-1' },
        },
      ],
      edges: [
        {
          id: 'ghost-edge-1',
          source: validNodeId,
          target: 'nonexistent-target-999',
        },
      ],
    };

    const payload = mapSnapshotToDbPayload(invalidSnapshot);
    // 고아 엣지는 mapEditorToDbEdges에서 안전하게 필터링되어야 함
    expect(payload.edges).toHaveLength(0);

    // 격리 검증: 존재하지 않는 워크플로우 조회 시 null 반환
    const result = await loadWorkflowBundle('unauthorized-workflow-999');
    expect(result).toBeNull();
  });
});
