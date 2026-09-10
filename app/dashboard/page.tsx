import { Metadata } from 'next';
import { getWorkflows } from '@/features/workflow/actions/workflow-actions';
import { AppHeader } from '@/components/layout/AppHeader';
import { DashboardView } from '@/features/dashboard/components/DashboardView';

export const metadata: Metadata = {
  title: '대시보드 - AI Operations OS',
};

export default async function DashboardPage() {
  const workflows = await getWorkflows();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppHeader />

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <DashboardView workflows={workflows} />
      </main>
    </div>
  );
}
