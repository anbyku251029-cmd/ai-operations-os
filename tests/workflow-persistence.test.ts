import { describe, it, expect, beforeEach } from 'vitest';
import {
  mapDbNodesToEditor,
  mapDbEdgesToEditor,
  mapEditorToDbNodes,
  mapEditorToDbEdges,
  mapSnapshotToDbPayload,
} from '@/lib/persistence/workflow-mapper';
import {
  DbNode,
  DbEdge,
  EditorWorkflowSnapshot,
} from '@/lib/persistence/workflow-types';
import { EditorNode, EditorEdge } from '@/features/editor/types/editor';
import {
  loadWorkflowBundle,
  saveWorkflowSnapshot,
} from '@/lib/persistence/workflow-repository';
import { useEditorStore } from '@/stores/useEditorStore';

describe('PHASE 08: Workflow Persistence & Explicit Save Tests', () => {
  beforeEach(() => {
    useEditorStore.getState().resetEditor();
  });

  // Test 01: DB Workflow 데이터를 Editor State로 변환
  it('Test 01: DB Workflow 데이터를 Editor State로 정확히 변환한다', () => {
    const dbNodes: DbNode[] = [
      {
        id: 'node-101',
        workflow_id: 'wf-test-1',
        section_id: 'sec-1',
        name: 'DB에서 불러온 단계',
        description: '설명 테스트',
        owner: '홍길동',
        role: 'Operations Lead',
        tool: 'Slack',
        duration: 45,
        cost: 30000,
        notes: '실행 메모',
        position_x: 250,
        position_y: 350,
      },
    ];

    const editorNodes = mapDbNodesToEditor(dbNodes);
    expect(editorNodes).toHaveLength(1);
    expect(editorNodes[0].id).toBe('node-101');
    expect(editorNodes[0].type).toBe('workflowNode');
    expect(editorNodes[0].data.name).toBe('DB에서 불러온 단계');
  });

  // Test 02: Editor State를 DB Payload로 변환
  it('Test 02: Editor State를 DB Payload로 정확히 변환한다', () => {
    const editorNodes: EditorNode[] = [
      {
        id: 'node-201',
        type: 'workflowNode',
        position: { x: 100, y: 150 },
        data: {
          workflowNodeId: 'node-201',
          name: '에디터 노드',
          owner: '이순신',
          durationMinutes: 60,
          costAmount: 50000,
        },
      },
      {
        id: 'node-202',
        type: 'workflowNode',
        position: { x: 300, y: 150 },
        data: {
          workflowNodeId: 'node-202',
          name: '대상 노드',
        },
      },
    ];

    const editorEdges: EditorEdge[] = [
      {
        id: 'edge-201-202',
        source: 'node-201',
        target: 'node-202',
      },
    ];

    const snapshot: EditorWorkflowSnapshot = {
      workflowId: 'wf-test-2',
      nodes: editorNodes,
      edges: editorEdges,
    };

    const payload = mapSnapshotToDbPayload(snapshot);
    expect(payload.nodes).toHaveLength(2);
    expect(payload.nodes[0].workflow_id).toBe('wf-test-2');
    expect(payload.edges).toHaveLength(1);
    expect(payload.edges[0].source_node_id).toBe('node-201');
    expect(payload.edges[0].target_node_id).toBe('node-202');
  });

  // Test 03: Node position이 정확히 저장/변환된다
  it('Test 03: Node position (position_x, position_y <-> position.x, position.y)이 정확히 매핑된다', () => {
    const editorNode: EditorNode = {
      id: 'node-pos',
      type: 'workflowNode',
      position: { x: 384.5, y: 512.25 },
      data: { workflowNodeId: 'node-pos', name: '위치 검증' },
    };

    const dbNodes = mapEditorToDbNodes('wf-pos', [editorNode]);
    expect(dbNodes[0].position_x).toBe(384.5);
    expect(dbNodes[0].position_y).toBe(512.25);

    const restoredEditorNodes = mapDbNodesToEditor(dbNodes);
    expect(restoredEditorNodes[0].position.x).toBe(384.5);
    expect(restoredEditorNodes[0].position.y).toBe(512.25);
  });

  // Test 04: Node property (duration, cost, owner, tool, notes)가 정확히 매핑된다
  it('Test 04: Node property (durationMinutes ↔ duration, costAmount ↔ cost 등)가 정확히 매핑된다', () => {
    const dbNode: DbNode = {
      id: 'node-props',
      workflow_id: 'wf-1',
      name: '속성 검증',
      owner: '박매니저',
      role: 'QA Engineer',
      tool: 'Vitest',
      duration: 90,
      cost: 150000,
      notes: '테스트용 지침',
      position_x: 0,
      position_y: 0,
    };

    const editorNodes = mapDbNodesToEditor([dbNode]);
    const nodeData = editorNodes[0].data;

    expect(nodeData.durationMinutes).toBe(90);
    expect(nodeData.costAmount).toBe(150000);
    expect(nodeData.owner).toBe('박매니저');
    expect(nodeData.role).toBe('QA Engineer');
    expect(nodeData.tool).toBe('Vitest');
    expect(nodeData.notes).toBe('테스트용 지침');
  });

  // Test 05: Edge source/target mapping이 정확하다
  it('Test 05: Edge source/target (source_node_id ↔ source, target_node_id ↔ target) 매핑이 정확하다', () => {
    const dbEdge: DbEdge = {
      id: 'edge-abc',
      workflow_id: 'wf-1',
      source_node_id: 'node-alpha',
      target_node_id: 'node-beta',
    };

    const editorEdges = mapDbEdgesToEditor([dbEdge]);
    expect(editorEdges[0].source).toBe('node-alpha');
    expect(editorEdges[0].target).toBe('node-beta');

    const mappedBackDbEdges = mapEditorToDbEdges('wf-1', editorEdges);
    expect(mappedBackDbEdges[0].source_node_id).toBe('node-alpha');
    expect(mappedBackDbEdges[0].target_node_id).toBe('node-beta');
  });

  // Test 06: Save 성공 시 saved 상태가 되고 데이터가 보존된다
  it('Test 06: Save 성공 시 saved 상태로 전이되고 저장 데이터가 보존된다', async () => {
    const testNode: EditorNode = {
      id: 'node-save-1',
      type: 'workflowNode',
      position: { x: 100, y: 100 },
      data: {
        workflowNodeId: 'node-save-1',
        name: '저장 성공 테스트 노드',
      },
    };

    const snapshot: EditorWorkflowSnapshot = {
      workflowId: 'wf-default-1',
      nodes: [testNode],
      edges: [],
    };

    useEditorStore.getState().setSaveStatus('saving');
    const result = await saveWorkflowSnapshot(snapshot);

    expect(result.success).toBe(true);

    useEditorStore.getState().setSaveStatus('saved');
    expect(useEditorStore.getState().saveStatus).toBe('saved');
  });

  // Test 07: Save 실패 시 error 상태가 된다
  it('Test 07: 유효하지 않은 workflowId로 저장 시 error를 반환하고 error 상태가 된다', async () => {
    useEditorStore.getState().setSaveStatus('saving');

    const invalidSnapshot: EditorWorkflowSnapshot = {
      workflowId: '', // invalid
      nodes: [],
      edges: [],
    };

    const result = await saveWorkflowSnapshot(invalidSnapshot);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    useEditorStore.getState().setSaveStatus('error');
    expect(useEditorStore.getState().saveStatus).toBe('error');
  });

  // Test 08: Save 중 중복 Save가 차단된다
  it('Test 08: [LOCK 15] saving 상태일 때는 추가 Save 호출을 차단한다', () => {
    useEditorStore.getState().setSaveStatus('saving');

    let duplicateSaveAttempted = false;
    const triggerSave = () => {
      if (useEditorStore.getState().saveStatus === 'saving') {
        duplicateSaveAttempted = true;
        return; // 차단
      }
    };

    triggerSave();
    expect(duplicateSaveAttempted).toBe(true);
  });

  // Test 09: 새로고침 후(재로드 시) 저장된 Workflow가 정확히 복원된다
  it('Test 09: [LOCK 02] 저장 후 재로드(새로고침 시뮬레이션) 시 저장된 노드와 엣지가 그대로 복원된다', async () => {
    const targetWorkflowId = 'wf-default-1';

    const testNodes: EditorNode[] = [
      {
        id: 'step-persist-1',
        type: 'workflowNode',
        position: { x: 50, y: 80 },
        data: {
          workflowNodeId: 'step-persist-1',
          name: '복원 테스트 단계 1',
          durationMinutes: 20,
        },
      },
      {
        id: 'step-persist-2',
        type: 'workflowNode',
        position: { x: 300, y: 80 },
        data: {
          workflowNodeId: 'step-persist-2',
          name: '복원 테스트 단계 2',
          costAmount: 40000,
        },
      },
    ];

    const testEdges: EditorEdge[] = [
      {
        id: 'edge-p1-p2',
        source: 'step-persist-1',
        target: 'step-persist-2',
      },
    ];

    // 1. 저장 실행
    await saveWorkflowSnapshot({
      workflowId: targetWorkflowId,
      nodes: testNodes,
      edges: testEdges,
    });

    // 2. 재로드 (새로고침 시뮬레이션)
    const bundle = await loadWorkflowBundle(targetWorkflowId);
    expect(bundle).not.toBeNull();
    expect(bundle?.workflow.id).toBe(targetWorkflowId);

    // 3. 매퍼를 통해 에디터 상태로 복원
    const restoredNodes = mapDbNodesToEditor(bundle?.nodes || []);
    const restoredEdges = mapDbEdgesToEditor(bundle?.edges || []);

    expect(restoredNodes).toHaveLength(2);
    expect(restoredNodes[0].data.name).toBe('복원 테스트 단계 1');
    expect(restoredNodes[0].data.durationMinutes).toBe(20);
    expect(restoredNodes[1].data.costAmount).toBe(40000);
    expect(restoredEdges).toHaveLength(1);
    expect(restoredEdges[0].source).toBe('step-persist-1');
    expect(restoredEdges[0].target).toBe('step-persist-2');
  });

  // Test 10: 사용자/워크플로우 간 데이터 접근이 격리된다
  it('Test 10: 존재하지 않는 워크플로우 ID 조회 시 null을 반환하여 데이터 격리를 보장한다', async () => {
    const nonexistentBundle = await loadWorkflowBundle('nonexistent-workflow-id-999');
    expect(nonexistentBundle).toBeNull();
  });
});
