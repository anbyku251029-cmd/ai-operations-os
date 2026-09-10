'use client';

import React, { useEffect, useCallback } from 'react';
import { useForm, Resolver, FieldErrors, Path, PathValue } from 'react-hook-form';
import { useEditorStore } from '@/stores/useEditorStore';
import { EditorNode } from '../types/editor';
import { nodeFormSchema, NodeFormValues } from '../schemas/nodeFormSchema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { User, Wrench, Clock, DollarSign, FileText, AlertCircle, X } from 'lucide-react';

interface NodePropertiesFormProps {
  selectedNode: EditorNode;
}

// Zod safeParse 기반 커스텀 리졸버
const customZodResolver: Resolver<NodeFormValues> = async (values) => {
  const parsed = nodeFormSchema.safeParse(values);
  if (parsed.success) {
    return { values: parsed.data, errors: {} };
  }

  const errors: FieldErrors<NodeFormValues> = {};
  for (const issue of parsed.error.issues) {
    const path = issue.path[0] as keyof NodeFormValues;
    if (!errors[path]) {
      errors[path] = {
        type: issue.code,
        message: issue.message,
      };
    }
  }

  return { values: {}, errors };
};

export function NodePropertiesForm({ selectedNode }: NodePropertiesFormProps) {
  const {
    setSelectedNodeId,
    updateNodeData,
    activePropertiesTab,
    setActivePropertiesTab,
  } = useEditorStore();

  const {
    register,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<NodeFormValues>({
    mode: 'onChange',
    resolver: customZodResolver,
    defaultValues: {
      name: selectedNode.data.name || '',
      owner: selectedNode.data.owner || '',
      role: selectedNode.data.role || '',
      tool: selectedNode.data.tool || '',
      description: selectedNode.data.description || '',
      durationMinutes: selectedNode.data.durationMinutes ?? null,
      costAmount: selectedNode.data.costAmount ?? null,
      notes: selectedNode.data.notes || '',
    },
  });

  const isEditingRef = React.useRef(false);

  // [LOCK 02] 선택된 노드가 변경될 때 폼 상태 리셋
  useEffect(() => {
    isEditingRef.current = false;
    reset({
      name: selectedNode.data.name || '',
      owner: selectedNode.data.owner || '',
      role: selectedNode.data.role || '',
      tool: selectedNode.data.tool || '',
      description: selectedNode.data.description || '',
      durationMinutes: selectedNode.data.durationMinutes ?? null,
      costAmount: selectedNode.data.costAmount ?? null,
      notes: selectedNode.data.notes || '',
    });
  }, [selectedNode.id, reset, selectedNode.data]);

  // [LOCK 01, 03 & Section 9] 실시간 변경 핸들러
  const handleFieldChange = useCallback(
    async <K extends Path<NodeFormValues>>(
      field: K,
      value: PathValue<NodeFormValues, K>
    ) => {
      // 입력 세션 시작 시 1회만 History 기록
      if (!isEditingRef.current) {
        useEditorStore.getState().pushHistory();
        isEditingRef.current = true;
      }

      setValue(field, value, { shouldValidate: true });
      await trigger(field);

      // 스토어 실시간 반영
      updateNodeData(selectedNode.id, { [field]: value });
    },
    [selectedNode.id, setValue, trigger, updateNodeData]
  );

  const handleBlur = useCallback(() => {
    // 포커스 해제 시 편집 세션 종료
    isEditingRef.current = false;
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto" data-testid="properties-active-view">
      {/* Node Quick Header */}
      <div className="p-3 border-b bg-slate-50/40 flex items-center justify-between">
        <div className="space-y-0.5 truncate mr-2">
          <span className="text-[10px] font-mono text-slate-400 block truncate">
            NODE: {selectedNode.id}
          </span>
          <span
            className="text-xs font-bold text-slate-800 truncate block"
            data-testid="selected-node-header-title"
          >
            {selectedNode.data.name || '새 단계'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedNodeId(null)}
          className="h-6 px-1.5 text-xs text-slate-400 hover:text-slate-700 gap-1 shrink-0"
          title="선택 해제"
          data-testid="deselect-node-btn"
        >
          <X className="w-3 h-3" />
          <span>해제</span>
        </Button>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b text-xs font-medium bg-slate-50/50">
        <button
          type="button"
          onClick={() => setActivePropertiesTab('properties')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            activePropertiesTab === 'properties'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          data-testid="tab-properties"
        >
          기본 속성
        </button>
        <button
          type="button"
          onClick={() => setActivePropertiesTab('execution')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            activePropertiesTab === 'execution'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          data-testid="tab-execution"
        >
          실행 / 비용
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={(e) => e.preventDefault()} onBlur={handleBlur} className="p-4 space-y-4 text-xs">
        {activePropertiesTab === 'properties' ? (
          <div className="space-y-3.5">
            {/* Step Name (Required) */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                <span>단계 이름 (Step Name) <span className="text-red-500">*</span></span>
              </label>
              <Input
                {...register('name')}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="단계 이름을 입력하세요"
                className={`text-xs ${errors.name ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                data-testid="node-name-input"
              />
              {errors.name && (
                <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1" data-testid="error-name">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.name.message}</span>
                </p>
              )}
            </div>

            {/* Owner */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>담당자 (Owner)</span>
              </label>
              <Input
                {...register('owner')}
                onChange={(e) => handleFieldChange('owner', e.target.value)}
                placeholder="예: 홍길동 팀장"
                className="text-xs"
                data-testid="node-owner-input"
              />
            </div>

            {/* Role */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>역할 (Role)</span>
              </label>
              <Input
                {...register('role')}
                onChange={(e) => handleFieldChange('role', e.target.value)}
                placeholder="예: HR Manager"
                className="text-xs"
                data-testid="node-role-input"
              />
            </div>

            {/* Tool */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-slate-400" />
                <span>사용 도구 (Tool)</span>
              </label>
              <Input
                {...register('tool')}
                onChange={(e) => handleFieldChange('tool', e.target.value)}
                placeholder="예: Slack, Google Forms, Jira"
                className="text-xs"
                data-testid="node-tool-input"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>설명 (Description)</span>
              </label>
              <Textarea
                {...register('description')}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="이 단계의 업무 상세 내용을 기술하세요."
                rows={3}
                className="text-xs resize-none"
                data-testid="node-description-input"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Duration Minutes */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>소요 시간 (분)</span>
              </label>
              <Input
                type="number"
                min="0"
                {...register('durationMinutes')}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Number(e.target.value);
                  handleFieldChange('durationMinutes', val);
                }}
                placeholder="예: 30"
                className={`text-xs ${errors.durationMinutes ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                data-testid="node-duration-input"
              />
              {errors.durationMinutes && (
                <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1" data-testid="error-duration">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.durationMinutes.message}</span>
                </p>
              )}
            </div>

            {/* Cost Amount */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>예상 비용 (원)</span>
              </label>
              <Input
                type="number"
                min="0"
                {...register('costAmount')}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Number(e.target.value);
                  handleFieldChange('costAmount', val);
                }}
                placeholder="예: 50000"
                className={`text-xs ${errors.costAmount ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                data-testid="node-cost-input"
              />
              {errors.costAmount && (
                <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1" data-testid="error-cost">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.costAmount.message}</span>
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>실행 메모 (Notes)</span>
              </label>
              <Textarea
                {...register('notes')}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="추가 지침이나 실행 주의사항을 입력하세요."
                rows={4}
                className="text-xs resize-none"
                data-testid="node-notes-input"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
