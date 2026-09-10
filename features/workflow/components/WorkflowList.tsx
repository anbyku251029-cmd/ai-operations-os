'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Workflow } from '@/types/workflow';
import { deleteWorkflowAction } from '../actions/workflow-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ExternalLink, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowListProps {
  initialWorkflows: Workflow[];
}

export function WorkflowList({ initialWorkflows }: WorkflowListProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.description && w.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`정말로 "${name}" 워크플로우를 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteWorkflowAction(id);
      if (res.success) {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
        toast.success(`"${name}" 워크플로우가 삭제되었습니다.`);
      } else {
        toast.error('워크플로우 삭제 중 오류가 발생했습니다.');
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="워크플로우 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <Link href="/workflows/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4" /> 새 워크플로우
          </Button>
        </Link>
      </div>

      {filteredWorkflows.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center space-y-3 shadow-sm">
          <p className="text-sm font-medium text-slate-600">등록된 워크플로우가 없습니다.</p>
          <p className="text-xs text-slate-400">
            조직의 첫 번째 Visual Workflow 프로세스를 설계해 보세요.
          </p>
          <Link href="/workflows/new">
            <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700 text-white">
              + 첫 워크플로우 만들기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-xs text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">워크플로우 명칭</th>
                <th className="py-3 px-4 hidden md:table-cell">설명</th>
                <th className="py-3 px-4">최종 수정일</th>
                <th className="py-3 px-4 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkflows.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    <Link
                      href={`/workflows/${w.id}`}
                      className="hover:text-blue-600 hover:underline flex items-center gap-1.5"
                    >
                      {w.name}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs hidden md:table-cell max-w-md truncate">
                    {w.description || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs">
                    {new Date(w.updated_at).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <Link href={`/workflows/${w.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:bg-blue-50">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> 열기
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(w.id, w.name)}
                      disabled={isPending && deletingId === w.id}
                      className="h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
