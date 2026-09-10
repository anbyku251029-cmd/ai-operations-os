import { describe, it, expect } from 'vitest';
import { createWorkflowSchema, updateWorkflowSchema } from '@/features/workflow/schemas/workflow-schema';
import {
  getWorkflowById,
  updateWorkflowAction,
  deleteWorkflowAction,
} from '@/features/workflow/actions/workflow-actions';

describe('PHASE 03 Workflow CRUD Validation Tests', () => {
  describe('createWorkflowSchema', () => {
    it('유효한 워크플로우 이름과 설명을 통과시켜야 한다', () => {
      const result = createWorkflowSchema.safeParse({
        name: '신규 고객 온보딩 플로우',
        description: '고객 등록 후 첫 결제까지의 전체 경로',
      });
      expect(result.success).toBe(true);
    });

    it('설명(description)이 없어도 통과해야 한다', () => {
      const result = createWorkflowSchema.safeParse({
        name: '단순 워크플로우',
      });
      expect(result.success).toBe(true);
    });

    it('이름이 공백 문자열이면 에러가 발생해야 한다 (trim 검증)', () => {
      const result = createWorkflowSchema.safeParse({
        name: '   ',
        description: '설명만 있음',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('워크플로우 이름을 입력해 주세요.');
      }
    });

    it('이름이 100자를 초과하면 에러가 발생해야 한다', () => {
      const result = createWorkflowSchema.safeParse({
        name: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('워크플로우 이름은 100자 이하로 입력해 주세요.');
      }
    });
  });

  describe('updateWorkflowSchema', () => {
    it('선택적 업데이트 필드를 허용해야 한다', () => {
      const result = updateWorkflowSchema.safeParse({
        description: '설명만 수정',
      });
      expect(result.success).toBe(true);
    });

    it('이름을 공백으로 수정하려 하면 에러가 발생해야 한다', () => {
      const result = updateWorkflowSchema.safeParse({
        name: '   ',
      });
      expect(result.success).toBe(false);
    });

    it('유효한 이름과 설명 수정을 통과시켜야 한다', () => {
      const result = updateWorkflowSchema.safeParse({
        name: '수정된 워크플로우 명칭',
        description: '수정된 설명 내용',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Workflow Data Actions (CRUD Integration)', () => {
    it('기존 워크플로우를 ID로 조회할 수 있어야 한다', async () => {
      const wf = await getWorkflowById('wf-default-1');
      expect(wf).not.toBeNull();
      expect(wf?.name).toContain('신규 직원 온보딩');
    });

    it('존재하지 않는 ID 조회 시 null을 반환해야 한다', async () => {
      const wf = await getWorkflowById('non-existent-id');
      expect(wf).toBeNull();
    });

    it('워크플로우 정보를 정상적으로 수정(UPDATE)할 수 있어야 한다', async () => {
      const res = await updateWorkflowAction('wf-default-1', {
        name: '온보딩 프로세스 V2 (업데이트됨)',
        description: '최신 자동화가 추가된 온보딩 프로세스',
      });

      expect(res.success).toBe(true);
      expect(res.workflow?.name).toBe('온보딩 프로세스 V2 (업데이트됨)');

      const updated = await getWorkflowById('wf-default-1');
      expect(updated?.name).toBe('온보딩 프로세스 V2 (업데이트됨)');
    });

    it('존재하지 않는 워크플로우 수정 시 실패해야 한다', async () => {
      const res = await updateWorkflowAction('invalid-id-999', {
        name: '없는 워크플로우',
      });
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('워크플로우를 정상적으로 삭제(DELETE)할 수 있어야 한다', async () => {
      const res = await deleteWorkflowAction('wf-default-2');
      expect(res.success).toBe(true);

      const deleted = await getWorkflowById('wf-default-2');
      expect(deleted).toBeNull();
    });
  });
});
