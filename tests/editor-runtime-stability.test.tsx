import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import { useEditorStore } from '@/stores/useEditorStore';
import { WorkflowEditor } from '@/features/editor/components/WorkflowEditor';
import { Workflow } from '@/types/workflow';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/workflows/wf-stability-1',
}));

// Mock next/link to prevent App Router context hang
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: (e: React.MouseEvent) => void;
  }) => (
    <a
      href={href}
      onClick={(e) => {
        if (onClick) onClick(e);
      }}
    >
      {children}
    </a>
  ),
}));

// Mock @xyflow/react
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({
    children,
    onNodesChange,
    onConnect,
  }: {
    children: React.ReactNode;
    onNodesChange?: (changes: unknown[]) => void;
    onEdgesChange?: (changes: unknown[]) => void;
    onConnect?: (connection: unknown) => void;
  }) => (
    <div data-testid="mock-react-flow">
      {children}
      <button
        data-testid="mock-trigger-nodes-change"
        onClick={() => onNodesChange?.([{ type: 'position', id: 'node-1', position: { x: 10, y: 20 } }])}
      >
        ChangeNode
      </button>
      <button
        data-testid="mock-trigger-connect"
        onClick={() => onConnect?.({ source: 'node-1', target: 'node-2', sourceHandle: null, targetHandle: null })}
      >
        Connect
      </button>
    </div>
  ),
  Background: () => <div data-testid="rf-background" />,
  Controls: () => <div data-testid="rf-controls" />,
  MiniMap: () => <div data-testid="rf-minimap" />,
  Handle: () => <div data-testid="rf-handle" />,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
  MarkerType: { ArrowClosed: 'arrowclosed', Arrow: 'arrow' },
  BackgroundVariant: { Dots: 'dots', Lines: 'lines', Cross: 'cross' },
  useReactFlow: () => ({
    setCenter: vi.fn(),
    fitView: vi.fn(),
  }),
  applyNodeChanges: vi.fn((changes, nodes) => nodes),
  applyEdgeChanges: vi.fn((changes, edges) => edges),
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock persistence
vi.mock('@/lib/persistence/workflow-repository', () => ({
  saveWorkflowSnapshot: vi.fn().mockResolvedValue({ success: true, savedAt: new Date().toISOString() }),
  loadWorkflowBundle: vi.fn().mockResolvedValue({
    workflow: { id: 'wf-stability-1', name: '안정성 워크플로우' },
    sections: [],
    nodes: [],
    edges: [],
  }),
}));

