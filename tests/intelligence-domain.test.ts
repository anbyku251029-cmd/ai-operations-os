import { describe, it, expect } from 'vitest';
import {
  safeNumber,
  calculateTotalMinutes,
  calculateTotalCost,
  calculateOwnerLoads,
  calculateToolUsages,
  calculateOverviewMetrics,
} from '@/features/intelligence/domain/intelligence-calculations';
import {
  detectWorkflowBottlenecks,
  detectAllBottlenecks,
  BOTTLENECK_THRESHOLDS,
} from '@/features/intelligence/domain/intelligence-rules';
import { deriveImprovementPriorities } from '@/features/intelligence/domain/intelligence-priority';
import { Workflow } from '@/types/workflow';
import { DbNode, DbEdge } from '@/lib/persistence/workflow-types';
import { WorkflowAnalysisInput } from '@/features/intelligence/types/intelligence-types';

describe('V1.1 Operations Intelligence Domain Tests', () => {
  const mockWorkflow: Workflow = {
    id: 'wf-intel-1',
    name: '신규 입사자 온보딩 프로세스',
    description: '인사/총무 온보딩',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  /* ------------------------------------------------------------------
   * 1. Calculations Unit Tests
   * ------------------------------------------------------------------ */
  describe('Calculations Engine', () => {
    it('safeNumber는 null, undefined, NaN, 음수에 대해 0을 반환해야 한다', () => {
      expect(safeNumber(null)).toBe(0);
      expect(safeNumber(undefined)).toBe(0);
      expect(safeNumber(NaN)).toBe(0);
      expect(safeNumber(-50)).toBe(0);
      expect(safeNumber(120)).toBe(120);
    });

    it('calculateTotalMinutes는 노드 배열의 시간을 정확히 합산하며 빈 배열은 0을 반환한다', () => {
      expect(calculateTotalMinutes([])).toBe(0);

      const nodes: DbNode[] = [
        { id: 'n1', workflow_id: 'wf-1', name: '단계 1', duration: 30, position_x: 0, position_y: 0 },
        { id: 'n2', workflow_id: 'wf-1', name: '단계 2', duration: null, position_x: 0, position_y: 0 },
        { id: 'n3', workflow_id: 'wf-1', name: '단계 3', duration: 45, position_x: 0, position_y: 0 },
      ];
      expect(calculateTotalMinutes(nodes)).toBe(75);
    });

    it('calculateTotalCost는 노드 배열의 비용을 정확히 합산한다', () => {
      expect(calculateTotalCost([])).toBe(0);

      const nodes: DbNode[] = [
        { id: 'n1', workflow_id: 'wf-1', name: '단계 1', cost: 50000, position_x: 0, position_y: 0 },
        { id: 'n2', workflow_id: 'wf-1', name: '단계 2', cost: undefined, position_x: 0, position_y: 0 },
        { id: 'n3', workflow_id: 'wf-1', name: '단계 3', cost: 70000, position_x: 0, position_y: 0 },
      ];
      expect(calculateTotalCost(nodes)).toBe(120000);
    });

    it('calculateOwnerLoads는 담당자별 단계 수, 시간, 비용을 올바르게 그룹화하고 정렬한다', () => {
      const input: WorkflowAnalysisInput = {
        workflow: mockWorkflow,
        nodes: [
          { id: 'n1', workflow_id: 'wf-1', name: '서류 수합', owner: '김인사', role: 'HR', duration: 60, cost: 20000, position_x: 0, position_y: 0 },
          { id: 'n2', workflow_id: 'wf-1', name: '계약서 작성', owner: '김인사', role: 'HR', duration: 90, cost: 30000, position_x: 0, position_y: 0 },
          { id: 'n3', workflow_id: 'wf-1', name: '장비 지급', owner: '이IT', role: 'IT Support', duration: 30, cost: 150000, position_x: 0, position_y: 0 },
        ],
        edges: [],
      };

      const loads = calculateOwnerLoads([input]);
      expect(loads).toHaveLength(2);
      expect(loads[0].ownerName).toBe('김인사');
      expect(loads[0].stepCount).toBe(2);
      expect(loads[0].totalMinutes).toBe(150);
      expect(loads[0].totalCost).toBe(50000);

      expect(loads[1].ownerName).toBe('이IT');
      expect(loads[1].totalCost).toBe(150000);
    });

    it('calculateToolUsages는 도구별 사용 빈도와 연관 담당자를 올바르게 집계한다', () => {
      const input: WorkflowAnalysisInput = {
        workflow: mockWorkflow,
        nodes: [
          { id: 'n1', workflow_id: 'wf-1', name: '1', tool: 'Slack', owner: '김인사', position_x: 0, position_y: 0 },
          { id: 'n2', workflow_id: 'wf-1', name: '2', tool: 'Slack', owner: '박팀장', position_x: 0, position_y: 0 },
          { id: 'n3', workflow_id: 'wf-1', name: '3', tool: 'Jira', owner: '이IT', position_x: 0, position_y: 0 },
        ],
        edges: [],
      };

      const usages = calculateToolUsages([input]);
      expect(usages).toHaveLength(2);
      expect(usages[0].toolName).toBe('Slack');
      expect(usages[0].usageCount).toBe(2);
      expect(usages[0].associatedOwners).toContain('김인사');
      expect(usages[0].associatedOwners).toContain('박팀장');
    });
  });

  /* ------------------------------------------------------------------
   * 2. Bottleneck Detection Rules Tests
   * ------------------------------------------------------------------ */
  describe('Bottleneck Detection Rules', () => {
    it('120분 이상 소요 단계는 High 심각도의 duration_overload 병목으로 탐지된다', () => {
      const input: WorkflowAnalysisInput = {
        workflow: mockWorkflow,
        nodes: [
          { id: 'n-slow', workflow_id: mockWorkflow.id, name: '심각 지연 단계', duration: 150, position_x: 0, position_y: 0 },
        ],
        edges: [],
      };

      const bottlenecks = detectWorkflowBottlenecks(input);
      const overload = bottlenecks.find((b) => b.type === 'duration_overload');
      expect(overload).toBeDefined();
      expect(overload?.severity).toBe('high');
      expect(overload?.metricValue).toBe(150);
      expect(overload?.reason).toContain('120분');
    });

    it('10만원 이상 비용 단계는 High 심각도의 cost_overload 병목으로 탐지된다', () => {
      const input: WorkflowAnalysisInput = {
        workflow: mockWorkflow,
        nodes: [
          { id: 'n-expensive', workflow_id: mockWorkflow.id, name: '고비용 외주 단계', cost: 120000, position_x: 0, position_y: 0 },
        ],
        edges: [],
      };

      const bottlenecks = detectWorkflowBottlenecks(input);
      const costIssue = bottlenecks.find((b) => b.type === 'cost_overload');
      expect(costIssue).toBeDefined();
      expect(costIssue?.severity).toBe('high');
      expect(costIssue?.metricValue).toBe(120000);
    });

    it('2개 이상의 노드가 있을 때 연결 엣지가 없는 노드는 orphan_node로 탐지된다', () => {
      const input: WorkflowAnalysisInput = {
        workflow: mockWorkflow,
        nodes: [
          { id: 'n1', workflow_id: mockWorkflow.id, name: '단계 1', position_x: 0, position_y: 0 },
          { id: 'n2', workflow_id: mockWorkflow.id, name: '단계 2', position_x: 100, position_y: 0 },
          { id: 'n-orphan', workflow_id: mockWorkflow.id, name: '고립된 단계', position_x: 200, position_y: 0 },
        ],
        edges: [
          { id: 'e1', workflow_id: mockWorkflow.id, source_node_id: 'n1', target_node_id: 'n2' },
        ],
      };

      const bottlenecks = detectWorkflowBottlenecks(input);
      const orphan = bottlenecks.find((b) => b.type === 'orphan_node');
      expect(orphan).toBeDefined();
      expect(orphan?.nodeId).toBe('n-orphan');
    });

    it('3개 이상의 선행 엣지가 유입되는 노드는 high_fan_in 병목으로 탐지된다', () => {
      const input: WorkflowAnalysisInput = {
        workflow: mockWorkflow,
        nodes: [
          { id: 'n1', workflow_id: mockWorkflow.id, name: '1', position_x: 0, position_y: 0 },
          { id: 'n2', workflow_id: mockWorkflow.id, name: '2', position_x: 0, position_y: 0 },
          { id: 'n3', workflow_id: mockWorkflow.id, name: '3', position_x: 0, position_y: 0 },
          { id: 'n-converge', workflow_id: mockWorkflow.id, name: '병합 승인', position_x: 100, position_y: 0 },
        ],
        edges: [
          { id: 'e1', workflow_id: mockWorkflow.id, source_node_id: 'n1', target_node_id: 'n-converge' },
          { id: 'e2', workflow_id: mockWorkflow.id, source_node_id: 'n2', target_node_id: 'n-converge' },
          { id: 'e3', workflow_id: mockWorkflow.id, source_node_id: 'n3', target_node_id: 'n-converge' },
        ],
      };

      const bottlenecks = detectWorkflowBottlenecks(input);
      const fanIn = bottlenecks.find((b) => b.type === 'high_fan_in');
      expect(fanIn).toBeDefined();
      expect(fanIn?.nodeId).toBe('n-converge');
    });

    it('담당자가 지정되지 않은 노드는 unassigned_owner로 탐지된다', () => {
      const input: WorkflowAnalysisInput = {
        workflow: mockWorkflow,
        nodes: [
          { id: 'n-no-owner', workflow_id: mockWorkflow.id, name: '담당자 없는 단계', owner: '', position_x: 0, position_y: 0 },
        ],
        edges: [],
      };

      const bottlenecks = detectWorkflowBottlenecks(input);
      const unassigned = bottlenecks.find((b) => b.type === 'unassigned_owner');
      expect(unassigned).toBeDefined();
    });
  });

  /* ------------------------------------------------------------------
   * 3. Priority Derivation Tests
   * ------------------------------------------------------------------ */
  describe('Priority Classification', () => {
    it('High 병목은 P1 우선순위로, 담당자 과부하는 P2로 분류되어야 한다', () => {
      const input: WorkflowAnalysisInput = {
        workflow: mockWorkflow,
        nodes: [
          { id: 'n1', workflow_id: mockWorkflow.id, name: '핵심 지연', duration: 180, owner: '김과장', role: '리드', position_x: 0, position_y: 0 },
        ],
        edges: [],
      };

      const bottlenecks = detectWorkflowBottlenecks(input);
      const ownerLoads = calculateOwnerLoads([input]);
      const workflowResult = {
        workflowId: mockWorkflow.id,
        workflowName: mockWorkflow.name,
        updatedAt: mockWorkflow.updated_at,
        totalNodes: 1,
        totalEdges: 0,
        totalMinutes: 180,
        totalCost: 0,
        bottlenecks,
        ownerCount: 1,
        toolCount: 1,
      };

      const priorities = deriveImprovementPriorities([workflowResult], bottlenecks, ownerLoads);

      expect(priorities.length).toBeGreaterThan(0);
      expect(priorities[0].priority).toBe('P1');
      expect(priorities[0].title).toContain('핵심 병목');
    });
  });
});
