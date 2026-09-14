import { describe, it, expect } from 'vitest';
import {
  calculateTotalMinutes,
  calculateTotalCost,
  calculateAverageMinutes,
  calculateWorkflowMetrics,
  calculateOwnerLoad,
  calculateToolUsage,
  findLongestNode,
  findMostExpensiveNode,
  extractNodeMinutes,
  extractNodeCost,
} from '../features/intelligence/domain/intelligence-calculations';
import { IntelligenceInputNode } from '../features/intelligence/domain/intelligence-types';

describe('Operations Intelligence - Calculations', () => {
  describe('extractNodeMinutes & extractNodeCost normalization', () => {
    it('prefers durationMinutes / costAmount if present', () => {
      const node: IntelligenceInputNode = {
        id: 'n1',
        name: 'Node 1',
        durationMinutes: 45,
        duration: 20,
        costAmount: 150,
        cost: 50,
      };
      expect(extractNodeMinutes(node)).toBe(45);
      expect(extractNodeCost(node)).toBe(150);
    });

    it('falls back to duration / cost when durationMinutes / costAmount are undefined', () => {
      const node: IntelligenceInputNode = {
        id: 'n2',
        name: 'Node 2',
        duration: 30,
        cost: 80,
      };
      expect(extractNodeMinutes(node)).toBe(30);
      expect(extractNodeCost(node)).toBe(80);
    });

    it('returns 0 for negative, null, undefined or NaN values', () => {
      const node: IntelligenceInputNode = {
        id: 'n3',
        name: 'Node 3',
        durationMinutes: -10,
        costAmount: NaN,
      };
      expect(extractNodeMinutes(node)).toBe(0);
      expect(extractNodeCost(node)).toBe(0);
    });
  });

  describe('calculateTotalMinutes & calculateTotalCost', () => {
    it('returns 0 for empty array', () => {
      expect(calculateTotalMinutes([])).toBe(0);
      expect(calculateTotalCost([])).toBe(0);
    });

    it('sums correctly across mixed node formats', () => {
      const nodes: IntelligenceInputNode[] = [
        { id: '1', name: 'Task A', durationMinutes: 60, costAmount: 100 },
        { id: '2', name: 'Task B', duration: 30, cost: 50 },
        { id: '3', name: 'Task C' }, // undefined
      ];
      expect(calculateTotalMinutes(nodes)).toBe(90);
      expect(calculateTotalCost(nodes)).toBe(150);
    });
  });

  describe('calculateAverageMinutes', () => {
    it('returns 0 when node count is 0', () => {
      expect(calculateAverageMinutes([])).toBe(0);
    });

    it('calculates rounded average correctly', () => {
      const nodes: IntelligenceInputNode[] = [
        { id: '1', name: 'A', durationMinutes: 10 },
        { id: '2', name: 'B', durationMinutes: 20 },
        { id: '3', name: 'C', durationMinutes: 25 },
      ];
      // 55 / 3 = 18.3333 -> round 18.3
      expect(calculateAverageMinutes(nodes)).toBe(18.3);
    });
  });

  describe('calculateWorkflowMetrics', () => {
    it('returns accurate summary object', () => {
      const nodes: IntelligenceInputNode[] = [
        { id: '1', name: 'A', durationMinutes: 100, costAmount: 500 },
        { id: '2', name: 'B', durationMinutes: 50, costAmount: 250 },
      ];
      const metrics = calculateWorkflowMetrics(nodes);
      expect(metrics).toEqual({
        totalMinutes: 150,
        totalCost: 750,
        averageMinutes: 75,
        nodeCount: 2,
        missingDurationCount: 0,
        missingCostCount: 0,
      });
    });
  });

  describe('calculateOwnerLoad', () => {
    it('returns empty array when nodes is empty', () => {
      expect(calculateOwnerLoad([])).toEqual([]);
    });

    it('groups by owner and handles Unassigned properly', () => {
      const nodes: IntelligenceInputNode[] = [
        { id: '1', name: 'A', owner: 'Alice', durationMinutes: 60, costAmount: 100 },
        { id: '2', name: 'B', owner: 'Alice', durationMinutes: 30, costAmount: 50 },
        { id: '3', name: 'C', owner: 'Bob', durationMinutes: 120, costAmount: 200 },
        { id: '4', name: 'D', durationMinutes: 15, costAmount: 0 }, // no owner
        { id: '5', name: 'E', owner: '   ', durationMinutes: 10, costAmount: 0 }, // whitespace owner
      ];

      const load = calculateOwnerLoad(nodes);

      expect(load).toHaveLength(3);
      // Bob has 120 min total
      expect(load[0]).toEqual({
        ownerName: 'Bob',
        stepCount: 1,
        totalMinutes: 120,
        totalCost: 200,
      });
      // Alice has 90 min total
      expect(load[1]).toEqual({
        ownerName: 'Alice',
        stepCount: 2,
        totalMinutes: 90,
        totalCost: 150,
      });
      // Unassigned has 25 min total
      expect(load[2]).toEqual({
        ownerName: 'Unassigned',
        stepCount: 2,
        totalMinutes: 25,
        totalCost: 0,
      });
    });
  });

  describe('calculateToolUsage', () => {
    it('returns empty array when nodes is empty', () => {
      expect(calculateToolUsage([])).toEqual([]);
    });

    it('groups by tool and handles empty tools properly', () => {
      const nodes: IntelligenceInputNode[] = [
        { id: '1', name: 'A', tool: 'GitHub Actions' },
        { id: '2', name: 'B', tool: 'GitHub Actions' },
        { id: '3', name: 'C', tool: 'Docker' },
        { id: '4', name: 'D' }, // no tool
      ];

      const usage = calculateToolUsage(nodes);

      expect(usage).toHaveLength(3);
      // GitHub Actions used twice
      expect(usage[0]).toEqual({
        toolName: 'GitHub Actions',
        usageCount: 2,
      });
      // Docker used once
      expect(usage[1]).toEqual({
        toolName: 'Docker',
        usageCount: 1,
      });
      // No tool specified used once
      expect(usage[2]).toEqual({
        toolName: 'No tool specified',
        usageCount: 1,
      });
    });
  });

  describe('findLongestNode & findMostExpensiveNode', () => {
    it('returns null when nodes is empty', () => {
      expect(findLongestNode([])).toBeNull();
      expect(findMostExpensiveNode([])).toBeNull();
    });

    it('finds the node with highest duration and highest cost', () => {
      const nodes: IntelligenceInputNode[] = [
        { id: '1', name: 'A', durationMinutes: 10, costAmount: 1000 },
        { id: '2', name: 'B', durationMinutes: 500, costAmount: 20 },
        { id: '3', name: 'C', durationMinutes: 100, costAmount: 200 },
      ];

      expect(findLongestNode(nodes)?.id).toBe('2');
      expect(findMostExpensiveNode(nodes)?.id).toBe('1');
    });
  });
});
