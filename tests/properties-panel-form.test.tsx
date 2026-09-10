import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { PropertiesPanel } from '@/features/editor/components/PropertiesPanel';
import { useEditorStore } from '@/stores/useEditorStore';

describe('PHASE 07: Properties Panel Form & Inline Node Editing', () => {
  beforeEach(() => {
    useEditorStore.getState().resetEditor();
  });

  it('1. 노드가 선택되지 않았을 때 Empty State 안내 메시지를 표시한다', () => {
    useEditorStore.setState({ selectedNodeId: null });

    render(<PropertiesPanel />);

    expect(screen.getByTestId('properties-empty-state')).toBeDefined();
    expect(screen.getByText('선택된 노드가 없습니다')).toBeDefined();
    expect(
      screen.getByText(/캔버스에서 노드를 클릭하면 이곳에서 상세 속성과 파라미터를 수정할 수 있습니다/)
    ).toBeDefined();
  });

  it('2. 노드 선택 시 기본 속성(이름, 담당자, 도구, 설명)이 폼에 올바르게 바인딩된다', () => {
    useEditorStore.setState({ selectedNodeId: 'step-1' });

    render(<PropertiesPanel />);

    expect(screen.getByTestId('properties-active-view')).toBeDefined();
    expect(screen.getByTestId('selected-node-header-title').textContent).toContain('1. 기본 정보 입력');

    const nameInput = screen.getByTestId('node-name-input') as HTMLInputElement;
    const ownerInput = screen.getByTestId('node-owner-input') as HTMLInputElement;
    const roleInput = screen.getByTestId('node-role-input') as HTMLInputElement;
    const toolInput = screen.getByTestId('node-tool-input') as HTMLInputElement;
    const descInput = screen.getByTestId('node-description-input') as HTMLTextAreaElement;

    expect(nameInput.value).toBe('1. 기본 정보 입력');
    expect(ownerInput.value).toBe('인사담당자');
    expect(roleInput.value).toBe('HR Manager');
    expect(toolInput.value).toBe('Google Forms');
    expect(descInput.value).toBe('신규 입사자의 기본 인적사항 및 서류를 수집합니다.');
  });

  it('3. 필드 입력 시 실시간으로 Zustand Store가 갱신되고 saveStatus가 unsaved로 변경된다', async () => {
    useEditorStore.setState({ selectedNodeId: 'step-1', saveStatus: 'saved' });

    render(<PropertiesPanel />);

    const nameInput = screen.getByTestId('node-name-input');
    fireEvent.change(nameInput, { target: { value: '수정된 첫 번째 단계' } });

    await waitFor(() => {
      const updatedNode = useEditorStore.getState().nodes.find((n) => n.id === 'step-1');
      expect(updatedNode?.data.name).toBe('수정된 첫 번째 단계');
      expect(useEditorStore.getState().saveStatus).toBe('unsaved');
    });

    const ownerInput = screen.getByTestId('node-owner-input');
    fireEvent.change(ownerInput, { target: { value: '김철수 책임' } });

    await waitFor(() => {
      const updatedNode = useEditorStore.getState().nodes.find((n) => n.id === 'step-1');
      expect(updatedNode?.data.owner).toBe('김철수 책임');
    });
  });

  it('4. Zod 스키마 유효성 검증 실패 시 인라인 에러 메시지가 표시된다 (단계 이름 누락)', async () => {
    useEditorStore.setState({ selectedNodeId: 'step-1' });

    render(<PropertiesPanel />);

    const nameInput = screen.getByTestId('node-name-input');
    fireEvent.change(nameInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByTestId('error-name')).toBeDefined();
      expect(screen.getByText('단계 이름을 1자 이상 입력해 주세요.')).toBeDefined();
    });
  });

  it('5. 탭 전환 및 실행/비용 탭의 소요 시간 및 비용 입력 검증이 동작한다', async () => {
    useEditorStore.setState({ selectedNodeId: 'step-1', activePropertiesTab: 'properties' });

    render(<PropertiesPanel />);

    // 탭 전환: 실행 / 비용
    const executionTabBtn = screen.getByTestId('tab-execution');
    fireEvent.click(executionTabBtn);

    expect(useEditorStore.getState().activePropertiesTab).toBe('execution');

    const durationInput = screen.getByTestId('node-duration-input') as HTMLInputElement;
    const costInput = screen.getByTestId('node-cost-input') as HTMLInputElement;

    // 정상 숫자 입력
    fireEvent.change(durationInput, { target: { value: '45' } });
    fireEvent.change(costInput, { target: { value: '120000' } });

    await waitFor(() => {
      const updatedNode = useEditorStore.getState().nodes.find((n) => n.id === 'step-1');
      expect(updatedNode?.data.durationMinutes).toBe(45);
      expect(updatedNode?.data.costAmount).toBe(120000);
    });

    // 음수 입력 시 유효성 검증 에러
    fireEvent.change(durationInput, { target: { value: '-10' } });

    await waitFor(() => {
      expect(screen.getByTestId('error-duration')).toBeDefined();
      expect(screen.getByText('소요 시간은 0분 이상이어야 합니다.')).toBeDefined();
    });
  });

  it('6. [LOCK 02] 노드 간 전환(Node Switching) 시 폼 상태가 안전하게 리셋되고 이전 값은 보존된다', async () => {
    useEditorStore.setState({ selectedNodeId: 'step-1' });

    const { rerender } = render(<PropertiesPanel />);

    // step-1 이름 수정
    const nameInput = screen.getByTestId('node-name-input');
    fireEvent.change(nameInput, { target: { value: '단계 1 변경완료' } });

    await waitFor(() => {
      expect(useEditorStore.getState().nodes.find((n) => n.id === 'step-1')?.data.name).toBe(
        '단계 1 변경완료'
      );
    });

    // step-2로 노드 전환
    useEditorStore.setState({ selectedNodeId: 'step-2' });
    rerender(<PropertiesPanel />);

    await waitFor(() => {
      const updatedNameInput = screen.getByTestId('node-name-input') as HTMLInputElement;
      expect(updatedNameInput.value).toBe('2. 계약서 검토 및 서명');
      expect(screen.getByTestId('selected-node-header-title').textContent).toContain(
        '2. 계약서 검토 및 서명'
      );
    });

    // 다시 step-1로 전환 시 수정한 값이 그대로 남아있는지 확인
    useEditorStore.setState({ selectedNodeId: 'step-1' });
    rerender(<PropertiesPanel />);

    await waitFor(() => {
      const restoredNameInput = screen.getByTestId('node-name-input') as HTMLInputElement;
      expect(restoredNameInput.value).toBe('단계 1 변경완료');
    });
  });

  it('7. 노드 선택 해제(Deselect) 버튼을 누르면 Empty State로 복귀한다', () => {
    useEditorStore.setState({ selectedNodeId: 'step-1' });

    render(<PropertiesPanel />);

    const deselectBtn = screen.getByTestId('deselect-node-btn');
    fireEvent.click(deselectBtn);

    expect(useEditorStore.getState().selectedNodeId).toBeNull();
    expect(screen.getByTestId('properties-empty-state')).toBeDefined();
  });
});
