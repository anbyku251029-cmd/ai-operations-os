-- OPS Blueprint V1 Database Migration: Workspaces & Workflows with User Isolation & RLS

-- 1. workspaces 테이블
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. workflows 테이블
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflows_workspace_id ON public.workflows(workspace_id);

-- 4. RLS 활성화
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- 5. workspaces RLS 정책: 소유자만 접근 허용
CREATE POLICY "Users can view own workspaces"
  ON public.workspaces FOR SELECT TO authenticated
  USING (owner_id = (select auth.uid()));

CREATE POLICY "Users can create own workspaces"
  ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can update own workspaces"
  ON public.workspaces FOR UPDATE TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can delete own workspaces"
  ON public.workspaces FOR DELETE TO authenticated
  USING (owner_id = (select auth.uid()));

-- 6. workflows RLS 정책: 소유한 워크스페이스에 속한 워크플로우만 접근 허용
CREATE POLICY "Users can view workflows in own workspaces"
  ON public.workflows FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = (select auth.uid())));

CREATE POLICY "Users can create workflows in own workspaces"
  ON public.workflows FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = (select auth.uid())));

CREATE POLICY "Users can update workflows in own workspaces"
  ON public.workflows FOR UPDATE TO authenticated
  USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = (select auth.uid())))
  WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = (select auth.uid())));

CREATE POLICY "Users can delete workflows in own workspaces"
  ON public.workflows FOR DELETE TO authenticated
  USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = (select auth.uid())));
