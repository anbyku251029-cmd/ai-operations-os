import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { useEditorStore } from '@/stores/useEditorStore';
import { CanvasPanel } from '@/features/editor/components/CanvasPanel';
import { EditorNode, EditorEdge } from '@/features/editor/types/editor';

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
    }),
    Handle: () => <div data-testid="mock-handle" />,
    ReactFlow: ({
      nodes,
      edges,
      children,
    }: {
      nodes: EditorNode[];
      edges: EditorEdge[];
      children?: React.ReactNode;
    }) => (
      <div data-testid="mock-react-flow">
        <div data-testid="mock-nodes-count">{nodes.length}</div>
        <div data-testid="mock-edges-count">{edges.length}</div>
        {edges.map((e) => (
          <div key={e.id} data-testid={`mock-rendered-edge-${e.id}`}>
            {e.source} -&gt; {e.target}
          </div>
        ))}
        {children}
      </div>
    ),
    Controls: () => <div data-testid="mock-controls" />,
    Background: () => <div data-testid="mock-background" />,
  };
});

describe('PHASE 06 Canvas Edge Connection Tests (with LOCKs 01 ~ 04)', () => {
  beforeEach(() => {
    act(() => {
      useEditorStore.getState().resetEditor();
    });
  });

  it('Test 01 [LOCK 01]: Edge는 최소 데이터 구조(id, source, target, type)를 가진다', () => {
    const initialEdges = useEditorStore.getState().edges;
    expect(initialEdges.length).toBeGreaterThan(0);

    const firstEdge = initialEdges[0];
    expect(firstEdge.id).toBeDefined();
    expect(firstEdge.source).toBe('step-1');
    expect(firstEdge.target).toBe('step-2');
    expect(firstEdge.type).toBe('smoothstep');
  });

  it('Test 02: 두 노드 간 onConnect 호출 시 새로운 엣지가 생성된다', () => {
    // 신규 노드 추가
    let newStepId = '';
    act(() => {
      newStepId = useEditorStore.getState().addNode('3. 시스템 배포');
    });

    const initialEdgeCount = useEditorStore.getState().edges.length;

    // step-2 -> step-3 연결
    act(() => {
      useEditorStore.getState().onConnect({
        source: 'step-2',
        target: newStepId,
        sourceHandle: null,
        targetHandle: null,
      });
    });

    const currentEdges = useEditorStore.getState().edges;
    expect(currentEdges.length).toBe(initialEdgeCount + 1);

    const createdEdge = currentEdges.find(
      (e) => e.source === 'step-2' && e.target === newStepId
    );
    expect(createdEdge).toBeDefined();
    expect(createdEdge?.type).toBe('smoothstep');
  });

  it('Test 03 [LOCK 02]: 자기 자신으로의 연결(source === target)은 차단된다', () => {
    const initialCount = useEditorStore.getState().edges.length;

    act(() => {
      useEditorStore.getState().onConnect({
        source: 'step-1',
        target: 'step-1',
        sourceHandle: null,
        targetHandle: null,
      });
    });

    expect(useEditorStore.getState().edges.length).toBe(initialCount);
  });

  it('Test 04 [LOCK 02]: 동일한 source + target 조합의 중복 엣지는 차단된다', () => {
    const initialCount = useEditorStore.getState().edges.length;
    // 이미 존재하는 step-1 -> step-2 연결 재시도
    act(() => {
      useEditorStore.getState().onConnect({
        source: 'step-1',
        target: 'step-2',
        sourceHandle: null,
        targetHandle: null,
      });
    });

    expect(useEditorStore.getState().edges.length).toBe(initialCount);
  });

  it('Test 05: 엣지 생성 시 Save 상태가 unsaved로 전이된다', () => {
    act(() => {
      useEditorStore.getState().setSaveStatus('saved');
    });
    expect(useEditorStore.getState().saveStatus).toBe('saved');

    // 새 노드 생성 후 연결
    let newId = '';
    act(() => {
      newId = useEditorStore.getState().addNode('검증 단계');
      useEditorStore.getState().setSaveStatus('saved'); // 테스트를 위해 임의 재설정
    });

    act(() => {
      useEditorStore.getState().onConnect({
        source: 'step-1',
        target: newId,
        sourceHandle: null,
        targetHandle: null,
      });
    });

    expect(useEditorStore.getState().saveStatus).toBe('unsaved');
  });

  it('Test 06 [LOCK 03]: deleteEdge 호출 시 선택된 엣지만 삭제된다 (노드는 영향 없음)', () => {
    const targetEdgeId = useEditorStore.getState().edges[0].id;
    const initialNodeCount = useEditorStore.getState().nodes.length;

    act(() => {
      useEditorStore.getState().deleteEdge(targetEdgeId);
    });

    const exists = useEditorStore.getState().edges.some((e) => e.id === targetEdgeId);
    expect(exists).toBe(false);
    expect(useEditorStore.getState().nodes.length).toBe(initialNodeCount);
  });

  it('Test 07: 엣지 삭제 시 Save 상태가 unsaved로 전이된다', () => {
    act(() => {
      useEditorStore.getState().setSaveStatus('saved');
    });

    const targetEdgeId = useEditorStore.getState().edges[0].id;
    act(() => {
      useEditorStore.getState().deleteEdge(targetEdgeId);
    });

    expect(useEditorStore.getState().saveStatus).toBe('unsaved');
  });

  it('Test 08 [LOCK 03]: Node 삭제 시 해당 Node와 연결된 Edge는 Cascade Delete된다', () => {
    // step-1이 소스인 엣지가 존재함
    const initialEdges = useEditorStore.getState().edges;
    expect(initialEdges.some((e) => e.source === 'step-1' || e.target === 'step-1')).toBe(true);

    // step-1 노드 삭제
    act(() => {
      useEditorStore.getState().deleteNode('step-1');
    });

    // step-1과 연결된 모든 엣지가 연쇄 삭제되었는지 확인
    const remainingEdges = useEditorStore.getState().edges;
    const hasOrphanEdges = remainingEdges.some(
      (e) => e.source === 'step-1' || e.target === 'step-1'
    );
    expect(hasOrphanEdges).toBe(false);
  });

  it('Test 09 [LOCK 03]: 특정 Node 삭제 시 무관한 다른 노드 간의 Edge는 보존된다', () => {
    // 3개 노드 준비: step-1 -> step-2, step-2 -> step-3
    let step3Id = '';
    act(() => {
      step3Id = useEditorStore.getState().addNode('3. 독립 단계');
      useEditorStore.getState().onConnect({
        source: 'step-2',
        target: step3Id,
        sourceHandle: null,
        targetHandle: null,
      });
    });

    expect(useEditorStore.getState().edges.length).toBe(2);

    // step-1 삭제 -> step-1과 연관된 엣지만 삭제되고 step-2 -> step-3은 보존되어야 함
    act(() => {
      useEditorStore.getState().deleteNode('step-1');
    });

    const remainingEdges = useEditorStore.getState().edges;
    expect(remainingEdges.length).toBe(1);
    expect(remainingEdges[0].source).toBe('step-2');
    expect(remainingEdges[0].target).toBe(step3Id);
  });

  it('Test 10 [LOCK 04]: CanvasPanel에 노드와 엣지가 조화롭게 렌더링된다', () => {
    render(<CanvasPanel />);

    expect(screen.getByTestId('mock-nodes-count').textContent).toBe('2');
    expect(screen.getByTestId('mock-edges-count').textContent).toBe('1');
    expect(screen.getByText(/2개 노드 · 1개 연결/)).toBeDefined();
  });
});
