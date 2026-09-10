'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Workflow } from '@/types/workflow';
import { WorkflowEditor } from '@/features/editor/components/WorkflowEditor';
import { EditorSkeleton } from '@/features/editor/components/EditorSkeleton';
import { EditorErrorState } from '@/features/editor/components/EditorErrorState';
import { loadWorkflowBundle } from '@/lib/persistence/workflow-repository';
import {
  mapDbSectionsToEditor,
  mapDbNodesToEditor,
  mapDbEdgesToEditor,
} from '@/lib/persistence/workflow-mapper';
import { useEditorStore } from '@/stores/useEditorStore';

export default function WorkflowDetailPage() {
  const params = useParams();
  const workflowId = params.workflowId as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const { setSections, setNodes, setEdges, setSaveStatus } = useEditorStore();

  const fetchBundle = useCallback(
    async (isRetryAction = false) => {
      if (!workflowId) return;

      if (isRetryAction) {
        setIsRetrying(true);
      } else {
        setIsLoading(true);
      }

      try {
        const bundle = await loadWorkflowBundle(workflowId);
        if (bundle && bundle.workflow) {
          setWorkflow(bundle.workflow);

          // DB에 저장된 섹션 및 노드가 있는 경우 매퍼를 통해 스토어에 주입
          if (bundle.sections && bundle.sections.length > 0) {
            const editorSections = mapDbSectionsToEditor(bundle.sections);
            setSections(editorSections);
          }

          if (bundle.nodes && bundle.nodes.length > 0) {
            const editorNodes = mapDbNodesToEditor(bundle.nodes);
            const editorEdges = mapDbEdgesToEditor(bundle.edges || []);
            setNodes(editorNodes);
            setEdges(editorEdges);
          }
          setSaveStatus('saved');
        } else {
          setWorkflow(null);
        }
      } catch {
        setWorkflow(null);
      } finally {
        setIsLoading(false);
        setIsRetrying(false);
      }
    },
    [workflowId, setSections, setNodes, setEdges, setSaveStatus]
  );

  useEffect(() => {
    fetchBundle(false);
  }, [fetchBundle]);

  if (isLoading) {
    return <EditorSkeleton />;
  }

  if (!workflow) {
    return (
      <EditorErrorState
        title="워크플로우를 찾을 수 없습니다"
        description="요청하신 워크플로우가 존재하지 않거나 일시적인 네트워크 문제가 발생했습니다."
        onRetry={() => fetchBundle(true)}
        isRetrying={isRetrying}
      />
    );
  }

  return <WorkflowEditor workflow={workflow} />;
}
