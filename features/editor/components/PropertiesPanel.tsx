'use client';

import React from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { Button } from '@/components/ui/button';
import { Sliders, PanelRightClose } from 'lucide-react';
import { NodePropertiesForm } from './NodePropertiesForm';

export function PropertiesPanel() {
  const {
    isRightPanelOpen,
    toggleRightPanel,
    selectedNodeId,
    nodes,
  } = useEditorStore();

  if (!isRightPanelOpen) {
    return null;
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <aside
      className="w-72 sm:w-80 border-l bg-white flex flex-col shrink-0 h-full select-none z-10 transition-all duration-200"
      data-testid="properties-panel"
    >
      <div className="h-11 border-b px-3 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Sliders className="w-3.5 h-3.5 text-blue-600" />
          <span>속성 인스펙터 (Inspector)</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleRightPanel}
          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700"
          title="속성 패널 접기"
          data-testid="collapse-properties-btn"
        >
          <PanelRightClose className="w-3.5 h-3.5" />
        </Button>
      </div>

      {!selectedNodeId || !selectedNode ? (
        /* Empty state when no node is selected */
        <div
          className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3"
          data-testid="properties-empty-state"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-700">선택된 노드가 없습니다</p>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px]">
              캔버스에서 노드를 클릭하면 이곳에서 상세 속성과 파라미터를 수정할 수 있습니다.
            </p>
          </div>
        </div>
      ) : (
        <NodePropertiesForm selectedNode={selectedNode} />
      )}
    </aside>
  );
}
