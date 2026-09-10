import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { SignupForm } from '@/features/auth/components/SignupForm';
import { UserMenu } from '@/components/layout/UserMenu';

// next/link mock
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('PHASE 02 Authentication Component Tests', () => {
  it('LoginForm이 정상 렌더링되어야 한다', () => {
    render(<LoginForm />);
    expect(screen.getByText('로그인', { selector: '[data-slot="card-title"]' })).toBeDefined();
    expect(screen.getByLabelText('이메일')).toBeDefined();
    expect(screen.getByLabelText('비밀번호')).toBeDefined();
    expect(screen.getByRole('button', { name: '로그인' })).toBeDefined();
  });

  it('SignupForm이 정상 렌더링되어야 한다', () => {
    render(<SignupForm />);
    expect(screen.getByText('회원가입', { selector: '[data-slot="card-title"]' })).toBeDefined();
    expect(screen.getByLabelText('이메일')).toBeDefined();
    expect(screen.getByLabelText(/비밀번호 \(최소 6자 이상\)/)).toBeDefined();
    expect(screen.getByLabelText('비밀번호 확인')).toBeDefined();
    expect(screen.getByRole('button', { name: '회원가입 완료' })).toBeDefined();
  });

  it('UserMenu에 사용자 이메일과 로그아웃 버튼이 렌더링되어야 한다', () => {
    render(<UserMenu email="test@example.com" />);
    const emailElem = screen.getByTestId('user-email-display');
    expect(emailElem.textContent).toContain('test@example.com');
    expect(screen.getByTestId('signout-button')).toBeDefined();
  });
});
