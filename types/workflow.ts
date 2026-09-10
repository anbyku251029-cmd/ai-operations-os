export interface Workspace {
  id: string;
  name: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  workspace_id?: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
}
