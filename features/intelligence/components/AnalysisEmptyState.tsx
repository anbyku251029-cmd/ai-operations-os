'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Layers, Plus } from 'lucide-react';

interface AnalysisEmptyStateProps {
  title?: string;
  description?: string;
}

export function AnalysisEmptyState({
  title = '분석할 워크플로우가 없습니다',
  description = '새로운 업무 프로세스를 설계하고 노드와 실행 시간, 비용을 입력하면 자동으로 병목과 부하를 분석합니다.',
}: AnalysisEmptyStateProps) {
  return (
    <div
      data-testid="intelligence-empty-state"
      className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm"
    >
      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
        <Layers className="w-7 h-7" />
      </div>

      <div className="max-w-md space-y-1.5">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>

      <Link href="/workflows/new">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs">
          <Plus className="w-4 h-4" /> 첫 워크플로우 만들기
        </Button>
      </Link>
    </div>
  );
}
