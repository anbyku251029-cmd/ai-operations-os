import React, { useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEditorStore } from '@/stores/useEditorStore';
import { WorkflowNode } from './WorkflowNode';
import { EditorNode } from '../types/editor';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * [LOCK 03] Viewport Pan Focus Controller
 * Step 클릭 시 캔버스 뷰포트를 해당 노드로 부드럽게 이동(Pan/Center)
 */
function CanvasFocusController({
  selectedNodeId,
  nodes,
}: {
  selectedNodeId: string | null;
  nodes: EditorNode[];
}) {
  const rf = useReactFlow();
  const prevSelectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!rf || typeof rf.setCenter !== 'function') return;

    if (selectedNodeId && selectedNodeId !== prevSelectedIdRef.current) {
      prevSelectedIdRef.current = selectedNodeId;
      const targetNode = nodes.find((n) => n.id === selectedNodeId);
      if (targetNode) {
        // 노드 중앙 기준 뷰포트 이동 (폭 220px, 높이 100px 고려)
        const centerX = targetNode.position.x + 110;
        const centerY = targetNode.position.y + 50;
        const currentZoom = typeof rf.getZoom === 'function' ? rf.getZoom() : 1;
        rf.setCenter(centerX, centerY, { duration: 400, zoom: Math.max(currentZoom, 1) });
      }
    } else if (!selectedNodeId) {
      prevSelectedIdRef.current = null;
    }
  }, [selectedNodeId, nodes, rf]);

  return null;
}

export function CanvasPanel() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
    deleteEdge,
    selectedNodeId,
    selectedEdgeId,
    setSelectedNodeId,
    setSelectedEdgeId,
    undo,
    redo,
    onNodeDragStart,
  } = useEditorStore();

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), []);

  // [LOCK 03 & Section 15] 단축키 (Delete, Undo, Redo)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 폼 인풋 및 텍스트 영역 내부에서는 네이티브 입력 동작 보존
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Redo: Ctrl+Y / Cmd+Y
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          deleteNode(selectedNodeId);
        } else if (selectedEdgeId) {
          e.preventDefault();
          deleteEdge(selectedEdgeId);
        }
      }
    },
    [selectedNodeId, selectedEdgeId, deleteNode, deleteEdge, undo, redo]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleAddStep = () => {
    addNode();
  };

  return (
    <main
      className="flex-1 relative w-full h-full bg-slate-50 overflow-hidden"
      data-testid="canvas-panel"
    >
      {/* Top Floating Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm border shadow-sm p-1.5 rounded-lg select-none">
        <Button
          size="sm"
          onClick={handleAddStep}
          className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
          data-testid="add-step-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Add Step</span>
        </Button>
        <span className="text-[11px] text-slate-400 px-1 border-l">
          {nodes.length}개 노드 · {edges.length}개 연결
        </span>
      </div>

      {/* React Flow Canvas Viewport with Nodes and Edges */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeDragStart={onNodeDragStart}
        onNodeClick={(_event, node) => {
          setSelectedNodeId(node.id);
        }}
        onEdgeClick={(_event, edge) => {
          setSelectedEdgeId(edge.id);
        }}
        onPaneClick={() => {
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
        }}
        fitView
        deleteKeyCode={null}
      >
        <CanvasFocusController selectedNodeId={selectedNodeId} nodes={nodes} />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
        <Controls showInteractive={false} className="border bg-white shadow-sm rounded-md" />
      </ReactFlow>

      {/* Empty State Overlay when no nodes exist */}
      {nodes.length === 0 && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
          data-testid="canvas-empty-state"
        >
          <div className="bg-white/95 backdrop-blur-sm border rounded-xl p-8 max-w-sm text-center shadow-lg pointer-events-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Plus className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-800">Create your first step</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                업무의 첫 번째 단계를 만들어보세요.
              </p>
            </div>
            <Button
              onClick={handleAddStep}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs w-full"
              data-testid="empty-add-step-btn"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Step</span>
            </Button>
          </div>
        </div>
      )}

      {/* Floating Canvas Watermark/Status */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border px-3 py-1.5 rounded-md text-[11px] text-slate-500 shadow-sm pointer-events-none select-none z-10 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        <span>Canvas Edge Engine · {nodes.length} Nodes · {edges.length} Edges</span>
      </div>
    </main>
  );
}
