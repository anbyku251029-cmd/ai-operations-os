'use client';

import React from 'react';
import Link from 'next/link';
import { Workflow } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, Clock, FileText } from 'lucide-react';

interface DashboardViewProps {
  workflows: Workflow[];
}

export function DashboardView({ workflows }: DashboardViewProps) {
  const recentWorkflows = workflows.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">대시보드</h1>
          <p className="text-sm text-slate-500">
            조직의 Visual Workflow 현황을 한눈에 파악하고 새 프로세스를 생성하세요.
          </p>
        </div>

        <Link href="/workflows/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
            <Plus className="w-4 h-4" /> 새 워크플로우 만들기
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" /> 최근 편집한 워크플로우
          </h2>
          <Link
            href="/workflows"
            className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
          >
            전체 보기 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentWorkflows.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center space-y-2">
            <p className="text-sm text-slate-500">생성된 워크플로우가 없습니다.</p>
            <Link href="/workflows/new">
              <Button size="sm" variant="outline" className="text-xs">
                + 첫 워크플로우 만들기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentWorkflows.map((w) => (
              <Link
                key={w.id}
                href={`/workflows/${w.id}`}
                className="bg-white p-4 rounded-lg border shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <h3 className="font-semibold text-sm text-slate-800 group-hover:text-blue-600 line-clamp-1">
                      {w.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {w.description || '상세 설명이 없습니다.'}
                  </p>
                </div>

                <div className="pt-2 border-t text-[11px] text-slate-400 flex items-center justify-between">
                  <span>수정: {new Date(w.updated_at).toLocaleDateString('ko-KR')}</span>
                  <span className="text-blue-600 font-medium group-hover:underline">편집 →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded-lg border shadow-sm flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-800">프로토타입 캔버스 테스터</h3>
          <p className="text-xs text-slate-400">
            Phase 01&02에서 검증된 React Flow 기반 캔버스 엔진을 테스트합니다.
          </p>
        </div>
        <Link href="/canvas">
          <Button variant="outline" size="sm" className="text-xs">
            캔버스 열기
          </Button>
        </Link>
      </div>
    </div>
  );
}
