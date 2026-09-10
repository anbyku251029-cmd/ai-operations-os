'use client';

import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/lib/store/useCanvasStore';
import { WorkflowNode } from '@/components/nodes/WorkflowNode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Save, Clock, DollarSign, Trash2 } from 'lucide-react';

export default function CanvasPage() {
  const {
    nodes,
    edges,
    selectedNode,
    isSaving,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    updateNodeData,
    addNode,
    deleteNode,
    loadCanvas,
    saveCanvas,
  } = useCanvasStore();

  useEffect(() => {
    loadCanvas();
  }, [loadCanvas]);

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), []) as any;

  // 전체 프로세스 시간 및 비용 실시간 자동 합산
  const totalMinutes = useMemo(() => {
    return nodes.reduce((acc, node) => acc + (node.data.timeMinutes || 0), 0);
  }, [nodes]);

  const totalCost = useMemo(() => {
    return nodes.reduce((acc, node) => acc + (node.data.cost || 0), 0);
  }, [nodes]);

  // Inspector에서 현재 선택된 노드 삭제
  const handleDeleteSelected = () => {
    if (selectedNode) {
      deleteNode(selectedNode.id);
    }
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-50">
      <div className="flex flex-col flex-1 h-full relative">
        <header className="h-14 border-b bg-white/90 backdrop-blur px-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800 text-lg">AI Operations OS</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              V0.1 Core
            </span>
          </div>

          {/* 실시간 Process Costing 메트릭 표시 배지 */}
          <div className="hidden md:flex items-center gap-4 bg-slate-100 px-3 py-1.5 rounded-lg border text-xs">
            <span className="text-slate-500 font-medium">프로세스 총계:</span>
            <span className="flex items-center gap-1 font-semibold text-blue-700">
              <Clock className="w-3.5 h-3.5" /> {totalMinutes}분
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <DollarSign className="w-3.5 h-3.5" /> {totalCost.toLocaleString()}원
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={addNode} className="gap-1.5">
              <Plus className="w-4 h-4" /> 단계 추가
            </Button>
            <Button
              size="sm"
              onClick={saveCanvas}
              disabled={isSaving}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4" /> {isSaving ? '저장 중...' : '저장하기'}
            </Button>
          </div>
        </header>

        <div className="flex-1 w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            onPaneClick={() => setSelectedNode(null)}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      {selectedNode && (
        <aside className="w-80 border-l bg-white h-full p-4 flex flex-col z-10 shadow-lg animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-3 border-b">
            <h3 className="font-semibold text-sm text-slate-800">속성 편집기 (Inspector)</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSelectedNode(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-4 py-4 flex-1 overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">단계 명칭 (Label)</label>
              <Input
                value={selectedNode.data.label || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                placeholder="단계명을 입력하세요"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">설명 (SOP / Task Details)</label>
              <Textarea
                rows={3}
                value={selectedNode.data.description || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                placeholder="구체적인 업무 절차를 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">소요 시간 (분)</label>
                <Input
                  type="number"
                  value={selectedNode.data.timeMinutes ?? 0}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { timeMinutes: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">비용 (원)</label>
                <Input
                  type="number"
                  value={selectedNode.data.cost ?? 0}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { cost: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          {/* ✅ 2-6: Inspector 하단 단계 삭제 버튼 */}
          <div className="pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="w-4 h-4" />
              이 단계 삭제
            </Button>
          </div>
        </aside>
      )}
    </div>
  );
}
