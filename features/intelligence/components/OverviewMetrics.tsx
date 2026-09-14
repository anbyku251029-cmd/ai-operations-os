'use client';

import React from 'react';
import { OperationsOverviewMetrics } from '../types/intelligence-types';
import { Clock, DollarSign, AlertTriangle, Layers } from 'lucide-react';

interface OverviewMetricsProps {
  metrics: OperationsOverviewMetrics;
}

export function OverviewMetrics({ metrics }: OverviewMetricsProps) {
  const hours = (metrics.totalTimeMinutes / 60).toFixed(1);

  return (
    <div
      data-testid="overview-metrics-grid"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* 1. 총 프로세스 수 */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            분석 워크플로우
          </span>
          <div className="text-2xl font-bold text-slate-800">
            {metrics.totalWorkflows}
            <span className="text-sm font-normal text-slate-500 ml-1">개</span>
          </div>
          <div className="text-[11px] text-slate-400">
            총 {metrics.totalNodes}개 작업 단계
          </div>
        </div>
        <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      {/* 2. 총 소요 시간 */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            총 운영 소요시간
          </span>
          <div className="text-2xl font-bold text-slate-800">
            {metrics.totalTimeMinutes.toLocaleString()}
            <span className="text-sm font-normal text-slate-500 ml-1">분</span>
          </div>
          <div className="text-[11px] text-slate-400">
            약 {hours} 시간 소요
          </div>
        </div>
        <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* 3. 총 운영 비용 */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            총 프로세스 비용
          </span>
          <div className="text-2xl font-bold text-slate-800">
            ₩{metrics.totalCostAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            1회 전체 수행 기준
          </div>
        </div>
        <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>

      {/* 4. 탐지된 병목 */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            감지된 운영 병목
          </span>
          <div className="text-2xl font-bold text-amber-600">
            {metrics.bottleneckCount}
            <span className="text-sm font-normal text-slate-500 ml-1">건</span>
          </div>
          <div className="text-[11px] text-slate-400">
            지연 및 고비용 단계
          </div>
        </div>
        <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
