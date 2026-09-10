'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

/**
 * Editor Error State with Retry Capability
 * Displayed when workflow fetch fails or resource is not found
 */
export function EditorErrorState({
  title = '워크플로우를 불러올 수 없습니다',
  description = '요청하신 워크플로우가 존재하지 않거나 네트워크 오류가 발생했습니다.',
  onRetry,
  isRetrying = false,
}: EditorErrorStateProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4"
      data-testid="editor-error-state"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-md p-8 max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-slate-800" data-testid="error-state-title">
            {title}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed" data-testid="error-state-desc">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          {onRetry && (
            <Button
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full sm:w-auto text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
              data-testid="error-retry-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? '다시 연결 중...' : '다시 시도'}</span>
            </Button>
          )}

          <Link href="/workflows" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs text-slate-600 hover:text-slate-800 gap-1.5"
              data-testid="error-back-list-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>목록으로 이동</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
