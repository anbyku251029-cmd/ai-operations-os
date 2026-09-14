'use client';

import React, { useState, useTransition } from 'react';
import { IntelligenceAnalysisBundle } from '../types/intelligence-types';
import { OverviewMetrics } from './OverviewMetrics';
import { WorkflowAnalysisCard } from './WorkflowAnalysisCard';
import { BottleneckList } from './BottleneckList';
import { ImprovementPriorityList } from './ImprovementPriorityList';
import { OwnerLoadTable } from './OwnerLoadTable';
import { ToolUsageTable } from './ToolUsageTable';
import { AnalysisEmptyState } from './AnalysisEmptyState';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sliders } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface IntelligenceDashboardProps {
  initialBundle: IntelligenceAnalysisBundle;
}

export function IntelligenceDashboard({ initialBundle }: IntelligenceDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [bundle, setBundle] = useState<IntelligenceAnalysisBundle>(initialBundle);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const hasWorkflows = bundle.workflows && bundle.workflows.length > 0;

  return (
    <div className="space-y-8 pb-16" data-testid="intelligence-dashboard-root">
      {/* 1. Header Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">운영 인텔리전스 대시보드</h1>
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-blue-600" /> V1.1 Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-500">
            조직 내 모든 워크플로우의 소요 시간, 비용, 업무 부하 및 룰 기반 병목을 실시간으로 분석합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 hidden md:inline">
            분석 시각: {new Date(bundle.analyzedAt).toLocaleTimeString('ko-KR')}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isPending}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {!hasWorkflows ? (
        <AnalysisEmptyState />
      ) : (
        <>
          {/* 2. 4대 핵심 요약 지표 */}
          <OverviewMetrics metrics={bundle.overview} />

          {/* 3. 운영 개선 우선순위 (Action Items) */}
          <ImprovementPriorityList priorities={bundle.priorities} />

          {/* 4. 감지된 운영 병목 상세 분석 */}
          <BottleneckList bottlenecks={bundle.bottlenecks} />

          {/* 5. 워크플로우별 분석 현황 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">
                워크플로우별 분석 현황 ({bundle.workflows.length}개)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bundle.workflows.map((wf) => (
                <WorkflowAnalysisCard key={wf.workflowId} workflow={wf} />
              ))}
            </div>
          </div>

          {/* 6. 담당자 부하 및 도구 분석 (2열 레이아웃) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OwnerLoadTable ownerLoads={bundle.ownerLoads} />
            <ToolUsageTable toolUsages={bundle.toolUsages} />
          </div>
        </>
      )}
    </div>
  );
}
