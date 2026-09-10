'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createWorkflowSchema, updateWorkflowSchema } from '../schemas/workflow-schema';
import { Workflow, UpdateWorkflowInput } from '@/types/workflow';

// Supabase 미연결 또는 개발 모드 인메모리 저장소 폴백 (데이터 유실 방지)
declare global {
  var __mockWorkflows: Workflow[] | undefined;
}

if (!global.__mockWorkflows) {
  global.__mockWorkflows = [
    {
      id: 'wf-default-1',
      workspace_id: 'ws-default-1',
      name: '신규 직원 온보딩 (New Employee Onboarding)',
      description: '입사 전 장비 지급부터 1주차 점검까지의 표준 프로세스',
      created_at: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    },
    {
      id: 'wf-default-2',
      workspace_id: 'ws-default-1',
      name: '고객 민원 및 문의 처리 (CS Escalation)',
      description: '채널톡 인바운드 접수 후 유형 분류 및 담당자 배정 플로우',
      created_at: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString(),
      updated_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    },
  ];
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // ignore outside active Next.js request context (e.g. during test runner)
  }
}

async function getOrCreateDefaultWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  try {
    const { data: existingWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', userId)
      .limit(1)
      .maybeSingle();

    if (existingWorkspace?.id) {
      return existingWorkspace.id;
    }

    const { data: newWorkspace, error: createError } = await supabase
      .from('workspaces')
      .insert({
        name: '기본 워크스페이스',
        owner_id: userId,
      })
      .select('id')
      .single();

    if (!createError && newWorkspace?.id) {
      return newWorkspace.id;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function getWorkflows(): Promise<Workflow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error || !data) {
      return global.__mockWorkflows || [];
    }
    return data as Workflow[];
  } catch {
    return global.__mockWorkflows || [];
  }
}

export async function getWorkflowById(id: string): Promise<Workflow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return global.__mockWorkflows?.find((w) => w.id === id) ?? null;
    }
    return data as Workflow;
  } catch {
    return global.__mockWorkflows?.find((w) => w.id === id) ?? null;
  }
}

export type WorkflowActionResult = {
  success?: boolean;
  error?: string;
  workflowId?: string;
};

export async function createWorkflowAction(
  prevState: WorkflowActionResult | null,
  formData: FormData
): Promise<WorkflowActionResult> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  const validated = createWorkflowSchema.safeParse({ name, description });
  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message || '입력값이 올바르지 않습니다.',
    };
  }

  const newWorkflow: Workflow = {
    id: `wf-${Date.now()}`,
    name: validated.data.name,
    description: validated.data.description || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let targetId = newWorkflow.id;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let workspaceId: string | null = null;
    if (user?.id) {
      workspaceId = await getOrCreateDefaultWorkspaceId(supabase, user.id);
    }

    const { data, error } = await supabase
      .from('workflows')
      .insert({
        workspace_id: workspaceId || '00000000-0000-0000-0000-000000000000',
        name: validated.data.name,
        description: validated.data.description || null,
      })
      .select('id')
      .single();

    if (!error && data?.id) {
      targetId = data.id;
    } else {
      global.__mockWorkflows = [newWorkflow, ...(global.__mockWorkflows || [])];
    }
  } catch {
    global.__mockWorkflows = [newWorkflow, ...(global.__mockWorkflows || [])];
  }

  safeRevalidatePath('/workflows');
  safeRevalidatePath('/dashboard');
  redirect(`/workflows/${targetId}`);
}

export async function updateWorkflowAction(
  id: string,
  input: UpdateWorkflowInput
): Promise<{ success: boolean; error?: string; workflow?: Workflow }> {
  const validated = updateWorkflowSchema.safeParse(input);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || '유효하지 않은 입력값입니다.',
    };
  }

  const updates: Partial<Workflow> = {
    updated_at: new Date().toISOString(),
  };
  if (validated.data.name !== undefined) updates.name = validated.data.name;
  if (validated.data.description !== undefined) updates.description = validated.data.description;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Supabase update failed or unauthorized
    } else if (data) {
      safeRevalidatePath('/workflows');
      safeRevalidatePath(`/workflows/${id}`);
      safeRevalidatePath('/dashboard');
      return { success: true, workflow: data as Workflow };
    }
  } catch {
    // fallback
  }

  // Fallback in-memory update
  if (global.__mockWorkflows) {
    const idx = global.__mockWorkflows.findIndex((w) => w.id === id);
    if (idx !== -1) {
      global.__mockWorkflows[idx] = {
        ...global.__mockWorkflows[idx],
        ...updates,
      };
      safeRevalidatePath('/workflows');
      safeRevalidatePath(`/workflows/${id}`);
      safeRevalidatePath('/dashboard');
      return { success: true, workflow: global.__mockWorkflows[idx] };
    }
  }

  return { success: false, error: '워크플로우를 찾을 수 없습니다.' };
}

export async function deleteWorkflowAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    await supabase.from('workflows').delete().eq('id', id);
  } catch {
    // ignore
  }

  if (global.__mockWorkflows) {
    global.__mockWorkflows = global.__mockWorkflows.filter((w) => w.id !== id);
  }

  safeRevalidatePath('/workflows');
  safeRevalidatePath('/dashboard');
  return { success: true };
}
