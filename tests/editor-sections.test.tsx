import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useEditorStore } from '@/stores/useEditorStore';
import { StructurePanel } from '@/features/editor/components/StructurePanel';
import {
  mapEditorToDbSections,
  mapDbSectionsToEditor,
  mapSnapshotToDbPayload,
} from '@/lib/persistence/workflow-mapper';
import { DbSection } from '@/lib/persistence/workflow-types';
import { EditorSection } from '@/features/editor/types/section';

describe('PHASE 11: Multi-Section Hierarchy & Store Logic', () => {
  beforeEach(() => {
    act(() => {
      useEditorStore.getState().resetEditor();
    });
  });

  it('기본 초기 상태에는 1개 이상의 기본 섹션이 존재해야 한다', () => {
    const { sections } = useEditorStore.getState();
    expect(sections.length).toBeGreaterThanOrEqual(1);
    expect(sections[0].id).toBe('section-1');
    expect(sections[0].name).toBe('1. 입사 및 기초 등록');
    expect(sections[0].isCollapsed).toBe(false);
  });

  it('addSection 호출 시 새로운 섹션이 추가되어야 한다', () => {
    act(() => {
      useEditorStore.getState().addSection('신규 섹션');
    });

    const { sections } = useEditorStore.getState();
    expect(sections.length).toBe(2);
    expect(sections[1].name).toBe('신규 섹션');
    expect(sections[1].position).toBe(1);
  });

  it('updateSection 호출 시 해당 섹션의 제목이 변경되어야 한다', () => {
    act(() => {
      useEditorStore.getState().updateSection('section-1', '변경된 섹션명');
    });

    const { sections } = useEditorStore.getState();
    expect(sections[0].name).toBe('변경된 섹션명');
  });

  it('toggleSectionCollapse 호출 시 접힘/펼침 상태가 토글되어야 한다', () => {
    const initialCollapsed = useEditorStore.getState().sections[0].isCollapsed;

    act(() => {
      useEditorStore.getState().toggleSectionCollapse('section-1');
    });

    expect(useEditorStore.getState().sections[0].isCollapsed).toBe(!initialCollapsed);

    act(() => {
      useEditorStore.getState().toggleSectionCollapse('section-1');
    });

    expect(useEditorStore.getState().sections[0].isCollapsed).toBe(initialCollapsed);
  });

  it('[LOCK 02] 섹션 삭제 시 속해있던 노드들이 남아있는 섹션으로 안전하게 재할당되어야 한다 (Orphan Node 방지)', () => {
    // 1. 섹션 2개 생성
    act(() => {
      useEditorStore.getState().addSection('섹션 2');
    });

    const { sections } = useEditorStore.getState();
    const section1Id = sections[0].id;
    const section2Id = sections[1].id;

    // 2. 섹션 1에 속한 노드와 섹션 2에 속한 노드 배치
    act(() => {
      useEditorStore.getState().addNode(undefined, undefined, section2Id);
    });

    const nodesBefore = useEditorStore.getState().nodes;
    const nodeInSection2 = nodesBefore.find((n) => n.data.sectionId === section2Id);
    expect(nodeInSection2).toBeDefined();

    // 3. 섹션 2 삭제
    act(() => {
      useEditorStore.getState().deleteSection(section2Id);
    });

    const stateAfter = useEditorStore.getState();
    expect(stateAfter.sections.some((s) => s.id === section2Id)).toBe(false);

    // 4. 섹션 2에 있던 노드가 남아있는 섹션(section1Id)으로 안전하게 재할당되었는지 검증
    const reallocatedNode = stateAfter.nodes.find((n) => n.id === nodeInSection2!.id);
    expect(reallocatedNode).toBeDefined();
    expect(reallocatedNode?.data.sectionId).toBe(section1Id);
  });

  it('Undo / Redo 시 섹션 변경 내역이 온전히 복원되어야 한다', () => {
    // 초기 섹션 수
    const initialCount = useEditorStore.getState().sections.length;

    // 섹션 추가
    act(() => {
      useEditorStore.getState().addSection('Undo 테스트 섹션');
    });
    expect(useEditorStore.getState().sections.length).toBe(initialCount + 1);

    // Undo 실행
    act(() => {
      useEditorStore.getState().undo();
    });
    expect(useEditorStore.getState().sections.length).toBe(initialCount);

    // Redo 실행
    act(() => {
      useEditorStore.getState().redo();
    });
    expect(useEditorStore.getState().sections.length).toBe(initialCount + 1);
  });
});

