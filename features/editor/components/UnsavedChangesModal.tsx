'use client';

import React from 'react';
import { AlertTriangle, Save, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  isSaving?: boolean;
  onSaveAndLeave: () => void;
  onDiscardAndLeave: () => void;
  onCancel: () => void;
}

/**
 * [LOCK 01 & 02] Unsaved Changes Warning Modal
 * Pops up when navigating away from editor with unsaved modifications
 */
export function UnsavedChangesModal({
  isOpen,
  isSaving = false,
  onSaveAndLeave,
  onDiscardAndLeave,
  onCancel,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      data-testid="unsaved-changes-modal"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                저장되지 않은 변경사항이 있습니다
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                페이지를 벗어나면 작업한 내용이 사라질 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            title="닫기"
            data-testid="unsaved-modal-close-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content explanation */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">다음 중 원하는 작업을 선택하세요:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500">
            <li><strong>저장 후 이동:</strong> 수정한 내용을 Supabase DB에 저장하고 이동합니다.</li>
            <li><strong>저장하지 않고 이동:</strong> 최근 변경사항을 취소하고 목록으로 나갑니다.</li>
            <li><strong>계속 편집:</strong> 현재 화면에 머물러 작업을 계속 진행합니다.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            className="w-full sm:w-auto text-xs text-slate-600 hover:text-slate-800"
            data-testid="unsaved-modal-cancel-btn"
          >
            계속 편집
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDiscardAndLeave}
            disabled={isSaving}
            className="w-full sm:w-auto text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 gap-1.5"
            data-testid="unsaved-modal-discard-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            저장하지 않고 이동
          </Button>

          <Button
            size="sm"
            onClick={onSaveAndLeave}
            disabled={isSaving}
            className="w-full sm:w-auto text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
            data-testid="unsaved-modal-save-btn"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? '저장 중...' : '저장 후 이동'}
          </Button>
        </div>
      </div>
    </div>
  );
}
