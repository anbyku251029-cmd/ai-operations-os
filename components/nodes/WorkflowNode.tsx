import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { WorkflowNodeData, WorkflowNodeType, useCanvasStore } from '@/lib/store/useCanvasStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, DollarSign, Trash2 } from 'lucide-react';

// ✅ NodeProps<WorkflowNodeType> 엄격 타입 적용
export const WorkflowNode = memo(({ data, selected, id }: NodeProps<WorkflowNodeType>) => {
  const deleteNode = useCanvasStore((state) => state.deleteNode);

  const handleDelete = (e: React.MouseEvent) => {
    // 노드 클릭 이벤트가 캔버스 선택으로 버블링되지 않도록 차단
    e.stopPropagation();
    if (id) {
      deleteNode(id);
    }
  };

  return (
    <Card
      className={`w-64 border-2 shadow-md transition-all ${
        selected ? 'border-blue-500 shadow-blue-100 ring-2 ring-blue-400' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-3 !h-3" />

      <CardHeader className="p-3 pb-1.5">
        <div className="flex items-start justify-between gap-1">
          <CardTitle className="text-sm font-semibold text-slate-800 line-clamp-1 flex-1">
            {data.label || '제목 없음'}
          </CardTitle>
          {/* ✅ 휴지통 삭제 버튼 (2-5) */}
          <button
            onClick={handleDelete}
            className="shrink-0 p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="이 단계 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        <p className="text-xs text-slate-500 line-clamp-2 min-h-[2rem]">
          {data.description || '설명이 없습니다.'}
        </p>

        <div className="flex items-center gap-3 mt-3 pt-2 border-t text-[11px] text-slate-600">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            {data.timeMinutes ?? 0}분
          </span>
          <span className="flex items-center gap-1 font-medium">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            {(data.cost ?? 0).toLocaleString()}원
          </span>
        </div>
      </CardContent>

      <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-3 !h-3" />
    </Card>
  );
});

WorkflowNode.displayName = 'WorkflowNode';
