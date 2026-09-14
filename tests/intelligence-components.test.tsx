import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverviewMetrics } from '@/features/intelligence/components/OverviewMetrics';
import { WorkflowAnalysisCard } from '@/features/intelligence/components/WorkflowAnalysisCard';
import { BottleneckList } from '@/features/intelligence/components/BottleneckList';
import { OwnerLoadTable } from '@/features/intelligence/components/OwnerLoadTable';
import { ToolUsageTable } from '@/features/intelligence/components/ToolUsageTable';
import { AnalysisEmptyState } from '@/features/intelligence/components/AnalysisEmptyState';
import { IntelligenceDashboard } from '@/features/intelligence/components/IntelligenceDashboard';
import {
  IntelligenceAnalysisBundle,
  WorkflowAnalysisResult,
  BottleneckItem,
} from '@/features/intelligence/types/intelligence-types';

// Next.js Link mock
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Next.js Navigation mock
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('V1.1 Operations Intelligence UI Components Tests', () => {
  it('AnalysisEmptyState는 안내 문구와 워크플로우 생성 버튼을 렌더링한다', () => {
    render(<AnalysisEmptyState />);
    expect(screen.getByTestId('intelligence-empty-state')).toBeInTheDocument();
    expect(screen.getByText('첫 워크플로우 만들기')).toBeInTheDocument();
  });

  it('OverviewMetrics는 4대 핵심 지표(워크플로우, 시간, 비용, 병목)를 정확히 표시한다', () => {
    render(
      <OverviewMetrics
        metrics={{
          totalWorkflows: 5,
          totalTimeMinutes: 300,
          totalCostAmount: 500000,
          bottleneckCount: 2,
          totalNodes: 15,
        }}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('₩500,000')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('WorkflowAnalysisCard는 워크플로우 정보와 에디터 링크를 렌더링한다', () => {
    const mockWfResult: WorkflowAnalysisResult = {
      workflowId: 'wf-123',
      workflowName: '계약 검토 프로세스',
      description: '법무 검토 및 전자 서명',
      updatedAt: new Date().toISOString(),
      totalNodes: 4,
      totalEdges: 3,
      totalMinutes: 120,
      totalCost: 150000,
      bottlenecks: [],
      ownerCount: 2,
      toolCount: 2,
    };

    render(<WorkflowAnalysisCard workflow={mockWfResult} />);

    expect(screen.getByText('계약 검토 프로세스')).toBeInTheDocument();
    expect(screen.getByText('4단계')).toBeInTheDocument();
    expect(screen.getByText('120분')).toBeInTheDocument();
    expect(screen.getByText('₩150,000')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /에디터 열기/i });
    expect(link).toHaveAttribute('href', '/workflows/wf-123');
  });

  it('BottleneckList는 병목 원인과 권장 조치를 표시한다', () => {
    const mockBottlenecks: BottleneckItem[] = [
      {
        id: 'btn-1',
        workflowId: 'wf-1',
        workflowName: '채용 프로세스',
        nodeId: 'n-1',
        nodeName: '최종 면접 심사',
        type: 'duration_overload',
        severity: 'high',
        reason: '소요 시간이 150분으로 기준치를 초과합니다.',
        recommendation: '면접 평가표 템플릿 표준화를 권장합니다.',
      },
    ];

    render(<BottleneckList bottlenecks={mockBottlenecks} />);

    expect(screen.getByText('최종 면접 심사')).toBeInTheDocument();
    expect(screen.getByText(/소요 시간이 150분으로/)).toBeInTheDocument();
    expect(screen.getByText(/면접 평가표 템플릿/)).toBeInTheDocument();
    expect(screen.getByText(/High/i)).toBeInTheDocument();
  });

  it('OwnerLoadTable 및 ToolUsageTable이 올바르게 렌더링된다', () => {
    const { unmount } = render(
      <OwnerLoadTable
        ownerLoads={[
          {
            ownerName: '김철수',
            role: '인사팀장',
            stepCount: 3,
            totalMinutes: 180,
            totalCost: 90000,
            workflowIds: ['wf-1'],
          },
        ]}
      />
    );

    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText('인사팀장')).toBeInTheDocument();
    expect(screen.getByText('180분')).toBeInTheDocument();
    unmount();

    render(
      <ToolUsageTable
        toolUsages={[
          {
            toolName: 'Slack',
            usageCount: 5,
            associatedOwners: ['김철수'],
            workflowIds: ['wf-1'],
          },
        ]}
      />
    );

    expect(screen.getByText('Slack')).toBeInTheDocument();
    expect(screen.getByText('5회')).toBeInTheDocument();
  });

  it('IntelligenceDashboard는 전체 대시보드 구조를 에러 없이 렌더링한다', () => {
    const mockBundle: IntelligenceAnalysisBundle = {
      overview: {
        totalWorkflows: 1,
        totalTimeMinutes: 60,
        totalCostAmount: 50000,
        bottleneckCount: 0,
        totalNodes: 2,
      },
      workflows: [
        {
          workflowId: 'wf-1',
          workflowName: '단일 워크플로우',
          updatedAt: new Date().toISOString(),
          totalNodes: 2,
          totalEdges: 1,
          totalMinutes: 60,
          totalCost: 50000,
          bottlenecks: [],
          ownerCount: 1,
          toolCount: 1,
        },
      ],
      bottlenecks: [],
      ownerLoads: [],
      toolUsages: [],
      priorities: [],
      analyzedAt: new Date().toISOString(),
    };

    render(<IntelligenceDashboard initialBundle={mockBundle} />);
    expect(screen.getByTestId('intelligence-dashboard-root')).toBeInTheDocument();
    expect(screen.getByText('운영 인텔리전스 대시보드')).toBeInTheDocument();
  });
});
