'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Workflow } from '@/types/workflow';
import { useEditorStore } from '@/stores/useEditorStore';
import { EditorHeader } from './EditorHeader';
import { StructurePanel } from './StructurePanel';
import { CanvasPanel } from './CanvasPanel';
import { PropertiesPanel } from './PropertiesPanel';
import {
  updateWorkflowAction,
  deleteWorkflowAction,
} from '@/features/workflow/actions/workflow-actions';
import { saveWorkflowSnapshot } from '@/lib/persistence/workflow-repository';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning';
import { UnsavedChangesModal } from './UnsavedChangesModal';

interface WorkflowEditorProps {
  workflow: Workflow;
}

export function WorkflowEditor({ workflow: initialWorkflow }: WorkflowEditorProps) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [name, setName] = useState(initialWorkflow.name);
  const [description, setDescription] = useState(initialWorkflow.description || '');
  const [editError, setEditError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);

  const { sections, nodes, edges, setSaveStatus, saveStatus } = useEditorStore();

  // [LOCK 01 & 02] 브라우저 종료/새로고침 시 미저장 경고 훅
  useUnsavedChangesWarning(saveStatus === 'unsaved');

  const handleNavigateBack = () => {
    if (saveStatus === 'saving') {
      return;
    }
    if (saveStatus === 'unsaved') {
      setIsUnsavedModalOpen(true);
    } else {
      router.push('/workflows');
    }
  };

  const handleDiscardAndLeave = () => {
    setIsUnsavedModalOpen(false);
    router.push('/workflows');
  };

  const handleSaveAndLeave = async () => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');

    const snapshot = {
      workflowId: workflow.id,
      sections: [...sections],
      nodes: [...nodes],
      edges: [...edges],
    };

    try {
      const res = await saveWorkflowSnapshot(snapshot);
      if (res.success) {
        setSaveStatus('saved');
        toast.success('워크플로우가 저장되었습니다.');
        setIsUnsavedModalOpen(false);
        router.push('/workflows');
      } else {
        setSaveStatus('error');
        toast.error(res.error || '워크플로우 저장 중 오류가 발생했습니다.');
      }
    } catch (err: unknown) {
      setSaveStatus('error');
      const msg = err instanceof Error ? err.message : '저장 중 네트워크 오류가 발생했습니다.';
      toast.error(msg);
    }
  };

  const handleSave = async () => {
    // [LOCK 15] 저장 진행 중 중복 호출 방지
    if (saveStatus === 'saving') return;

    setSaveStatus('saving');

    // [LOCK 13] 저장 시점의 불변 스냅샷 복제
    const snapshot = {
      workflowId: workflow.id,
      sections: [...sections],
      nodes: [...nodes],
      edges: [...edges],
    };

    try {
      const res = await saveWorkflowSnapshot(snapshot);
      if (res.success) {
        setSaveStatus('saved');
        toast.success('워크플로우가 Supabase에 성공적으로 저장되었습니다.');
      } else {
        setSaveStatus('error');
        toast.error(res.error || '워크플로우 저장 중 오류가 발생했습니다.');
      }
    } catch (err: unknown) {
      setSaveStatus('error');
      const msg = err instanceof Error ? err.message : '저장 중 네트워크 오류가 발생했습니다.';
      toast.error(msg);
    }
  };

  const handleUpdateMetadata = () => {
    if (!name.trim()) {
      setEditError('워크플로우 이름을 입력해 주세요.');
      return;
    }

    startTransition(async () => {
      const res = await updateWorkflowAction(workflow.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (res.success && res.workflow) {
        setWorkflow(res.workflow);
        setIsEditingMetadata(false);
        setEditError(null);
        toast.success('워크플로우 기본 정보가 수정되었습니다.');
      } else {
        setEditError(res.error || '수정 중 오류가 발생했습니다.');
        toast.error(res.error || '수정 실패');
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`정말로 "${workflow.name}" 워크플로우를 삭제하시겠습니까?`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteWorkflowAction(workflow.id);
      if (res.success) {
        toast.success('워크플로우가 삭제되었습니다.');
        router.push('/workflows');
      } else {
        toast.error('삭제 중 오류가 발생했습니다.');
      }
    });
  };

  return (
    <div
      className="w-screen h-screen flex flex-col overflow-hidden bg-slate-100"
      data-testid="workflow-editor-root"
    >
      {/* 1. Top Editor Header */}
      <EditorHeader
        workflow={workflow}
        onEditMetadata={() => setIsEditingMetadata(true)}
        onDeleteWorkflow={handleDelete}
        onSave={handleSave}
        onNavigateBack={handleNavigateBack}
      />

      {/* 2. Metadata Edit Modal Overlay */}
      {isEditingMetadata && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border shadow-xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-base font-bold text-slate-800">워크플로우 정보 수정</h2>
            {editError && (
              <div className="p-2 bg-red-50 text-red-600 border border-red-200 rounded text-xs">
                {editError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  워크플로우 이름 *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="워크플로우 이름"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  설명 (선택)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="워크플로우 설명"
                  className="w-full text-sm p-2 border rounded-md border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingMetadata(false)}
                disabled={isPending}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateMetadata}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 3-Panel Main Editor Body */}
      <div className="flex flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden relative">
        {/* Left: Structure Outline Panel */}
        <StructurePanel />

        {/* Center: Canvas Viewport Shell */}
        <CanvasPanel />

        {/* Right: Properties Inspector Panel */}
        <PropertiesPanel />
      </div>

      {/* 4. Unsaved Changes Navigation Guard Modal */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        isSaving={saveStatus === 'saving'}
        onSaveAndLeave={handleSaveAndLeave}
        onDiscardAndLeave={handleDiscardAndLeave}
        onCancel={() => setIsUnsavedModalOpen(false)}
      />
    </div>
  );
}
