import { describe, it, expect } from 'vitest';
import {
  detectLongDurationBottleneck,
  detectHighCostBottleneck,
  detectMissingOwner,
  detectMissingTool,
  detectMissingMetrics,
  detectHighConnectionConcentration,
  analyzeNodeBottlenecks,
  detectBottlenecks,
} from '../features/intelligence/domain/intelligence-rules';
import {
  IntelligenceInputNode,
  IntelligenceInputEdge,
  IntelligenceInputWorkflow,
} from '../features/intelligence/domain/intelligence-types';

describe('Operations Intelligence - Rules', () => {
  describe('Individual Rule Detection', () => {
    it('detectLongDurationBottleneck flags nodes exceeding threshold', () => {
      const fastNode: IntelligenceInputNode = { id: '1', name: 'Fast', durationMinutes: 60 };
      const slowNode: IntelligenceInputNode = { id: '2', name: 'Slow', durationMinutes: 180 };

      // fastNode: average 60, total 300 -> 60 < 120 (2x) and 60/300 = 20% (< 30%)
      const fastResult = detectLongDurationBottleneck(fastNode, 60, 300);
      expect(fastResult.isBottleneck).toBe(false);
      expect(fastResult.reasons).toHaveLength(0);

      // slowNode: average 60, total 300 -> 180 >= 120 (3x), 180/300 = 60% (>= 30%)
      const slowResult = detectLongDurationBottleneck(slowNode, 60, 300);
      expect(slowResult.isBottleneck).toBe(true);
      expect(slowResult.reasons.length).toBeGreaterThan(0);
      expect(slowResult.reasons[0]).toContain('3.0배');
    });

    it('detectHighCostBottleneck flags nodes exceeding cost threshold', () => {
      const cheapNode: IntelligenceInputNode = { id: '1', name: 'Cheap', costAmount: 500 };
      const expensiveNode: IntelligenceInputNode = { id: '2', name: 'Expensive', costAmount: 1500 };

      // cheapNode: total 3000 -> 500 < 100,000 and 500/3000 = 16.7% (< 35%)
      const cheapResult = detectHighCostBottleneck(cheapNode, 3000);
      expect(cheapResult.isBottleneck).toBe(false);
      expect(cheapResult.reasons).toHaveLength(0);

      // expensiveNode: total 3000 -> 1500/3000 = 50% (>= 35%)
      const expensiveResult = detectHighCostBottleneck(expensiveNode, 3000);
      expect(expensiveResult.isBottleneck).toBe(true);
      expect(expensiveResult.reasons.length).toBeGreaterThan(0);
      expect(expensiveResult.reasons[0]).toContain('50%');
    });

    it('detectMissingOwner flags nodes without owner or whitespace only', () => {
      const validNode: IntelligenceInputNode = { id: '1', name: 'Valid', owner: 'DevOps' };
      const emptyNode: IntelligenceInputNode = { id: '2', name: 'Empty' };
      const whitespaceNode: IntelligenceInputNode = { id: '3', name: 'Space', owner: '   ' };

      expect(detectMissingOwner(validNode).isBottleneck).toBe(false);
      expect(detectMissingOwner(emptyNode).isBottleneck).toBe(true);
      expect(detectMissingOwner(whitespaceNode).isBottleneck).toBe(true);
    });

    it('detectMissingTool flags nodes without tool or whitespace only', () => {
      const validNode: IntelligenceInputNode = { id: '1', name: 'Valid', tool: 'Kubernetes' };
      const emptyNode: IntelligenceInputNode = { id: '2', name: 'Empty' };
      const whitespaceNode: IntelligenceInputNode = { id: '3', name: 'Space', tool: '   ' };

      expect(detectMissingTool(validNode).isBottleneck).toBe(false);
      expect(detectMissingTool(emptyNode).isBottleneck).toBe(true);
      expect(detectMissingTool(whitespaceNode).isBottleneck).toBe(true);
    });

    it('detectMissingMetrics flags nodes missing both duration and cost', () => {
      const withBoth: IntelligenceInputNode = { id: '1', name: 'A', durationMinutes: 10, costAmount: 20 };
      const withDuration: IntelligenceInputNode = { id: '2', name: 'B', durationMinutes: 10 };
      const withCost: IntelligenceInputNode = { id: '3', name: 'C', costAmount: 20 };
      const missingAll: IntelligenceInputNode = { id: '4', name: 'D' };

      expect(detectMissingMetrics(withBoth).isBottleneck).toBe(false);
      expect(detectMissingMetrics(withDuration).isBottleneck).toBe(true); // cost is missing
      expect(detectMissingMetrics(withCost).isBottleneck).toBe(true); // duration is missing
      expect(detectMissingMetrics(missingAll).isBottleneck).toBe(true);
    });

    it('detectHighConnectionConcentration flags hub nodes with many connections', () => {
      const hubNodeId = 'hub';
      const edges: IntelligenceInputEdge[] = [
        { id: 'e1', source: 'a', target: hubNodeId },
        { id: 'e2', source: 'b', target: hubNodeId },
        { id: 'e3', source: 'c', target: hubNodeId },
      ];

      const detected = detectHighConnectionConcentration(hubNodeId, edges);
      expect(detected.isBottleneck).toBe(true);
      expect(detected.measuredValue).toBe(3);
      expect(detected.reasons[0]).toContain('3개의 선행 단계');
    });
  });

  describe('analyzeNodeBottlenecks & detectBottlenecks', () => {
    it('aggregates multiple bottlenecks on a single node', () => {
      const problematicNode: IntelligenceInputNode = {
        id: 'bad',
        name: 'Problematic Task',
        durationMinutes: 300,
        costAmount: 150000,
        // missing owner, missing tool
      };

      const analysis = analyzeNodeBottlenecks(
        problematicNode,
        [problematicNode],
        [],
        300,
        150000,
        300
      );

      expect(analysis.isBottleneck).toBe(true);
      expect(analysis.reasons.length).toBeGreaterThanOrEqual(3);
      expect(analysis.isMissingOwner).toBe(true);
      expect(analysis.isMissingTool).toBe(true);
      expect(analysis.priority).toBe('critical');
    });

    it('detectBottlenecks extracts unique bottlenecks for the entire workflow', () => {
      const workflow: IntelligenceInputWorkflow = {
        id: 'wf-1',
        name: 'Test Workflow',
        nodes: [
          { id: 'n1', name: 'Node 1', durationMinutes: 180, owner: 'Alice', tool: 'Git' },
          { id: 'n2', name: 'Node 2', durationMinutes: 20, costAmount: 120000, owner: 'Bob', tool: 'CI' },
          { id: 'n3', name: 'Node 3', durationMinutes: 20, costAmount: 100, owner: 'Charlie', tool: 'IDE' },
        ],
        edges: [],
      };

      const bottlenecks = detectBottlenecks(workflow);
      expect(bottlenecks.length).toBeGreaterThanOrEqual(2);
      expect(bottlenecks.some((b) => b.nodeId === 'n1')).toBe(true);
      expect(bottlenecks.some((b) => b.nodeId === 'n2')).toBe(true);
    });
  });
});
