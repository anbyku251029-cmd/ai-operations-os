'use client';

import React from 'react';
import Link from 'next/link';
import { ImprovementPriorityItem } from '../types/intelligence-types';
import { Sliders, ArrowRight } from 'lucide-react';

interface ImprovementPriorityListProps {
  priorities: ImprovementPriorityItem[];
}

export function ImprovementPriorityList({ priorities }: ImprovementPriorityListProps) {
  if (!priorities || priorities.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
        <p className="text-xs text-slate-500">
          현재 등록된 우선순위 개선 과제가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="improvement-priority-list"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-500" /> 운영 개선 권고 우선순위 (Action Items)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            가장 빠르고 효과적으로 운영 효율을 높일 수 있는 우선순위 개선 과제입니다.
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {priorities.map((item) => {
          const isP1 = item.priority === 'P1';
          const isP2 = item.priority === 'P2';

          return (
            <div
              key={item.id}
              className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isP1
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : isP2
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.priority}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({item.targetWorkflowName})
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {item.description}
                </p>

                <div className="text-[11px] text-emerald-700 font-medium">
                  ✦ 기대 효과: {item.expectedBenefit}
                </div>
              </div>

              {item.targetWorkflowId && (
                <div className="shrink-0">
                  <Link
                    href={`/workflows/${item.targetWorkflowId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    해당 워크플로우 열기 <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
