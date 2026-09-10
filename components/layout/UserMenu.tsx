'use client';

import React from 'react';
import { signOutAction } from '@/features/auth/actions/auth-actions';
import { Button } from '@/components/ui/button';

interface UserMenuProps {
  email?: string | null;
}

export function UserMenu({ email }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3">
      {email && (
        <span
          data-testid="user-email-display"
          className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md"
        >
          {email}
        </span>
      )}
      <form action={signOutAction}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          data-testid="signout-button"
          className="text-xs text-slate-600 hover:text-red-600 hover:bg-red-50"
        >
          로그아웃
        </Button>
      </form>
    </div>
  );
}
