import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { UserMenu } from '@/components/layout/UserMenu';

export async function AppHeader() {
  let userEmail: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    userEmail = 'user@example.com';
  }

  return (
    <header className="h-14 border-b bg-white px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <span>OPS Blueprint</span>
          <span className="text-[11px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
            V1
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link
            href="/dashboard"
            className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
          >
            대시보드
          </Link>
          <Link
            href="/workflows"
            className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
          >
            워크플로우
          </Link>
        </nav>
      </div>

      <UserMenu email={userEmail} />
    </header>
  );
}
