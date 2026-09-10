-- OPS Blueprint V1 Database Migration: Sections, Nodes, Edges with User Isolation & RLS
-- Parent: public.workflows -> public.workspaces -> auth.users

-- 1. sections 테이블
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. nodes 테이블
CREATE TABLE IF NOT EXISTS public.nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  role TEXT,
  tool TEXT,
  duration INTEGER,
  cost NUMERIC,
  notes TEXT,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. edges 테이블
CREATE TABLE IF NOT EXISTS public.edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  source_node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE NOT NULL,
  target_node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. 인덱스 생성 (외래키 및 조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_sections_workflow_id ON public.sections(workflow_id);
CREATE INDEX IF NOT EXISTS idx_nodes_workflow_id ON public.nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_nodes_section_id ON public.nodes(section_id);
CREATE INDEX IF NOT EXISTS idx_edges_workflow_id ON public.edges(workflow_id);
CREATE INDEX IF NOT EXISTS idx_edges_source_target ON public.edges(source_node_id, target_node_id);

-- 5. RLS 활성화
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edges ENABLE ROW LEVEL SECURITY;

-- 6. sections RLS 정책: 소유한 워크스페이스에 속한 워크플로우 하위 섹션만 접근
CREATE POLICY "Users can view sections in own workflows"
  ON public.sections FOR SELECT TO authenticated
  USING (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ));

CREATE POLICY "Users can create sections in own workflows"
  ON public.sections FOR INSERT TO authenticated
  WITH CHECK (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ));

CREATE POLICY "Users can update sections in own workflows"
  ON public.sections FOR UPDATE TO authenticated
  USING (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ))
  WITH CHECK (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ));

CREATE POLICY "Users can delete sections in own workflows"
  ON public.sections FOR DELETE TO authenticated
  USING (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ));

-- 7. nodes RLS 정책: 소유한 워크스페이스에 속한 워크플로우 하위 노드만 접근
CREATE POLICY "Users can view nodes in own workflows"
  ON public.nodes FOR SELECT TO authenticated
  USING (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ));

CREATE POLICY "Users can create nodes in own workflows"
  ON public.nodes FOR INSERT TO authenticated
  WITH CHECK (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ));

CREATE POLICY "Users can update nodes in own workflows"
  ON public.nodes FOR UPDATE TO authenticated
  USING (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ))
  WITH CHECK (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ));

CREATE POLICY "Users can delete nodes in own workflows"
  ON public.nodes FOR DELETE TO authenticated
  USING (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ));

-- 8. edges RLS 정책: 소유한 워크스페이스에 속한 워크플로우 하위 엣지만 접근
CREATE POLICY "Users can view edges in own workflows"
  ON public.edges FOR SELECT TO authenticated
  USING (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ));

CREATE POLICY "Users can create edges in own workflows"
  ON public.edges FOR INSERT TO authenticated
  WITH CHECK (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ));

CREATE POLICY "Users can update edges in own workflows"
  ON public.edges FOR UPDATE TO authenticated
  USING (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ))
  WITH CHECK (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ));

CREATE POLICY "Users can delete edges in own workflows"
  ON public.edges FOR DELETE TO authenticated
  USING (workflow_id IN (
    SELECT w.id FROM public.workflows w
    JOIN public.workspaces ws ON w.workspace_id = ws.id
    WHERE ws.owner_id = (select auth.uid())
  ));
