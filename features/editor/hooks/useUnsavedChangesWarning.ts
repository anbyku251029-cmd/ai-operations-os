'use client';

import { useEffect } from 'react';

/**
 * [LOCK 01 & 02] Hook to warn user before leaving page when there are unsaved changes
 * Protects against accidental browser close, tab close, or page reload
 */
export function useUnsavedChangesWarning(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // 브라우저 표준: returnValue를 빈 문자열로 설정하여 네이티브 확인 대화상자 트리거
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled]);
}
