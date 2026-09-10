'use client';

import React, { useState } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { Button } from '@/components/ui/button';
import {
  Layers,
  PanelLeftClose,
  ChevronRight,
  Plus,
  CheckCircle2,
  Trash2,
  Pencil,
  Check,
} from 'lucide-react';

export function StructurePanel() {
  const {
    isLeftPanelOpen,
    toggleLeftPanel,
    sections,
    addSection,
    updateSection,
    deleteSection,
    toggleSectionCollapse,
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
  } = useEditorStore();

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');

  if (!isLeftPanelOpen) {
    return null;
  }

  const handleStartRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSectionId(id);
    setEditingSectionName(currentName);
  };

  const handleSaveRename = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    if (editingSectionName.trim()) {
      updateSection(id, editingSectionName.trim());
    }
    setEditingSectionId(null);
  };

  return (
    <aside
      className="w-60 border-r bg-white flex flex-col shrink-0 h-full select-none z-10 transition-all duration-200"
      data-testid="structure-panel"
    >
      {/* 1. Header with panel collapse button */}
      <div className="h-11 border-b px-3 flex items-center justify-between bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>프로세스 구조</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded-full font-normal">
            {nodes.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLeftPanel}
          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700"
          title="구조 패널 접기"
          data-testid="collapse-structure-btn"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* 2. Action toolbar: Add Section and Add Step */}
      <div className="p-3 border-b bg-slate-50/30 flex items-center justify-between shrink-0">
        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
          섹션 및 단계
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => addSection()}
            className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
            title="새 섹션 추가"
            data-testid="structure-add-section-btn"
          >
            <Plus className="w-3 h-3" /> 섹션
          </button>
          <button
            onClick={() => addNode()}
            className="text-[11px] text-slate-600 hover:text-slate-800 font-medium flex items-center gap-0.5 border-l pl-2 border-slate-200"
            title="새 단계 추가"
            data-testid="structure-add-step-btn"
          >
            <Plus className="w-3 h-3" /> 단계
          </button>
        </div>
      </div>

      {/* 3. Dynamic Multi-Sections Hierarchy */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" data-testid="structure-steps-list">
        {sections.map((section, secIndex) => {
          const sectionNodes = nodes.filter(
            (n) => n.data.sectionId === section.id || (!n.data.sectionId && secIndex === 0)
          );
          const isCollapsed = Boolean(section.isCollapsed);

          return (
            <div
              key={section.id}
              className="rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden text-xs transition-all shadow-2xs"
              data-testid={`structure-section-${section.id}`}
            >
              {/* Section Header */}
              <div
                onClick={() => toggleSectionCollapse(section.id)}
                className="p-2 bg-slate-100/70 hover:bg-slate-100 flex items-center justify-between cursor-pointer group transition-colors"
                data-testid={`section-header-${section.id}`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0 ${
                      isCollapsed ? '' : 'rotate-90 text-slate-600'
                    }`}
                  />

                  {editingSectionId === section.id ? (
                    <div
                      className="flex items-center gap-1 flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editingSectionName}
                        onChange={(e) => setEditingSectionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(section.id, e);
                          if (e.key === 'Escape') setEditingSectionId(null);
                        }}
                        autoFocus
                        className="text-xs font-semibold px-1 py-0.5 bg-white border border-blue-400 rounded w-full focus:outline-hidden"
                        data-testid={`section-rename-input-${section.id}`}
                      />
                      <button
                        onClick={(e) => handleSaveRename(section.id, e)}
                        className="text-blue-600 hover:text-blue-700 p-0.5"
                        title="저장"
                        data-testid={`section-rename-save-${section.id}`}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className="font-bold text-slate-700 truncate block text-[11px]"
                      title={section.name}
                      data-testid={`section-title-${section.id}`}
                    >
                      {section.name}
                    </span>
                  )}
                </div>

                {/* Section header action controls */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] text-slate-400 px-1 py-0.2 bg-white rounded-full border border-slate-200">
                    {sectionNodes.length}
                  </span>

                  {editingSectionId !== section.id && (
                    <button
                      onClick={(e) => handleStartRename(section.id, section.name, e)}
                      className="text-slate-400 hover:text-blue-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="섹션 이름 수정"
                      data-testid={`section-edit-btn-${section.id}`}
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                  )}

                  <button
                    onClick={() => addNode(undefined, undefined, section.id)}
                    className="text-slate-400 hover:text-blue-600 p-0.5"
                    title="이 섹션에 단계 추가"
                    data-testid={`section-add-step-btn-${section.id}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  {sections.length > 1 && (
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="text-slate-400 hover:text-red-600 p-0.5"
                      title="섹션 삭제 (단계는 기본 섹션으로 이동)"
                      data-testid={`section-delete-btn-${section.id}`}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Steps inside this section */}
              {!isCollapsed && (
                <div className="p-1 space-y-1 bg-white/60 border-t border-slate-100">
                  {sectionNodes.length === 0 ? (
                    <div className="p-2 text-center text-[10px] text-slate-400">
                      <span>단계를 추가해 주세요.</span>
                    </div>
                  ) : (
                    sectionNodes.map((node, index) => {
                      const isSelected = selectedNodeId === node.id;
                      return (
                        <button
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`w-full text-left px-2 py-1.5 rounded transition-all flex items-center justify-between group ${
                            isSelected
                              ? 'bg-blue-100/80 text-blue-800 font-semibold shadow-xs'
                              : 'hover:bg-slate-100 text-slate-600'
                          }`}
                          data-testid={`structure-step-item-${node.id}`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <CheckCircle2
                              className={`w-3 h-3 shrink-0 ${
                                isSelected ? 'text-blue-600' : 'text-slate-300'
                              }`}
                            />
                            <span className="truncate">
                              {node.data.name || `단계 ${index + 1}`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 group-hover:text-slate-500 shrink-0 ml-1">
                            #{index + 1}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
