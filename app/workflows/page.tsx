import { Metadata } from 'next';
import { getWorkflows } from '@/features/workflow/actions/workflow-actions';
import { WorkflowList } from '@/features/workflow/components/WorkflowList';
import { AppHeader } from '@/components/layout/AppHeader';

export const metadata: Metadata = {
  title: '워크플로우 목록 - AI Operations OS',
  description: '조직의 전체 Visual Workflow 프로세스를 관리하세요.',
};

export default async function WorkflowsPage() {
  const workflows = await getWorkflows();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppHeader />

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">워크플로우 관리</h1>
          <p className="text-sm text-slate-500">
            조직의 표준 운영 프로세스를 시각화하고 관리하는 작업 공간입니다.
          </p>
        </div>

        <WorkflowList initialWorkflows={workflows} />
      </main>
    </div>
  );
}
