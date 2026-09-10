import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useEditorStore } from '@/stores/useEditorStore';
import { CanvasPanel } from '@/features/editor/components/CanvasPanel';
import { StructurePanel } from '@/features/editor/components/StructurePanel';
import { WorkflowNode } from '@/features/editor/components/WorkflowNode';
import { EditorNode } from '@/features/editor/types/editor';

// next/link mock
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// @xyflow/react mock
vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    useReactFlow: () => ({
      setCenter: vi.fn(),
      fitView: vi.fn(),
      zoomTo: vi.fn(),
    }),
    Handle: () => <div data-testid="mock-handle" />,
    ReactFlow: ({
      nodes,
      children,
      onNodeClick,
      onPaneClick,
    }: {
      nodes: EditorNode[];
      children?: React.ReactNode;
      onNodeClick?: (e: React.MouseEvent, node: EditorNode) => void;
      onPaneClick?: () => void;
    }) => (
      <div
        data-testid="mock-react-flow"
        onClick={() => {
          if (onPaneClick) onPaneClick();
        }}
      >
        {nodes.map((n) => (
          <div
            key={n.id}
            data-testid={`mock-rendered-node-${n.id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onNodeClick) onNodeClick(e, n);
            }}
          >
            {n.data.name}
          </div>
        ))}
        {children}
      </div>
    ),
    Controls: () => <div data-testid="mock-controls" />,
    Background: () => <div data-testid="mock-background" />,
  };
});

describe('PHASE 05 Canvas Core & Node Interaction Tests', () => {
  beforeEach(() => {
    act(() => {
      useEditorStore.getState().resetEditor();
    });
  });

  it('Test 01: Canvas가 정상적으로 렌더링된다', () => {
    render(<CanvasPanel />);
    expect(screen.getByTestId('canvas-panel')).toBeDefined();
    expect(screen.getByTestId('mock-react-flow')).toBeDefined();
    expect(screen.getByTestId('add-step-btn')).toBeDefined();
  });

  it('Test 02: Add Step 클릭 시 Node가 생성된다', () => {
    render(<CanvasPanel />);
    const initialCount = useEditorStore.getState().nodes.length;

    const addBtn = screen.getByTestId('add-step-btn');
    fireEvent.click(addBtn);

    const afterCount = useEditorStore.getState().nodes.length;
    expect(afterCount).toBe(initialCount + 1);
  });

  it('Test 03: 생성된 Node가 Canvas에 표시된다', () => {
    render(<CanvasPanel />);
    let createdId = '';
    act(() => {
      createdId = useEditorStore.getState().addNode('특별 승인 단계');
    });

    expect(screen.getByTestId(`mock-rendered-node-${createdId}`)).toBeDefined();
    expect(screen.getByText('특별 승인 단계')).toBeDefined();
  });

  it('Test 04: Node 클릭 시 selectedNodeId가 변경된다', () => {
    render(<CanvasPanel />);
    const firstNode = useEditorStore.getState().nodes[0];

    const renderedNode = screen.getByTestId(`mock-rendered-node-${firstNode.id}`);
    fireEvent.click(renderedNode);

    expect(useEditorStore.getState().selectedNodeId).toBe(firstNode.id);
  });

  it('Test 05: WorkflowNode 컴포넌트에서 선택 상태가 시각적으로 표시된다 (selected=true)', () => {
    const mockNode: EditorNode = {
      id: 'test-node-1',
      type: 'workflowNode',
      position: { x: 0, y: 0 },
      data: {
        workflowNodeId: 'test-node-1',
        name: '단위 테스트 노드',
        owner: '김철수',
        role: '테스터',
        tool: 'Vitest',
      },
      selected: true,
    };

    const { rerender } = render(
      <WorkflowNode
        id={mockNode.id}
        data={mockNode.data}
        selected={true}
        type="workflowNode"
        zIndex={1}
        isConnectable={true}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        dragging={false}
        draggable={true}
        selectable={true}
        deletable={true}
      />
    );

    const nodeCard = screen.getByTestId('workflow-node-test-node-1');
    expect(nodeCard.getAttribute('data-selected')).toBe('true');
    expect(nodeCard.className).toContain('border-blue-500');

    // 비선택 상태 전환
    rerender(
      <WorkflowNode
        id={mockNode.id}
        data={mockNode.data}
        selected={false}
        type="workflowNode"
        zIndex={1}
        isConnectable={true}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        dragging={false}
        draggable={true}
        selectable={true}
        deletable={true}
      />
    );
    expect(nodeCard.getAttribute('data-selected')).toBe('false');
  });

  it('Test 06: Node Drag 후 position이 변경된다', () => {
    const node = useEditorStore.getState().nodes[0];
    const initialPos = { ...node.position };

    act(() => {
      useEditorStore.getState().onNodesChange([
        {
          type: 'position',
          id: node.id,
          position: { x: 300, y: 450 },
          dragging: false,
        },
      ]);
    });

    const updatedNode = useEditorStore.getState().nodes.find((n) => n.id === node.id);
    expect(updatedNode?.position.x).toBe(300);
    expect(updatedNode?.position.y).toBe(450);
    expect(updatedNode?.position).not.toEqual(initialPos);
  });

  it('Test 07: Node Delete 후 Node가 제거된다', () => {
    const targetNode = useEditorStore.getState().nodes[0];

    act(() => {
      useEditorStore.getState().deleteNode(targetNode.id);
    });

    const exists = useEditorStore.getState().nodes.some((n) => n.id === targetNode.id);
    expect(exists).toBe(false);
  });

  it('Test 08: Node 생성 및 삭제 후 Save 상태가 unsaved가 된다', () => {
    // 1. 초기 saved 상태 확인
    act(() => {
      useEditorStore.getState().setSaveStatus('saved');
    });
    expect(useEditorStore.getState().saveStatus).toBe('saved');

    // 2. Node 생성 -> unsaved 전환
    act(() => {
      useEditorStore.getState().addNode('임시 노드');
    });
    expect(useEditorStore.getState().saveStatus).toBe('unsaved');

    // 3. 다시 saved 설정 후
    act(() => {
      useEditorStore.getState().setSaveStatus('saved');
    });

    // 4. Node 삭제 -> unsaved 전환
    const nodeId = useEditorStore.getState().nodes[0].id;
    act(() => {
      useEditorStore.getState().deleteNode(nodeId);
    });
    expect(useEditorStore.getState().saveStatus).toBe('unsaved');
  });

  it('Test 09: 여러 Node를 생성했을 때 각각 독립적으로 존재한다', () => {
    act(() => {
      useEditorStore.getState().setNodes([]);
    });

    let id1 = '';
    let id2 = '';
    act(() => {
      id1 = useEditorStore.getState().addNode('단계 A', { x: 10, y: 10 });
      id2 = useEditorStore.getState().addNode('단계 B', { x: 100, y: 100 });
    });

    const nodes = useEditorStore.getState().nodes;
    expect(nodes.length).toBe(2);
    expect(id1).not.toBe(id2);
    expect(nodes[0].data.name).toBe('단계 A');
    expect(nodes[1].data.name).toBe('단계 B');
  });

  it('Test 10: Node가 없는 상태에서 Empty State가 표시된다', () => {
    act(() => {
      useEditorStore.getState().setNodes([]);
    });

    render(<CanvasPanel />);
    expect(screen.getByTestId('canvas-empty-state')).toBeDefined();
    expect(screen.getByText('Create your first step')).toBeDefined();

    // Empty state 내부의 버튼 클릭으로 추가 가능 확인
    const emptyAddBtn = screen.getByTestId('empty-add-step-btn');
    fireEvent.click(emptyAddBtn);

    expect(useEditorStore.getState().nodes.length).toBe(1);
  });

  it('Test 11: Structure Panel과 Node 선택 상태가 동기화된다', () => {
    render(<StructurePanel />);
    const firstNode = useEditorStore.getState().nodes[0];

    const stepItem = screen.getByTestId(`structure-step-item-${firstNode.id}`);
    fireEvent.click(stepItem);

    expect(useEditorStore.getState().selectedNodeId).toBe(firstNode.id);
  });
});
