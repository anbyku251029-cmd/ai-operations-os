'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { createWorkflowAction, WorkflowActionResult } from '../actions/workflow-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export function CreateWorkflowForm() {
  const [state, formAction, isPending] = useActionState<WorkflowActionResult | null, FormData>(
    createWorkflowAction,
    null
  );

  return (
    <Card className="w-full max-w-lg mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">새 워크플로우 생성</CardTitle>
        <CardDescription>
          조직의 업무 프로세스를 설계할 새로운 워크플로우 정보를 입력하세요.
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div
              data-testid="create-workflow-error"
              className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md"
            >
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-medium text-slate-700">
              워크플로우 이름 <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              name="name"
              placeholder="예: 신규 직원 온보딩, 고객 민원 대응"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-medium text-slate-700">
              설명 (선택)
            </label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="이 워크플로우의 목적과 대상 업무를 간략히 설명하세요."
              disabled={isPending}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t pt-4">
          <Link href="/workflows">
            <Button type="button" variant="outline" disabled={isPending}>
              취소
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? '생성 중...' : '워크플로우 생성'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
