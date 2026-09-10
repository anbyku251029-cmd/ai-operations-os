'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { EditorNode } from '../types/editor';
import { useEditorStore } from '@/stores/useEditorStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trash2, User, Wrench } from 'lucide-react';

export const WorkflowNode = memo(({ data, selected, id }: NodeProps<EditorNode>) => {
  const deleteNode = useEditorStore((state) => state.deleteNode);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      deleteNode(id);
    }
  };

  return (
    <Card
      className={`w-64 border-2 bg-white transition-all select-none ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-400/40 shadow-lg'
          : 'border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
      data-testid={`workflow-node-${id}`}
      data-selected={selected ? 'true' : 'false'}
    >
      {/* Left Target Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-slate-400 hover:!bg-blue-500 !border-2 !border-white transition-colors"
      />

      <CardHeader className="p-3 pb-2 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start justify-between gap-1.5">
          <CardTitle className="text-xs font-bold text-slate-800 line-clamp-1 flex-1">
            {data.name || '새 단계 (New Step)'}
          </CardTitle>
          <button
            onClick={handleDelete}
            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="단계 삭제"
            data-testid={`delete-node-btn-${id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-3 space-y-2 text-[11px]">
        {/* Owner / Role */}
        <div className="flex items-center gap-1.5 text-slate-600">
          <User className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">
            {data.owner || data.role || '담당자 / 역할 미지정'}
          </span>
        </div>

        {/* Tool */}
        <div className="flex items-center gap-1.5 text-slate-600">
          <Wrench className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{data.tool || '도구 미지정'}</span>
        </div>

        {data.description && (
          <p className="text-[10px] text-slate-400 line-clamp-2 pt-1 border-t border-slate-100">
            {data.description}
          </p>
        )}
      </CardContent>

      {/* Right Source Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-slate-400 hover:!bg-blue-500 !border-2 !border-white transition-colors"
      />
    </Card>
  );
});

WorkflowNode.displayName = 'WorkflowNode';
