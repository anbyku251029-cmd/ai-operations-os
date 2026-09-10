import { Metadata } from 'next';
import { CreateWorkflowForm } from '@/features/workflow/components/CreateWorkflowForm';
import { AppHeader } from '@/components/layout/AppHeader';

export const metadata: Metadata = {
  title: '새 워크플로우 생성 - AI Operations OS',
};

export default function NewWorkflowPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppHeader />

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full flex items-center justify-center">
        <CreateWorkflowForm />
      </main>
    </div>
  );
}
