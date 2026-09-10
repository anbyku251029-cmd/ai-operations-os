import { Workflow } from '@/types/workflow';
import { EditorNode, EditorEdge } from '@/features/editor/types/editor';
import { EditorSection } from '@/features/editor/types/section';

/**
 * Supabase Database Entity Types for Workflow Editor
 */
export interface DbSection {
  id: string;
  workflow_id: string;
  name: string;
  position: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbNode {
  id: string;
  workflow_id: string;
  section_id?: string | null;
  name: string;
  description?: string | null;
  owner?: string | null;
  role?: string | null;
  tool?: string | null;
  duration?: number | null;
  cost?: number | null;
  notes?: string | null;
  position_x: number;
  position_y: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbEdge {
  id: string;
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  created_at?: string;
}

export interface DbWorkflowBundle {
  workflow: Workflow;
  sections: DbSection[];
  nodes: DbNode[];
  edges: DbEdge[];
}

export interface EditorWorkflowSnapshot {
  workflowId: string;
  sections?: EditorSection[];
  nodes: EditorNode[];
  edges: EditorEdge[];
}

export interface SaveWorkflowResult {
  success: boolean;
  error?: string;
}