describe('PHASE 11: StructurePanel Multi-Section Rendering & Interaction', () => {
  beforeEach(() => {
    act(() => {
      useEditorStore.getState().resetEditor();
    });
  });

  it('StructurePanel에 섹션 제목과 스텝 추가 버튼이 렌더링되어야 한다', () => {
    render(<StructurePanel />);

    expect(screen.getByText('1. 입사 및 기초 등록')).toBeInTheDocument();
    expect(screen.getByTestId('structure-add-section-btn')).toBeInTheDocument();
  });

  it('새 섹션 추가 버튼 클릭 시 새로운 섹션이 리스트에 표시되어야 한다', () => {
    render(<StructurePanel />);

    const addSectionBtn = screen.getByTestId('structure-add-section-btn');
    fireEvent.click(addSectionBtn);

    expect(screen.getByText('새 섹션 2')).toBeInTheDocument();
  });

  it('스텝 클릭 시 setSelectedNodeId가 호출되어 해당 노드가 선택되어야 한다', () => {
    render(<StructurePanel />);

    const { nodes } = useEditorStore.getState();
    const firstNode = nodes[0];

    const stepItem = screen.getByTestId(`structure-step-item-${firstNode.id}`);
    expect(stepItem).toBeInTheDocument();

    fireEvent.click(stepItem);

    expect(useEditorStore.getState().selectedNodeId).toBe(firstNode.id);
  });
});

describe('PHASE 11: DB Persistence Mapper for Sections', () => {
  it('EditorSection 배열이 DbSection 배열로 올바르게 변환되어야 한다', () => {
    const editorSections: EditorSection[] = [
      { id: 'sec-1', name: '기획', position: 0, isCollapsed: false },
      { id: 'sec-2', name: '개발', position: 1, isCollapsed: true },
    ];

    const dbSections = mapEditorToDbSections('test-wf-1', editorSections);

    expect(dbSections).toHaveLength(2);
    expect(dbSections[0]).toEqual({
      id: 'sec-1',
      workflow_id: 'test-wf-1',
      name: '기획',
      position: 0,
    });
    expect(dbSections[1]).toEqual({
      id: 'sec-2',
      workflow_id: 'test-wf-1',
      name: '개발',
      position: 1,
    });
  });

  it('DbSection 배열이 EditorSection 배열로 올바르게 복원되어야 한다', () => {
    const dbSections: DbSection[] = [
      { id: 'sec-db-1', workflow_id: 'test-wf-1', name: '검토', position: 0 },
      { id: 'sec-db-2', workflow_id: 'test-wf-1', name: '승인', position: 1 },
    ];

    const editorSections = mapDbSectionsToEditor(dbSections);

    expect(editorSections).toHaveLength(2);
    expect(editorSections[0].id).toBe('sec-db-1');
    expect(editorSections[0].name).toBe('검토');
    expect(editorSections[0].position).toBe(0);
    expect(editorSections[0].isCollapsed).toBe(false);
  });

  it('mapSnapshotToDbPayload에 sections가 포함되어 직렬화되어야 한다', () => {
    const state = useEditorStore.getState();
    const payload = mapSnapshotToDbPayload({
      workflowId: 'test-wf-1',
      nodes: state.nodes,
      edges: state.edges,
      sections: state.sections,
    });

    expect(payload.sections).toBeDefined();
    expect(payload.sections.length).toBeGreaterThanOrEqual(1);
    expect(payload.sections[0].workflow_id).toBe('test-wf-1');
  });
});
