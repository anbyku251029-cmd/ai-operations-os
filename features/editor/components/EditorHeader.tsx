'use client';

import React from 'react';
import Link from 'next/link';
import { Workflow } from '@/types/workflow';
import { useEditorStore } from '@/stores/useEditorStore';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  PanelLeft,
  PanelRight,
  Save,
  Check,
  Clock,
  AlertCircle,
  Pencil,
  Trash2,
  Undo,
  Redo,
} from 'lucide-react';

interface EditorHeaderProps {
  workflow: Workflow;
  onEditMetadata?: () => void;
  onDeleteWorkflow?: () => void;
  onSave?: () => void;
  onNavigateBack?: () => void;
}

export function EditorHeader({
  workflow,
  onEditMetadata,
  onDeleteWorkflow,
  onSave,
  onNavigateBack,
}: EditorHeaderProps) {
  const {
    isLeftPanelOpen,
    isRightPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
    saveStatus,
    undo,
    redo,
    past,
    future,
  } = useEditorStore();

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saved':
        return (
          <span
            data-testid="save-status-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            <Check className="w-3 h-3 text-emerald-600" />
            저장됨
          </span>
        );
      case 'unsaved':
        return (
          <span
            data-testid="save-status-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            변경사항 있음
          </span>
        );
      case 'saving':
        return (
          <span
            data-testid="save-status-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse"
          >
            <Clock className="w-3 h-3 text-blue-600" />
            저장 중...
          </span>
        );
      case 'error':
        return (
          <span
            data-testid="save-status-badge"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"
          >
            <AlertCircle className="w-3 h-3 text-red-600" />
            저장 실패
          </span>
        );
    }
  };

  return (
    <header className="h-14 border-b bg-white px-4 flex items-center justify-between shrink-0 select-none z-20">
      {/* Left section: navigation & workflow title */}
      <div className="flex items-center gap-3">
        {onNavigateBack ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateBack}
            disabled={saveStatus === 'saving'}
            className="h-8 px-2.5 text-slate-500 hover:text-slate-900 disabled:opacity-40 gap-1"
            data-testid="header-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">목록으로</span>
          </Button>
        ) : (
          <Link href="/workflows">
            <Button
              variant="ghost"
              size="sm"
              disabled={saveStatus === 'saving'}
              className="h-8 px-2.5 text-slate-500 hover:text-slate-900 disabled:opacity-40 gap-1"
              data-testid="header-back-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">목록으로</span>
            </Button>
          </Link>
        )}

        <div className="h-4 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-slate-800 line-clamp-1 max-w-[200px] sm:max-w-[320px]">
            {workflow.name}
          </h1>
          {onEditMetadata && (
            <button
              onClick={onEditMetadata}
              className="text-slate-400 hover:text-blue-600 transition-colors p-1"
              title="워크플로우 이름/설명 수정"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Middle section: history controls & save status machine */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            className="h-7 w-7 p-0 text-slate-600 disabled:opacity-30 hover:bg-slate-200"
            title="실행 취소 (Ctrl+Z)"
            aria-label="Undo"
            data-testid="undo-btn"
          >
            <Undo className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={!canRedo}
            className="h-7 w-7 p-0 text-slate-600 disabled:opacity-30 hover:bg-slate-200"
            title="다시 실행 (Ctrl+Shift+Z / Ctrl+Y)"
            aria-label="Redo"
            data-testid="redo-btn"
          >
            <Redo className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="h-4 w-[1px] bg-slate-200" />

        {renderSaveStatus()}
      </div>

      {/* Right section: panel toggles & action controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLeftPanel}
          className={`h-8 px-2.5 text-xs gap-1.5 ${
            isLeftPanelOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
          }`}
          title="구조 패널 토글 (Left Panel)"
          data-testid="toggle-left-panel"
        >
          <PanelLeft className="w-4 h-4" />
          <span className="hidden md:inline">구조</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleRightPanel}
          className={`h-8 px-2.5 text-xs gap-1.5 ${
            isRightPanelOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
          }`}
          title="속성 패널 토글 (Right Panel)"
          data-testid="toggle-right-panel"
        >
          <PanelRight className="w-4 h-4" />
          <span className="hidden md:inline">속성</span>
        </Button>

        {onSave && (
          <Button
            size="sm"
            onClick={onSave}
            disabled={saveStatus === 'saving'}
            className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white gap-1.5"
            data-testid="manual-save-btn"
          >
            <Save className="w-3.5 h-3.5" />
            저장
          </Button>
        )}

        {onDeleteWorkflow && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteWorkflow}
            className="h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50"
            title="워크플로우 삭제"
            data-testid="header-delete-btn"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
