import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CreateWorkflowForm } from '@/features/workflow/components/CreateWorkflowForm';
import { WorkflowList } from '@/features/workflow/components/WorkflowList';
import { Workflow } from '@/types/workflow';

// next/link mock
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// sonner mock
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PHASE 03 Workflow Components Rendering Tests', () => {
  it('CreateWorkflowForm이 필수 입력 필드와 버튼을 렌더링해야 한다', () => {
    render(<CreateWorkflowForm />);
    expect(screen.getByText('새 워크플로우 생성', { selector: '[data-slot="card-title"]' })).toBeDefined();
    expect(screen.getByLabelText(/워크플로우 이름/)).toBeDefined();
    expect(screen.getByLabelText(/설명 \(선택\)/)).toBeDefined();
    expect(screen.getByRole('button', { name: '워크플로우 생성' })).toBeDefined();
  });

  it('WorkflowList가 워크플로우 목록을 올바르게 표 형태로 렌더링해야 한다', () => {
    const mockWorkflows: Workflow[] = [
      {
        id: 'wf-1',
        name: '테스트 워크플로우 A',
        description: '설명 A',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(<WorkflowList initialWorkflows={mockWorkflows} />);
    expect(screen.getByText('테스트 워크플로우 A')).toBeDefined();
    expect(screen.getByText('설명 A')).toBeDefined();
    expect(screen.getByPlaceholderText('워크플로우 검색...')).toBeDefined();
  });

  it('WorkflowList가 빈 목록일 때 Empty State를 렌더링해야 한다', () => {
    render(<WorkflowList initialWorkflows={[]} />);
    expect(screen.getByText('등록된 워크플로우가 없습니다.')).toBeDefined();
    expect(screen.getByRole('button', { name: '+ 첫 워크플로우 만들기' })).toBeDefined();
  });
});
