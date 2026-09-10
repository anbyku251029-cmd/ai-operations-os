import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import { EditorSkeleton } from '@/features/editor/components/EditorSkeleton';
import { EditorErrorState } from '@/features/editor/components/EditorErrorState';
import { UnsavedChangesModal } from '@/features/editor/components/UnsavedChangesModal';
import { useUnsavedChangesWarning } from '@/features/editor/hooks/useUnsavedChangesWarning';
import { WorkflowEditor } from '@/features/editor/components/WorkflowEditor';
import { useEditorStore } from '@/stores/useEditorStore';
import { Workflow } from '@/types/workflow';

// Next.js Navigation mocks
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ workflowId: 'test-wf-1' }),
}));

// Mock Server Actions & Sonner
vi.mock('@/features/workflow/actions/workflow-actions', () => ({
  updateWorkflowAction: vi.fn().mockResolvedValue({ success: true }),
  deleteWorkflowAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/persistence/workflow-repository', () => ({
  saveWorkflowSnapshot: vi.fn().mockResolvedValue({ success: true }),
  loadWorkflowBundle: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mock-react-flow">{children}</div>
  ),
  Controls: () => <div data-testid="mock-controls" />,
  Background: () => <div data-testid="mock-background" />,
  BackgroundVariant: { Dots: 'dots' },
  applyNodeChanges: vi.fn((changes, nodes) => nodes),
  applyEdgeChanges: vi.fn((changes, edges) => edges),
  MarkerType: { ArrowClosed: 'arrowclosed' },
  useReactFlow: () => ({
    setCenter: vi.fn(),
    getZoom: vi.fn().mockReturnValue(1),
  }),
}));

