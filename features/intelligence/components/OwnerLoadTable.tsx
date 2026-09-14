'use client';

import React from 'react';
import { OwnerLoadItem } from '../types/intelligence-types';
import { User } from 'lucide-react';

interface OwnerLoadTableProps {
  ownerLoads: OwnerLoadItem[];
}

export function OwnerLoadTable({ ownerLoads }: OwnerLoadTableProps) {
  if (!ownerLoads || ownerLoads.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
        <p className="text-xs text-slate-500">배정된 담당자 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div
      data-testid="owner-load-table"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" /> 담당자별 업무 부하 분석 (Owner Load)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            특정 담당자나 역할에 작업이 편중되어 병목이 발생하지 않는지 확인합니다.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3.5 pl-5">담당자</th>
              <th className="p-3.5">직무 역할</th>
              <th className="p-3.5 text-center">담당 단계 수</th>
              <th className="p-3.5 text-right">총 소요 시간</th>
              <th className="p-3.5 text-right pr-5">관련 비용</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ownerLoads.map((owner) => {
              const isOverloaded = owner.totalMinutes >= 180 || owner.stepCount >= 4;

              return (
                <tr
                  key={`${owner.ownerName}-${owner.role}`}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isOverloaded ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <td className="p-3.5 pl-5 font-semibold text-slate-800 flex items-center gap-2">
                    {owner.ownerName}
                    {isOverloaded && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">
                        집중 관리
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-600">{owner.role}</td>
                  <td className="p-3.5 text-center font-medium text-slate-700">
                    {owner.stepCount}개
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-800">
                    {owner.totalMinutes}분
                  </td>
                  <td className="p-3.5 text-right pr-5 text-slate-600 font-medium">
                    ₩{owner.totalCost.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
