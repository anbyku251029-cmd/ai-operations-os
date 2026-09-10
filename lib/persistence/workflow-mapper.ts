import { MarkerType } from '@xyflow/react';
import { EditorNode, EditorEdge } from '@/features/editor/types/editor';
import { EditorSection } from '@/features/editor/types/section';
import { DbSection, DbNode, DbEdge, EditorWorkflowSnapshot } from './workflow-types';

/**
 * [LOCK 04] DB ↔ Editor Mapper Layer
 * Supabase Row와 React Flow Editor 상태 사이의 명시적 양방향 변환을 수행한다.
 */

export function mapDbSectionsToEditor(dbSections: DbSection[]): EditorSection[] {
  return dbSections.map((sec) => ({
    id: sec.id,
    name: sec.name,
    position: sec.position,
    isCollapsed: false,
  }));
}

export function mapEditorToDbSections(
  workflowId: string,
  editorSections: EditorSection[]
): DbSection[] {
  return editorSections.map((sec, idx) => ({
    id: sec.id,
    workflow_id: workflowId,
    name: sec.name || `섹션 ${idx + 1}`,
    position: sec.position ?? idx,
  }));
}

export function mapDbNodesToEditor(dbNodes: DbNode[]): EditorNode[] {
  return dbNodes.map((dbNode) => ({
    id: dbNode.id,
    type: 'workflowNode',
    position: {
      x: dbNode.position_x ?? 0,
      y: dbNode.position_y ?? 0,
    },
    data: {
      workflowNodeId: dbNode.id,
      sectionId: dbNode.section_id || undefined,
      name: dbNode.name,
      owner: dbNode.owner || undefined,
      role: dbNode.role || undefined,
      tool: dbNode.tool || undefined,
      description: dbNode.description || undefined,
      durationMinutes: dbNode.duration ?? null,
      costAmount: dbNode.cost != null ? Number(dbNode.cost) : null,
      notes: dbNode.notes || undefined,
    },
    selected: false,
  }));
}

export function mapDbEdgesToEditor(dbEdges: DbEdge[]): EditorEdge[] {
  return dbEdges.map((dbEdge) => ({
    id: dbEdge.id,
    source: dbEdge.source_node_id,
    target: dbEdge.target_node_id,
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: '#64748b',
    },
    style: {
      stroke: '#64748b',
      strokeWidth: 2,
    },
    selected: false,
  }));
}

export function mapEditorToDbNodes(
  workflowId: string,
  editorNodes: EditorNode[],
  defaultSectionId?: string | null,
  validSectionIds?: Set<string>
): DbNode[] {
  return editorNodes.map((node) => {
    let resolvedSectionId = (node.data.sectionId as string) || defaultSectionId || null;
    if (validSectionIds && resolvedSectionId && !validSectionIds.has(resolvedSectionId)) {
      resolvedSectionId = defaultSectionId || null;
    }

    return {
      id: node.id,
      workflow_id: workflowId,
      section_id: resolvedSectionId,
      name: node.data.name || '새 단계',
      description: node.data.description || null,
      owner: node.data.owner || null,
      role: node.data.role || null,
      tool: node.data.tool || null,
      duration:
        node.data.durationMinutes !== undefined && node.data.durationMinutes !== null
          ? Math.round(Number(node.data.durationMinutes))
          : null,
      cost:
        node.data.costAmount !== undefined && node.data.costAmount !== null
          ? Number(node.data.costAmount)
          : null,
      notes: node.data.notes || null,
      position_x: node.position.x,
      position_y: node.position.y,
    };
  });
}

export function mapEditorToDbEdges(
  workflowId: string,
  editorEdges: EditorEdge[],
  validNodeIds?: Set<string>
): DbEdge[] {
  return editorEdges
    .filter((edge) => {
      if (!validNodeIds) return true;
      return validNodeIds.has(edge.source) && validNodeIds.has(edge.target);
    })
    .map((edge) => ({
      id: edge.id,
      workflow_id: workflowId,
      source_node_id: edge.source,
      target_node_id: edge.target,
    }));
}

export function mapSnapshotToDbPayload(snapshot: EditorWorkflowSnapshot): {
  sections: DbSection[];
  nodes: DbNode[];
  edges: DbEdge[];
} {
  const sections = mapEditorToDbSections(snapshot.workflowId, snapshot.sections || []);
  const validSectionIds = new Set(sections.map((s) => s.id));
  const fallbackSectionId = sections[0]?.id || null;

  const validNodeIds = new Set(snapshot.nodes.map((n) => n.id));

  const nodes = mapEditorToDbNodes(
    snapshot.workflowId,
    snapshot.nodes,
    fallbackSectionId,
    validSectionIds
  );

  const edges = mapEditorToDbEdges(snapshot.workflowId, snapshot.edges, validNodeIds);

  return { sections, nodes, edges };
}
