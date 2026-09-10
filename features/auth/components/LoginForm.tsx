'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { loginAction, AuthActionResult } from '../actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    loginAction,
    null
  );

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">로그인</CardTitle>
        <CardDescription>
          OPS Blueprint 계정의 이메일과 비밀번호를 입력해 주세요.
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div
              data-testid="login-error-message"
              className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md"
            >
              {state.error}
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
              비밀번호
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
              autoComplete="current-password"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isPending}
          >
            {isPending ? '로그인 중...' : '로그인'}
          </Button>

          <p className="text-xs text-center text-slate-500">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
              회원가입
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