const mockWorkflow: Workflow = {
  id: 'test-wf-1',
  workspace_id: 'ws-1',
  name: '테스트 워크플로우',
  description: '테스트 설명',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('PHASE 10: UX States & Data Loss Protection Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEditorStore.getState().resetEditor();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* ------------------------------------------------------------------
   * 1. [LOCK 03] EditorSkeleton Tests
   * ------------------------------------------------------------------ */
  describe('EditorSkeleton Component', () => {
    it('[G01] 3-Panel 구조에 대응하는 스켈레톤 레이아웃을 렌더링해야 한다', () => {
      render(<EditorSkeleton />);

      const skeletonRoot = screen.getByTestId('editor-skeleton');
      expect(skeletonRoot).toBeInTheDocument();
      expect(skeletonRoot.className).toContain('animate-pulse');

      // Header, Left aside, Center main, Right aside 확인
      const header = skeletonRoot.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(header?.className).toContain('h-14');

      const asides = skeletonRoot.querySelectorAll('aside');
      expect(asides.length).toBe(2); // Structure and Properties

      const main = skeletonRoot.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main?.className).toContain('flex-1');
    });
  });

  /* ------------------------------------------------------------------
   * 2. [G02] EditorErrorState Tests
   * ------------------------------------------------------------------ */
  describe('EditorErrorState Component', () => {
    it('기본 타이틀, 설명 및 목록 이동 링크를 렌더링해야 한다', () => {
      render(<EditorErrorState />);

      expect(screen.getByTestId('editor-error-state')).toBeInTheDocument();
      expect(screen.getByTestId('error-state-title')).toHaveTextContent(
        '워크플로우를 불러올 수 없습니다'
      );
      expect(screen.getByTestId('error-back-list-btn')).toBeInTheDocument();
    });

    it('onRetry가 전달된 경우 "다시 시도" 버튼을 렌더링하고 클릭 시 콜백을 호출해야 한다', () => {
      const handleRetry = vi.fn();
      render(<EditorErrorState onRetry={handleRetry} isRetrying={false} />);

      const retryBtn = screen.getByTestId('error-retry-btn');
      expect(retryBtn).toHaveTextContent('다시 시도');

      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('isRetrying이 true인 경우 버튼 텍스트가 변경되고 비활성화되어야 한다', () => {
      render(<EditorErrorState onRetry={vi.fn()} isRetrying={true} />);

      const retryBtn = screen.getByTestId('error-retry-btn');
      expect(retryBtn).toHaveTextContent('다시 연결 중...');
      expect(retryBtn).toBeDisabled();
    });
  });

  /* ------------------------------------------------------------------
   * 3. [LOCK 01 & 02] UnsavedChangesModal Tests
   * ------------------------------------------------------------------ */
  describe('UnsavedChangesModal Component', () => {
    it('isOpen이 false이면 렌더링되지 않아야 한다', () => {
      render(
        <UnsavedChangesModal
          isOpen={false}
          onSaveAndLeave={vi.fn()}
          onDiscardAndLeave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.queryByTestId('unsaved-changes-modal')).not.toBeInTheDocument();
    });

    it('isOpen이 true이면 모달과 3개의 액션 옵션을 렌더링해야 한다', () => {
      render(
        <UnsavedChangesModal
          isOpen={true}
          onSaveAndLeave={vi.fn()}
          onDiscardAndLeave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      expect(screen.getByTestId('unsaved-modal-cancel-btn')).toBeInTheDocument();
      expect(screen.getByTestId('unsaved-modal-discard-btn')).toBeInTheDocument();
      expect(screen.getByTestId('unsaved-modal-save-btn')).toBeInTheDocument();
    });

    it('[G06] "계속 편집" 클릭 시 onCancel 콜백을 호출해야 한다', () => {
      const handleCancel = vi.fn();
      render(
        <UnsavedChangesModal
          isOpen={true}
          onSaveAndLeave={vi.fn()}
          onDiscardAndLeave={vi.fn()}
          onCancel={handleCancel}
        />
      );

      fireEvent.click(screen.getByTestId('unsaved-modal-cancel-btn'));
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('[G07] "저장하지 않고 이동" 클릭 시 onDiscardAndLeave 콜백을 호출해야 한다', () => {
      const handleDiscard = vi.fn();
      render(
        <UnsavedChangesModal
          isOpen={true}
          onSaveAndLeave={vi.fn()}
          onDiscardAndLeave={handleDiscard}
          onCancel={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('unsaved-modal-discard-btn'));
      expect(handleDiscard).toHaveBeenCalledTimes(1);
    });

    it('저장 진행 중일 때(isSaving=true) 버튼들이 비활성화되어야 한다', () => {
      render(
        <UnsavedChangesModal
          isOpen={true}
          isSaving={true}
          onSaveAndLeave={vi.fn()}
          onDiscardAndLeave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByTestId('unsaved-modal-cancel-btn')).toBeDisabled();
      expect(screen.getByTestId('unsaved-modal-discard-btn')).toBeDisabled();
      expect(screen.getByTestId('unsaved-modal-save-btn')).toBeDisabled();
      expect(screen.getByTestId('unsaved-modal-save-btn')).toHaveTextContent('저장 중...');
    });
  });

  /* ------------------------------------------------------------------
   * 4. [LOCK 01 & 02] useUnsavedChangesWarning Hook Tests
   * ------------------------------------------------------------------ */
  describe('useUnsavedChangesWarning Hook', () => {
    it('[G03] enabled=true일 때 beforeunload 이벤트 발생 시 기본 동작 방지 및 이벤트 취소를 수행해야 한다', () => {
      renderHook(() => useUnsavedChangesWarning(true));

      const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });

    it('[G04] enabled=false일 때 beforeunload 이벤트 발생 시 아무런 조치를 취하지 않아야 한다', () => {
      renderHook(() => useUnsavedChangesWarning(false));

      const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  /* ------------------------------------------------------------------
   * 5. [LOCK 01 & 02] WorkflowEditor In-App Navigation Guard Integration
   * ------------------------------------------------------------------ */
  describe('WorkflowEditor Navigation Guard Integration', () => {
    it('[G05] saveStatus가 "unsaved"일 때 "목록으로" 클릭 시 즉시 이동하지 않고 모달이 열려야 한다', () => {
      useEditorStore.setState({ saveStatus: 'unsaved' });
      render(<WorkflowEditor workflow={mockWorkflow} />);

      const backBtn = screen.getByTestId('header-back-btn');
      fireEvent.click(backBtn);

      // router.push가 호출되지 않고 모달이 열려야 함
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
    });

    it('saveStatus가 "saved"일 때 "목록으로" 클릭 시 모달 없이 직접 이동해야 한다', () => {
      useEditorStore.setState({ saveStatus: 'saved' });
      render(<WorkflowEditor workflow={mockWorkflow} />);

      const backBtn = screen.getByTestId('header-back-btn');
      fireEvent.click(backBtn);

      // 직접 목록 페이지로 이동
      expect(mockPush).toHaveBeenCalledWith('/workflows');
      expect(screen.queryByTestId('unsaved-changes-modal')).not.toBeInTheDocument();
    });

    it('미저장 모달에서 "저장하지 않고 이동" 클릭 시 /workflows로 이동해야 한다', () => {
      useEditorStore.setState({ saveStatus: 'unsaved' });
      render(<WorkflowEditor workflow={mockWorkflow} />);

      fireEvent.click(screen.getByTestId('header-back-btn'));

      // "저장하지 않고 이동" 클릭
      fireEvent.click(screen.getByTestId('unsaved-modal-discard-btn'));

      expect(mockPush).toHaveBeenCalledWith('/workflows');
      expect(screen.queryByTestId('unsaved-changes-modal')).not.toBeInTheDocument();
    });

    it('미저장 모달에서 "계속 편집" 클릭 시 모달이 닫히고 이동하지 않아야 한다', () => {
      useEditorStore.setState({ saveStatus: 'unsaved' });
      render(<WorkflowEditor workflow={mockWorkflow} />);

      fireEvent.click(screen.getByTestId('header-back-btn'));

      // "계속 편집" 클릭
      fireEvent.click(screen.getByTestId('unsaved-modal-cancel-btn'));

      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.queryByTestId('unsaved-changes-modal')).not.toBeInTheDocument();
    });
  });
});