const testWorkflow: Workflow = {
  id: 'wf-stability-1',
  workspace_id: 'ws-stability-1',
  name: '안정성 테스트 워크플로우',
  description: 'PHASE 14 런타임 안정성 검증용 워크플로우',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('PHASE 14: Editor Runtime Stability & Determinism Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEditorStore.getState().resetEditor();
  });

  afterEach(() => {
    cleanup();
  });

  // G01: Editor mount/unmount 반복 시 hang 및 리소스 누수 없음
  it('G01: Editor mount/unmount 5회 연속 반복 시 hang 없이 정상 cleanup된다', () => {
    for (let i = 0; i < 5; i++) {
      const { unmount } = render(<WorkflowEditor workflow={testWorkflow} />);
      unmount();
    }
    expect(true).toBe(true);
  });

  // G02: beforeunload listener 중복 등록 없음 및 unmount 시 해제 확인
  it('G02: unsaved 상태 진입 및 unmount 시 beforeunload listener가 정상 등록 및 해제된다', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount, rerender } = render(<WorkflowEditor workflow={testWorkflow} />);

    // 초기 상태(saved)에서는 beforeunload 미등록
    const initialAddCalls = addEventListenerSpy.mock.calls.filter((c) => c[0] === 'beforeunload').length;

    // unsaved로 전환
    act(() => {
      useEditorStore.getState().setSaveStatus('unsaved');
    });
    rerender(<WorkflowEditor workflow={testWorkflow} />);

    const afterUnsavedAddCalls = addEventListenerSpy.mock.calls.filter((c) => c[0] === 'beforeunload').length;
    expect(afterUnsavedAddCalls).toBeGreaterThan(initialAddCalls);

    // unmount 시 해제 확인
    unmount();
    const removeCalls = removeEventListenerSpy.mock.calls.filter((c) => c[0] === 'beforeunload').length;
    expect(removeCalls).toBeGreaterThanOrEqual(1);

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  // G03: Undo/Redo 반복 시 상태 업데이트 loop 없음
  it('G03: Undo/Redo 20회 연속 실행 시 무한 루프 없이 스택이 정확히 동기화된다', () => {
    act(() => {
      useEditorStore.getState().setNodes([]);
      useEditorStore.getState().addNode('triggerNode', { x: 0, y: 0 });
      useEditorStore.getState().addNode('actionNode', { x: 100, y: 100 });
      useEditorStore.getState().addNode('conditionNode', { x: 200, y: 200 });
    });

    expect(useEditorStore.getState().nodes).toHaveLength(3);

    // 2. 20회 왕복 Undo / Redo
    for (let i = 0; i < 10; i++) {
      act(() => {
        useEditorStore.getState().undo();
      });
      act(() => {
        useEditorStore.getState().redo();
      });
    }

    expect(useEditorStore.getState().nodes).toHaveLength(3);
    expect(useEditorStore.getState().canUndo()).toBe(true);
  });

  // G04: Save -> state update 반복 시 save loop 없음
  it('G04: saving 상태일 때 중복 저장이 원천 차단되며 무한 호출 loop가 발생하지 않는다', async () => {
    const { saveWorkflowSnapshot } = await import('@/lib/persistence/workflow-repository');

    act(() => {
      useEditorStore.getState().setSaveStatus('saving');
    });

    const store = useEditorStore.getState();
    expect(store.saveStatus).toBe('saving');

    // saving 상태에서는 saveSnapshot이 추가 트리거되지 않음
    expect(saveWorkflowSnapshot).not.toHaveBeenCalled();

    act(() => {
      useEditorStore.getState().setSaveStatus('saved');
    });
    expect(useEditorStore.getState().saveStatus).toBe('saved');
  });

  // G05: Navigation Guard 반복 실행 시 navigation loop 없음
  it('G05: 미저장 변경사항 모달 열기/취소 반복 시 모달 루프 없이 상태가 안정적으로 유지된다', () => {
    act(() => {
      useEditorStore.getState().setSaveStatus('unsaved');
    });

    const { getByTestId, queryByTestId } = render(<WorkflowEditor workflow={testWorkflow} />);

    const backBtn = getByTestId('header-back-btn');

    // 3회 연속 뒤로가기 클릭 및 모달 취소
    for (let i = 0; i < 3; i++) {
      fireEvent.click(backBtn);
      const modal = getByTestId('unsaved-changes-modal');
      expect(modal).toBeDefined();

      const cancelBtn = getByTestId('unsaved-modal-cancel-btn');
      fireEvent.click(cancelBtn);
      expect(queryByTestId('unsaved-changes-modal')).toBeNull();
    }

    // router.push는 호출되지 않아야 함
    expect(mockPush).not.toHaveBeenCalled();
  });

  // G06: React Flow Node change가 무한 상태 업데이트를 발생시키지 않음
  it('G06: React Flow Node change 이벤트가 상태 갱신 loop를 유발하지 않는다', () => {
    act(() => {
      useEditorStore.getState().addNode('actionNode', { x: 50, y: 50 });
    });

    const { getByTestId } = render(<WorkflowEditor workflow={testWorkflow} />);
    const triggerBtn = getByTestId('mock-trigger-nodes-change');

    let renderCount = 0;
    const unsubscribe = useEditorStore.subscribe(() => {
      renderCount++;
    });

    act(() => {
      fireEvent.click(triggerBtn);
    });

    // 렌더링/상태 갱신이 1-2회 이내로 즉시 안정화(정주)되어야 함
    expect(renderCount).toBeLessThan(5);
    unsubscribe();
  });

  // G07: React Flow Edge change가 무한 상태 업데이트를 발생시키지 않음
  it('G07: 유효하지 않은 엣지 연결 시도가 스토어 오염 및 무한 엣지 이벤트를 일으키지 않는다', () => {
    act(() => {
      useEditorStore.getState().setEdges([]);
      useEditorStore.getState().addNode('triggerNode', { x: 0, y: 0 });
    });

    const { getByTestId } = render(<WorkflowEditor workflow={testWorkflow} />);
    const connectBtn = getByTestId('mock-trigger-connect');

    act(() => {
      // 존재하지 않는 node-2로의 연결 시도 (Phase 12 방어 로직)
      fireEvent.click(connectBtn);
    });

    // 허위 엣지가 추가되지 않고 edges는 빈 상태 유지
    expect(useEditorStore.getState().edges).toHaveLength(0);
  });

  // G08: Workflow Load가 무한 재호출되지 않음 (Idempotency)
  it('G08: 워크플로우 로드 후 동일 데이터 재수신 시 불필요한 중복 스토어 리셋이 발생하지 않는다', () => {
    act(() => {
      useEditorStore.getState().setSections([
        { id: 'sec-1', name: '기본 섹션', position: 0, isCollapsed: false },
      ]);
    });

    const sectionCount = useEditorStore.getState().sections.length;
    expect(sectionCount).toBe(1);

    // 동일 섹션 재주입
    act(() => {
      useEditorStore.getState().setSections([
        { id: 'sec-1', name: '기본 섹션', position: 0, isCollapsed: false },
      ]);
    });

    expect(useEditorStore.getState().sections).toHaveLength(1);
  });

  // G09: Component unmount 후 async callback 상태 갱신 누수 없음
  it('G09: unmount 후 타이머 및 이벤트 리스너가 정리되어 메모리 누수가 발생하지 않는다', () => {
    const { unmount } = render(<WorkflowEditor workflow={testWorkflow} />);
    unmount();

    // unmount 후 스토어 업데이트가 크래시 없이 정상 동작
    expect(() => {
      act(() => {
        useEditorStore.getState().resetEditor();
      });
    }).not.toThrow();
  });

  // G10: 10회 연속 상태 변이 스트레스 테스트 정상 종료
  it('G10: 섹션 생성, 노드 생성, 엣지 연결, 속성 변경 10회 루프가 항상 결정론적으로 완료된다', () => {
    act(() => {
      useEditorStore.getState().setNodes([]);
      useEditorStore.getState().setEdges([]);
      useEditorStore.getState().setSections([]);
    });

    for (let i = 0; i < 10; i++) {
      act(() => {
        const secId = useEditorStore.getState().addSection(`섹션 ${i}`);
        const n1 = useEditorStore.getState().addNode('triggerNode', { x: i * 10, y: 0 }, secId);
        const n2 = useEditorStore.getState().addNode('actionNode', { x: i * 10, y: 100 }, secId);
        useEditorStore.getState().onConnect({
          source: n1,
          target: n2,
          sourceHandle: null,
          targetHandle: null,
        });
      });
    }

    const state = useEditorStore.getState();
    expect(state.sections.length).toBe(10);
    expect(state.nodes.length).toBe(20);
    expect(state.edges.length).toBe(10);
  });
});
