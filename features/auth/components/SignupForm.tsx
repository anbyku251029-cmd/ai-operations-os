'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { signupAction, AuthActionResult } from '../actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    signupAction,
    null
  );

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
        <CardDescription>
          새로운 OPS Blueprint 계정을 생성하세요.
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div
              data-testid="signup-error-message"
              className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md"
            >
              {state.error}
            </div>
          )}

          {state?.success && state?.message && (
            <div
              data-testid="signup-success-message"
              className="p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md"
            >
              {state.message}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-slate-700">
              이메일
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              disabled={isPending}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-slate-700">
              비밀번호 (최소 6자 이상)
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-medium text-slate-700">
              비밀번호 확인
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
              autoComplete="new-password"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isPending}
          >
            {isPending ? '계정 생성 중...' : '회원가입 완료'}
          </Button>

          <p className="text-xs text-center text-slate-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              로그인
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
