import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useEditorStore } from '@/stores/useEditorStore';
import { EditorHeader } from '@/features/editor/components/EditorHeader';
import { StructurePanel } from '@/features/editor/components/StructurePanel';
import { PropertiesPanel } from '@/features/editor/components/PropertiesPanel';
import { Workflow } from '@/types/workflow';

// next/link mock
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// @xyflow/react mock
vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    ReactFlow: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="mock-react-flow">{children}</div>
    ),
    Controls: () => <div data-testid="mock-controls" />,
    Background: () => <div data-testid="mock-background" />,
    BackgroundVariant: { Dots: 'dots', Lines: 'lines', Cross: 'cross' },
  };
});

const mockWorkflow: Workflow = {
  id: 'wf-shell-test',
  name: '엔터프라이즈 승인 워크플로우',
  description: '테스트용 설명',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('PHASE 04: 3-Panel Editor Shell Tests', () => {
  beforeEach(() => {
    act(() => {
      useEditorStore.getState().resetEditor();
    });
  });

  describe('useEditorStore State Machine', () => {
    it('기본 상태에서는 좌/우측 패널이 모두 열려있고 저장 상태는 saved여야 한다', () => {
      const state = useEditorStore.getState();
      expect(state.isLeftPanelOpen).toBe(true);
      expect(state.isRightPanelOpen).toBe(true);
      expect(state.saveStatus).toBe('saved');
      expect(state.selectedNodeId).toBeNull();
    });

    it('좌/우측 패널 토글 액션이 정상 작동해야 한다', () => {
      act(() => {
        useEditorStore.getState().toggleLeftPanel();
      });
      expect(useEditorStore.getState().isLeftPanelOpen).toBe(false);

      act(() => {
        useEditorStore.getState().toggleRightPanel();
      });
      expect(useEditorStore.getState().isRightPanelOpen).toBe(false);

      act(() => {
        useEditorStore.getState().toggleLeftPanel();
      });
      expect(useEditorStore.getState().isLeftPanelOpen).toBe(true);
    });

    it('저장 상태 머신(saved -> unsaved -> saving -> error) 전환이 올바르게 동작해야 한다', () => {
      act(() => {
        useEditorStore.getState().setSaveStatus('unsaved');
      });
      expect(useEditorStore.getState().saveStatus).toBe('unsaved');

      act(() => {
        useEditorStore.getState().setSaveStatus('saving');
      });
      expect(useEditorStore.getState().saveStatus).toBe('saving');

      act(() => {
        useEditorStore.getState().setSaveStatus('error');
      });
      expect(useEditorStore.getState().saveStatus).toBe('error');

      act(() => {
        useEditorStore.getState().setSaveStatus('saved');
      });
      expect(useEditorStore.getState().saveStatus).toBe('saved');
    });
  });

  describe('EditorHeader Component', () => {
    it('워크플로우 이름과 저장 상태 배지를 올바르게 렌더링해야 한다', () => {
      render(<EditorHeader workflow={mockWorkflow} />);

      expect(screen.getByText('엔터프라이즈 승인 워크플로우')).toBeDefined();
      const badge = screen.getByTestId('save-status-badge');
      expect(badge.textContent).toContain('저장됨');
    });

    it('저장 상태가 변경될 때 배지 텍스트가 동적으로 갱신되어야 한다', () => {
      const { rerender } = render(<EditorHeader workflow={mockWorkflow} />);

      act(() => {
        useEditorStore.getState().setSaveStatus('unsaved');
      });
      rerender(<EditorHeader workflow={mockWorkflow} />);
      expect(screen.getByTestId('save-status-badge').textContent).toContain('변경사항 있음');

      act(() => {
        useEditorStore.getState().setSaveStatus('saving');
      });
      rerender(<EditorHeader workflow={mockWorkflow} />);
      expect(screen.getByTestId('save-status-badge').textContent).toContain('저장 중...');
    });

    it('패널 토글 버튼 클릭 시 스토어 상태가 변경되어야 한다', () => {
      render(<EditorHeader workflow={mockWorkflow} />);

      const toggleLeftBtn = screen.getByTestId('toggle-left-panel');
      fireEvent.click(toggleLeftBtn);
      expect(useEditorStore.getState().isLeftPanelOpen).toBe(false);

      const toggleRightBtn = screen.getByTestId('toggle-right-panel');
      fireEvent.click(toggleRightBtn);
      expect(useEditorStore.getState().isRightPanelOpen).toBe(false);
    });
  });

  describe('StructurePanel Component', () => {
    it('열림 상태일 때 구조 아웃라인과 접기 버튼을 렌더링해야 한다', () => {
      render(<StructurePanel />);

      expect(screen.getByTestId('structure-panel')).toBeDefined();
      expect(screen.getByText('프로세스 구조')).toBeDefined();
      expect(screen.getByTestId('collapse-structure-btn')).toBeDefined();
    });

    it('접기 버튼 클릭 시 패널이 닫혀야 한다', () => {
      render(<StructurePanel />);

      const collapseBtn = screen.getByTestId('collapse-structure-btn');
      fireEvent.click(collapseBtn);
      expect(useEditorStore.getState().isLeftPanelOpen).toBe(false);
    });
  });

  describe('PropertiesPanel Component', () => {
    it('노드가 선택되지 않았을 때 Empty State를 렌더링해야 한다', () => {
      render(<PropertiesPanel />);

      expect(screen.getByTestId('properties-panel')).toBeDefined();
      expect(screen.getByTestId('properties-empty-state')).toBeDefined();
      expect(screen.getByText('선택된 노드가 없습니다')).toBeDefined();
    });

    it('노드가 선택되었을 때 인스펙터 활성 뷰를 렌더링해야 한다', () => {
      act(() => {
        useEditorStore.getState().setSelectedNodeId('step-1');
      });

      render(<PropertiesPanel />);

      expect(screen.getByTestId('properties-active-view')).toBeDefined();
      expect(screen.getByText(/NODE: step-1/)).toBeDefined();
      expect(screen.getAllByText(/기본 정보 입력/).length).toBeGreaterThan(0);
    });

    it('접기 버튼 클릭 시 속성 패널이 닫혀야 한다', () => {
      render(<PropertiesPanel />);

      const collapseBtn = screen.getByTestId('collapse-properties-btn');
      fireEvent.click(collapseBtn);
      expect(useEditorStore.getState().isRightPanelOpen).toBe(false);
    });
  });
});
