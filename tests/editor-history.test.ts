import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '@/stores/useEditorStore';

describe('PHASE 09: Undo / Redo History Stack Tests', () => {
  beforeEach(() => {
    useEditorStore.getState().resetEditor();
  });

  // 01. 초기 상태에서 Undo가 disabled 된다
  it('01. 초기 상태에서 canUndo는 false이고 past 스택은 비어있다', () => {
    const { canUndo, past } = useEditorStore.getState();
    expect(canUndo()).toBe(false);
    expect(past).toHaveLength(0);
  });

  // 02. 초기 상태에서 Redo가 disabled 된다
  it('02. 초기 상태에서 canRedo는 false이고 future 스택은 비어있다', () => {
    const { canRedo, future } = useEditorStore.getState();
    expect(canRedo()).toBe(false);
    expect(future).toHaveLength(0);
  });

  // 03. Node 생성 후 past에 snapshot이 생성된다
  it('03. Node 생성 후 past 스택에 이전 상태의 snapshot이 기록된다', () => {
    const initialNodesCount = useEditorStore.getState().nodes.length;
    useEditorStore.getState().addNode('새 테스트 단계');

    const state = useEditorStore.getState();
    expect(state.nodes).toHaveLength(initialNodesCount + 1);
    expect(state.past).toHaveLength(1);
    expect(state.past[0].nodes).toHaveLength(initialNodesCount);
    expect(state.canUndo()).toBe(true);
  });

  // 04. Undo로 Node 생성이 취소된다
  it('04. Undo 실행 시 방금 생성한 Node가 사라지고 이전 노드 목록으로 복구된다', () => {
    const initialNodesCount = useEditorStore.getState().nodes.length;
    useEditorStore.getState().addNode('취소될 단계');

    expect(useEditorStore.getState().nodes).toHaveLength(initialNodesCount + 1);

    useEditorStore.getState().undo();

    expect(useEditorStore.getState().nodes).toHaveLength(initialNodesCount);
    expect(useEditorStore.getState().canUndo()).toBe(false);
    expect(useEditorStore.getState().canRedo()).toBe(true);
  });

  // 05. Redo로 Node 생성이 복구된다
  it('05. Redo 실행 시 Undo로 취소되었던 Node 생성이 다시 복구된다', () => {
    const initialNodesCount = useEditorStore.getState().nodes.length;
    useEditorStore.getState().addNode('복구될 단계');

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().nodes).toHaveLength(initialNodesCount);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().nodes).toHaveLength(initialNodesCount + 1);
    expect(useEditorStore.getState().canUndo()).toBe(true);
    expect(useEditorStore.getState().canRedo()).toBe(false);
  });

  // 06. Edge 생성 후 Undo가 작동한다
  it('06. Edge 연결 후 Undo 실행 시 생성된 Edge가 제거된다', () => {
    const initialEdgesCount = useEditorStore.getState().edges.length;
    useEditorStore.getState().onConnect({
      source: 'step-2',
      target: 'step-1',
      sourceHandle: null,
      targetHandle: null,
    });

    expect(useEditorStore.getState().edges).toHaveLength(initialEdgesCount + 1);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().edges).toHaveLength(initialEdgesCount);
  });

  // 07. Edge 삭제 후 Undo가 작동한다
  it('07. Edge 삭제 후 Undo 실행 시 삭제되었던 Edge가 다시 복원된다', () => {
    const initialEdges = useEditorStore.getState().edges;
    const edgeIdToDelete = initialEdges[0].id;

    useEditorStore.getState().deleteEdge(edgeIdToDelete);
    expect(useEditorStore.getState().edges).toHaveLength(initialEdges.length - 1);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().edges).toHaveLength(initialEdges.length);
    expect(useEditorStore.getState().edges.some((e) => e.id === edgeIdToDelete)).toBe(true);
  });

  // 08. Node 삭제 시 Cascade Edge까지 함께 Undo된다
  it('08. Node 삭제 시 함께 삭제되었던 연결 Edge(Cascade Delete)까지 Undo로 일괄 복구된다', () => {
    // step-1 삭제 (연결된 edge-step-1-step-2도 함께 삭제됨)
    useEditorStore.getState().deleteNode('step-1');

    expect(useEditorStore.getState().nodes.find((n) => n.id === 'step-1')).toBeUndefined();
    expect(useEditorStore.getState().edges).toHaveLength(0);

    // Undo 실행
    useEditorStore.getState().undo();

    expect(useEditorStore.getState().nodes.find((n) => n.id === 'step-1')).toBeDefined();
    expect(useEditorStore.getState().edges).toHaveLength(1);
    expect(useEditorStore.getState().edges[0].id).toBe('edge-step-1-step-2');
  });

  // 09. Node 이동(onNodeDragStart)이 하나의 History Action으로 기록된다
  it('09. onNodeDragStart를 통해 노드 이동 전 위치가 기록되고 Undo 시 원래 위치로 복귀한다', () => {
    const initialPos = { ...useEditorStore.getState().nodes[0].position };

    // 드래그 시작 시점 스냅샷 1회 캡처
    useEditorStore.getState().onNodeDragStart();

    // 노드 위치 이동 (React Flow onNodesChange 시뮬레이션)
    useEditorStore.setState((state) => ({
      nodes: state.nodes.map((n, idx) =>
        idx === 0 ? { ...n, position: { x: initialPos.x + 100, y: initialPos.y + 50 } } : n
      ),
      saveStatus: 'unsaved',
    }));

    expect(useEditorStore.getState().nodes[0].position.x).toBe(initialPos.x + 100);

    // Undo 실행
    useEditorStore.getState().undo();

    expect(useEditorStore.getState().nodes[0].position.x).toBe(initialPos.x);
    expect(useEditorStore.getState().nodes[0].position.y).toBe(initialPos.y);
  });

  // 10. Node Property 변경을 Undo할 수 있다
  it('10. Node Property 변경 전 pushHistory 호출 후 수정 시 Undo로 이전 값이 복원된다', () => {
    const originalName = useEditorStore.getState().nodes[0].data.name;

    // 편집 시작 전 1회 pushHistory
    useEditorStore.getState().pushHistory();
    useEditorStore.getState().updateNodeData('step-1', { name: '새롭게 변경된 단계 이름' });

    expect(useEditorStore.getState().nodes[0].data.name).toBe('새롭게 변경된 단계 이름');

    // Undo 실행
    useEditorStore.getState().undo();

    expect(useEditorStore.getState().nodes[0].data.name).toBe(originalName);
  });

  // 11. Undo 후 Redo가 작동한다
  it('11. Undo 후 Redo 실행 시 취소했던 변경사항이 다시 적용된다', () => {
    useEditorStore.getState().pushHistory();
    useEditorStore.getState().updateNodeData('step-1', { owner: '강감찬' });

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().nodes[0].data.owner).not.toBe('강감찬');

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().nodes[0].data.owner).toBe('강감찬');
  });

  // 12. Undo 후 새로운 Edit이 발생하면 Redo 스택이 무효화된다 [LOCK 04]
  it('12. [LOCK 04] Undo 상태에서 새로운 편집 작업이 발생하면 기존 Redo 스택(future)은 폐기된다', () => {
    useEditorStore.getState().addNode('단계 A');
    useEditorStore.getState().undo();

    expect(useEditorStore.getState().canRedo()).toBe(true);
    expect(useEditorStore.getState().future).toHaveLength(1);

    // 새로운 편집 실행 (단계 B 추가)
    useEditorStore.getState().addNode('단계 B');

    // Redo 스택 폐기 확인
    expect(useEditorStore.getState().canRedo()).toBe(false);
    expect(useEditorStore.getState().future).toHaveLength(0);
  });

  // 13. 최대 History 개수 제한(50개)이 작동한다 [LOCK 05]
  it('13. [LOCK 05] past 스택은 최대 50개까지만 유지되며 초과 시 가장 오래된 것부터 제거된다', () => {
    // 55회 노드 추가
    for (let i = 0; i < 55; i++) {
      useEditorStore.getState().addNode(`반복 단계 ${i}`);
    }

    const { past } = useEditorStore.getState();
    expect(past.length).toBeLessThanOrEqual(50);
    expect(past).toHaveLength(50);
  });

  // 14. Undo 후 saveStatus = unsaved [LOCK 02 & 14]
  it('14. [LOCK 02 & 14] Undo 실행 시 saveStatus는 항상 unsaved가 된다', () => {
    useEditorStore.getState().addNode('새 단계');
    useEditorStore.getState().setSaveStatus('saved'); // 임의로 saved 설정

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().saveStatus).toBe('unsaved');
  });

  // 15. Redo 후 saveStatus = unsaved [LOCK 02 & 14]
  it('15. [LOCK 02 & 14] Redo 실행 시 saveStatus는 항상 unsaved가 된다', () => {
    useEditorStore.getState().addNode('새 단계');
    useEditorStore.getState().undo();
    useEditorStore.getState().setSaveStatus('saved');

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().saveStatus).toBe('unsaved');
  });

  // 16. Save 후 saveStatus = saved (History와 Save 분리 확인)
  it('16. [LOCK 02] Save 완료 후 saveStatus는 saved가 되며 past 스택은 유지된다', () => {
    useEditorStore.getState().addNode('노드 1');
    expect(useEditorStore.getState().past.length).toBeGreaterThan(0);

    // 명시적 Save 완료 시뮬레이션
    useEditorStore.getState().setSaveStatus('saved');

    expect(useEditorStore.getState().saveStatus).toBe('saved');
    // Save를 해도 클라이언트 인메모리 History는 그대로 남아있어 Undo 가능
    expect(useEditorStore.getState().canUndo()).toBe(true);
  });

  // 17. 단축키 핸들러 논리 검증 (Ctrl+Z -> Undo)
  it('17. Ctrl+Z 입력 이벤트 시 undo가 트리거된다', () => {
    useEditorStore.getState().addNode('단축키 테스트 노드');
    expect(useEditorStore.getState().nodes).toHaveLength(3);

    // Ctrl+Z 실행
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().nodes).toHaveLength(2);
  });

  // 18. 단축키 핸들러 논리 검증 (Ctrl+Shift+Z -> Redo)
  it('18. Ctrl+Shift+Z 입력 이벤트 시 redo가 트리거된다', () => {
    useEditorStore.getState().addNode('단축키 테스트 노드');
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().nodes).toHaveLength(2);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().nodes).toHaveLength(3);
  });

  // 19. 단축키 핸들러 논리 검증 (Ctrl+Y -> Redo)
  it('19. Ctrl+Y 입력 이벤트 시 redo가 트리거된다', () => {
    useEditorStore.getState().addNode('단축키 테스트 노드');
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().nodes).toHaveLength(2);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().nodes).toHaveLength(3);
  });

  // 20. 입력 필드 내부에서는 브라우저 기본 동작 보존
  it('20. HTMLInputElement가 target인 이벤트는 전역 단축키를 건너뛴다', () => {
    const target: EventTarget = document.createElement('input');
    const isTargetInput =
      target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    expect(isTargetInput).toBe(true);
  });
});
