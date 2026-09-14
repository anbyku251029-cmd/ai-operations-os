'use client';

import React from 'react';
import Link from 'next/link';
import { BottleneckItem } from '../types/intelligence-types';
import { AlertCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';

interface BottleneckListProps {
  bottlenecks: BottleneckItem[];
}

export function BottleneckList({ bottlenecks }: BottleneckListProps) {
  if (!bottlenecks || bottlenecks.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
        <p className="text-xs text-slate-500">
          현재 감지된 운영 병목이 없습니다. 모든 프로세스가 안정적으로 설계되었습니다.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="bottleneck-list"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> 감지된 운영 병목 상세 분석
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            룰 기반 엔진이 식별한 지연 위험, 과다 비용 및 미연결 단계를 확인하세요.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          총 {bottlenecks.length}건
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        {bottlenecks.map((item) => {
          const isHigh = item.severity === 'high';
          const isMedium = item.severity === 'medium';

          return (
            <div
              key={item.id}
              className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {isHigh && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                      <AlertCircle className="w-3 h-3" /> High
                    </span>
                  )}
                  {isMedium && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="w-3 h-3" /> Medium
                    </span>
                  )}
                  {!isHigh && !isMedium && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      <Info className="w-3 h-3" /> Low
                    </span>
                  )}

                  <span className="text-xs font-bold text-slate-800">
                    {item.nodeName}
                  </span>
                  <span className="text-xs text-slate-400">in</span>
                  <span className="text-xs text-slate-600 font-medium">
                    {item.workflowName}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.reason}
                </p>

                <div className="text-[11px] text-blue-600 bg-blue-50/60 p-2 rounded border border-blue-100">
                  <span className="font-semibold">권장 조치: </span>
                  {item.recommendation}
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-start">
                <Link
                  href={`/workflows/${item.workflowId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  수정하기 <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
