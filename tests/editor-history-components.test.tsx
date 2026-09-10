import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditorHeader } from '@/features/editor/components/EditorHeader';
import { useEditorStore } from '@/stores/useEditorStore';
import { Workflow } from '@/types/workflow';

// next/link mock
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockWorkflow: Workflow = {
  id: 'wf-history-test',
  name: '히스토리 테스트 워크플로우',
  description: 'Undo/Redo UI 테스트',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('PHASE 09: EditorHeader History UI Component Tests', () => {
  beforeEach(() => {
    useEditorStore.getState().resetEditor();
  });

  it('초기 상태에서는 Undo 및 Redo 버튼이 모두 disabled 상태로 렌더링된다', () => {
    render(<EditorHeader workflow={mockWorkflow} />);

    const undoBtn = screen.getByTestId('undo-btn') as HTMLButtonElement;
    const redoBtn = screen.getByTestId('redo-btn') as HTMLButtonElement;

    expect(undoBtn).toBeDefined();
    expect(redoBtn).toBeDefined();
    expect(undoBtn.disabled).toBe(true);
    expect(redoBtn.disabled).toBe(true);
  });

  it('편집 작업(노드 추가) 발생 시 Undo 버튼이 활성화되고, 클릭 시 이전 상태로 복구된다', () => {
    const { rerender } = render(<EditorHeader workflow={mockWorkflow} />);

    const undoBtn = screen.getByTestId('undo-btn') as HTMLButtonElement;
    expect(undoBtn.disabled).toBe(true);

    // 노드 추가 작업 발생
    useEditorStore.getState().addNode('추가된 단계');
    rerender(<EditorHeader workflow={mockWorkflow} />);

    expect(undoBtn.disabled).toBe(false);

    // Undo 버튼 클릭
    fireEvent.click(undoBtn);

    // Undo 후 다시 Undo 비활성화, Redo 활성화 확인
    rerender(<EditorHeader workflow={mockWorkflow} />);
    const redoBtn = screen.getByTestId('redo-btn') as HTMLButtonElement;

    expect(undoBtn.disabled).toBe(true);
    expect(redoBtn.disabled).toBe(false);
  });

  it('Redo 버튼 클릭 시 취소했던 변경이 다시 적용된다', () => {
    const { rerender } = render(<EditorHeader workflow={mockWorkflow} />);

    useEditorStore.getState().addNode('단계 1');
    useEditorStore.getState().undo();
    rerender(<EditorHeader workflow={mockWorkflow} />);

    const redoBtn = screen.getByTestId('redo-btn') as HTMLButtonElement;
    expect(redoBtn.disabled).toBe(false);

    // Redo 버튼 클릭
    fireEvent.click(redoBtn);

    rerender(<EditorHeader workflow={mockWorkflow} />);
    expect(redoBtn.disabled).toBe(true);
    const undoBtn = screen.getByTestId('undo-btn') as HTMLButtonElement;
    expect(undoBtn.disabled).toBe(false);
  });
});
