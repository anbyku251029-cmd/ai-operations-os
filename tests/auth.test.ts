import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema } from '@/features/auth/schemas/auth-schema';

describe('PHASE 02 Authentication Unit Tests', () => {
  describe('loginSchema Validation', () => {
    it('올바른 이메일과 비밀번호를 검증해야 한다', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('이메일 형식이 아니면 실패해야 한다', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('올바른 이메일 형식을 입력해 주세요.');
      }
    });

    it('비밀번호가 비어있으면 실패해야 한다', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('비밀번호를 입력해 주세요.');
      }
    });
  });

  describe('signupSchema Validation', () => {
    it('올바른 회원가입 데이터를 통과시켜야 한다', () => {
      const result = signupSchema.safeParse({
        email: 'newuser@example.com',
        password: 'securePassword123',
        confirmPassword: 'securePassword123',
      });
      expect(result.success).toBe(true);
    });

    it('비밀번호가 6자 미만이면 실패해야 한다', () => {
      const result = signupSchema.safeParse({
        email: 'newuser@example.com',
        password: '123',
        confirmPassword: '123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('비밀번호는 최소 6자 이상이어야 합니다.');
      }
    });

    it('비밀번호와 확인 비밀번호가 불일치하면 실패해야 한다', () => {
      const result = signupSchema.safeParse({
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password456',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('비밀번호가 일치하지 않습니다.');
      }
    });
  });
});
