import { describe, it, expect } from 'vitest';
import {
  calculateOperationalPriority,
  getPriorityLabel,
  getPriorityDescription,
  analyzeWorkflow,
} from '../features/intelligence/domain/intelligence-priority';
import {
  WorkflowMetrics,
  NodeAnalysis,
  IntelligenceInputWorkflow,
} from '../features/intelligence/domain/intelligence-types';

describe('Operations Intelligence - Priority & Full Analysis', () => {
  describe('calculateOperationalPriority', () => {
    it('returns low for zero nodes or empty metrics', () => {
      const metrics: WorkflowMetrics = {
        totalMinutes: 0,
        totalCost: 0,
        averageMinutes: 0,
        nodeCount: 0,
        missingDurationCount: 0,
        missingCostCount: 0,
      };
      const result = calculateOperationalPriority(metrics, []);
      expect(result.priority).toBe('low');
      expect(result.reasons[0]).toContain('리스크가 없습니다');
    });

    it('returns critical when duration >= 480 or cost >= 10000 or bottlenecks >= 5', () => {
      const longWorkflow: WorkflowMetrics = {
        totalMinutes: 500,
        totalCost: 100,
        averageMinutes: 500,
        nodeCount: 1,
        missingDurationCount: 0,
        missingCostCount: 0,
      };
      expect(calculateOperationalPriority(longWorkflow, []).priority).toBe('critical');

      const expensiveWorkflow: WorkflowMetrics = {
        totalMinutes: 10,
        totalCost: 12000,
        averageMinutes: 10,
        nodeCount: 1,
        missingDurationCount: 0,
        missingCostCount: 0,
      };
      expect(calculateOperationalPriority(expensiveWorkflow, []).priority).toBe('critical');

      const manyBottlenecks: NodeAnalysis[] = Array.from({ length: 5 }).map((_, i) => ({
        nodeId: `n${i}`,
        nodeName: `Node ${i}`,
        isBottleneck: true,
        reasons: ['Slow'],
        priority: 'high',
        durationMinutes: 10,
        costAmount: 10,
        owner: 'Alice',
        tool: 'Git',
        incomingEdgeCount: 0,
        outgoingEdgeCount: 0,
        isMissingDuration: false,
        isMissingCost: false,
        isMissingOwner: false,
        isMissingTool: false,
      }));
      const normalMetrics: WorkflowMetrics = {
        totalMinutes: 20,
        totalCost: 50,
        averageMinutes: 4,
        nodeCount: 5,
        missingDurationCount: 0,
        missingCostCount: 0,
      };
      expect(calculateOperationalPriority(normalMetrics, manyBottlenecks).priority).toBe('critical');
    });

    it('returns high when duration >= 180 or cost >= 3000 or bottlenecks >= 2', () => {
      const highDuration: WorkflowMetrics = {
        totalMinutes: 200,
        totalCost: 500,
        averageMinutes: 100,
        nodeCount: 2,
        missingDurationCount: 0,
        missingCostCount: 0,
      };
      expect(calculateOperationalPriority(highDuration, []).priority).toBe('high');

      const twoBottlenecks: NodeAnalysis[] = [
        {
          nodeId: '1',
          nodeName: 'A',
          isBottleneck: true,
          reasons: ['No owner'],
          priority: 'medium',
          durationMinutes: 10,
          costAmount: 0,
          owner: 'Unassigned',
          tool: 'Git',
          incomingEdgeCount: 0,
          outgoingEdgeCount: 0,
          isMissingDuration: false,
          isMissingCost: false,
          isMissingOwner: true,
          isMissingTool: false,
        },
        {
          nodeId: '2',
          nodeName: 'B',
          isBottleneck: true,
          reasons: ['No tool'],
          priority: 'low',
          durationMinutes: 20,
          costAmount: 0,
          owner: 'Bob',
          tool: 'No tool specified',
          incomingEdgeCount: 0,
          outgoingEdgeCount: 0,
          isMissingDuration: false,
          isMissingCost: false,
          isMissingOwner: false,
          isMissingTool: true,
        },
      ];
      const smallMetrics: WorkflowMetrics = {
        totalMinutes: 30,
        totalCost: 200,
        averageMinutes: 15,
        nodeCount: 2,
        missingDurationCount: 0,
        missingCostCount: 0,
      };
      expect(calculateOperationalPriority(smallMetrics, twoBottlenecks).priority).toBe('high');
    });

    it('returns medium when bottlenecks >= 1 or duration >= 60 or cost >= 1000', () => {
      const oneBottleneck: NodeAnalysis[] = [
        {
          nodeId: '1',
          nodeName: 'A',
          isBottleneck: true,
          reasons: ['No owner'],
          priority: 'medium',
          durationMinutes: 10,
          costAmount: 0,
          owner: 'Unassigned',
          tool: 'Git',
          incomingEdgeCount: 0,
          outgoingEdgeCount: 0,
          isMissingDuration: false,
          isMissingCost: false,
          isMissingOwner: true,
          isMissingTool: false,
        },
      ];
      const smallMetrics: WorkflowMetrics = {
        totalMinutes: 10,
        totalCost: 50,
        averageMinutes: 10,
        nodeCount: 1,
        missingDurationCount: 0,
        missingCostCount: 0,
      };
      expect(calculateOperationalPriority(smallMetrics, oneBottleneck).priority).toBe('medium');

      const mediumDuration: WorkflowMetrics = {
        totalMinutes: 90,
        totalCost: 50,
        averageMinutes: 45,
        nodeCount: 2,
        missingDurationCount: 0,
        missingCostCount: 0,
      };
      expect(calculateOperationalPriority(mediumDuration, []).priority).toBe('medium');
    });

    it('returns low when workflow has no bottlenecks and is below all thresholds', () => {
      const normalMetrics: WorkflowMetrics = {
        totalMinutes: 30,
        totalCost: 200,
        averageMinutes: 15,
        nodeCount: 2,
        missingDurationCount: 0,
        missingCostCount: 0,
      };
      expect(calculateOperationalPriority(normalMetrics, []).priority).toBe('low');
    });
  });

  describe('getPriorityLabel & getPriorityDescription', () => {
    it('returns valid Korean labels and descriptions for all levels', () => {
      expect(getPriorityLabel('critical')).toContain('긴급');
      expect(getPriorityLabel('high')).toContain('높음');
      expect(getPriorityLabel('medium')).toContain('보통');
      expect(getPriorityLabel('low')).toContain('낮음');

      expect(getPriorityDescription('critical')).toContain('즉각적인');
      expect(getPriorityDescription('high')).toContain('단계적 검토');
      expect(getPriorityDescription('medium')).toContain('모니터링');
      expect(getPriorityDescription('low')).toContain('안정적인');
    });
  });

  describe('analyzeWorkflow', () => {
    it('analyzes empty workflow cleanly', () => {
      const workflow: IntelligenceInputWorkflow = {
        id: 'wf-empty',
        name: 'Empty Workflow',
        nodes: [],
        edges: [],
      };

      const analysis = analyzeWorkflow(workflow);
      expect(analysis.workflowId).toBe('wf-empty');
      expect(analysis.metrics.nodeCount).toBe(0);
      expect(analysis.operationalPriority).toBe('low');
      expect(analysis.bottlenecks).toHaveLength(0);
      expect(analysis.ownerLoads).toHaveLength(0);
      expect(analysis.toolUsages).toHaveLength(0);
      expect(analysis.longestNode).toBeNull();
      expect(analysis.mostExpensiveNode).toBeNull();
    });

    it('analyzes complex workflow and aggregates all domains', () => {
      const workflow: IntelligenceInputWorkflow = {
        id: 'wf-complex',
        name: 'Deployment Pipeline',
        nodes: [
          {
            id: 'n1',
            name: 'Build Container',
            durationMinutes: 190, // triggers long_duration (>= 2x of average 110 or >= 30%)
            costAmount: 120000,   // triggers high_cost (>= 100,000)
            owner: 'Ops Team',
            tool: 'Docker',
          },
          {
            id: 'n2',
            name: 'Deploy to Staging',
            durationMinutes: 30,
            costAmount: 100,
            owner: 'Ops Team',
            tool: 'Kubernetes',
          },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2' },
        ],
      };

      const analysis = analyzeWorkflow(workflow);

      expect(analysis.workflowId).toBe('wf-complex');
      expect(analysis.metrics.nodeCount).toBe(2);
      expect(analysis.metrics.totalMinutes).toBe(220);
      expect(analysis.metrics.totalCost).toBe(120100);
      expect(analysis.longestNode?.id).toBe('n1');
      expect(analysis.mostExpensiveNode?.id).toBe('n1');

      // n1 triggers critical because duration and cost both bottleneck
      expect(analysis.bottlenecks.length).toBeGreaterThanOrEqual(1);
      expect(analysis.operationalPriority).toBe('critical');

      // Owner load: Ops Team with 220 min, 120100 cost
      expect(analysis.ownerLoads).toHaveLength(1);
      expect(analysis.ownerLoads[0].ownerName).toBe('Ops Team');
      expect(analysis.ownerLoads[0].totalMinutes).toBe(220);

      // Tool usage: Docker 1, Kubernetes 1
      expect(analysis.toolUsages).toHaveLength(2);
    });
  });
});
