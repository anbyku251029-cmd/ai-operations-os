'use client';

import React from 'react';
import { ToolUsageItem } from '../types/intelligence-types';
import { Wrench } from 'lucide-react';

interface ToolUsageTableProps {
  toolUsages: ToolUsageItem[];
}

export function ToolUsageTable({ toolUsages }: ToolUsageTableProps) {
  if (!toolUsages || toolUsages.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
        <p className="text-xs text-slate-500">등록된 운영 도구 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div
      data-testid="tool-usage-table"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-600" /> 도구 활용 분석 (Tool Usage)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            어떤 소프트웨어 도구가 프로세스 전반에서 가장 많이 활용되는지 모니터링합니다.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3.5 pl-5">도구명</th>
              <th className="p-3.5 text-center">적용 단계 수</th>
              <th className="p-3.5">주요 사용자</th>
              <th className="p-3.5 text-center pr-5">관련 프로세스</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {toolUsages.map((tool) => (
              <tr key={tool.toolName} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-3.5 pl-5 font-bold text-slate-800">
                  {tool.toolName}
                </td>
                <td className="p-3.5 text-center font-semibold text-blue-600">
                  {tool.usageCount}회
                </td>
                <td className="p-3.5 text-slate-600">
                  {tool.associatedOwners.slice(0, 3).join(', ')}
                  {tool.associatedOwners.length > 3 && ` 외 ${tool.associatedOwners.length - 3}명`}
                </td>
                <td className="p-3.5 text-center pr-5 text-slate-500">
                  {tool.workflowIds.length}개
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
