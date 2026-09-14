'use client';

import React from 'react';
import Link from 'next/link';
import { WorkflowAnalysisResult } from '../types/intelligence-types';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign, Layers, ExternalLink, AlertTriangle } from 'lucide-react';

interface WorkflowAnalysisCardProps {
  workflow: WorkflowAnalysisResult;
}

export function WorkflowAnalysisCard({ workflow }: WorkflowAnalysisCardProps) {
  const hasBottlenecks = workflow.bottlenecks.length > 0;

  return (
    <div
      data-testid={`workflow-analysis-card-${workflow.workflowId}`}
      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800 line-clamp-1">
            {workflow.workflowName}
          </h3>
          {hasBottlenecks ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full shrink-0 border border-amber-200">
              <AlertTriangle className="w-3 h-3" /> 병목 {workflow.bottlenecks.length}건
            </span>
          ) : (
            <span className="inline-flex items-center text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full shrink-0 border border-emerald-200">
              원활
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
          {workflow.description || '상세 설명이 등록되지 않았습니다.'}
        </p>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{workflow.totalNodes}단계</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{workflow.totalMinutes}분</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>₩{workflow.totalCost.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          참여 {workflow.ownerCount}명 · 도구 {workflow.toolCount}개
        </span>
        <Link href={`/workflows/${workflow.workflowId}`}>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 px-2 gap-1"
          >
            에디터 열기 <ExternalLink className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
