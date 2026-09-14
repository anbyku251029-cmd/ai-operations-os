import { describe, it, expect, vi } from 'vitest';
import {
  analyzeWorkflows,
  getOperationsIntelligenceAnalysis,
} from '@/features/intelligence/services/intelligence-service';
import * as repository from '@/features/intelligence/services/intelligence-repository';
import { WorkflowAnalysisInput } from '@/features/intelligence/types/intelligence-types';
import { Workflow } from '@/types/workflow';

describe('V1.1 Operations Intelligence Service Tests', () => {
  const mockWf: Workflow = {
    id: 'wf-serv-1',
    name: '서비스 검증 워크플로우',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('빈 입력 목록이 전달되면 모든 메트릭이 0인 안전한 빈 분석 번들을 반환한다', () => {
    const bundle = analyzeWorkflows([]);
    expect(bundle.overview.totalWorkflows).toBe(0);
    expect(bundle.overview.totalTimeMinutes).toBe(0);
    expect(bundle.overview.totalCostAmount).toBe(0);
    expect(bundle.overview.bottleneckCount).toBe(0);
    expect(bundle.workflows).toHaveLength(0);
    expect(bundle.bottlenecks).toHaveLength(0);
    expect(bundle.priorities).toHaveLength(0);
  });

  it('워크플로우 입력 데이터를 기반으로 정확한 번들을 조립한다', () => {
    const inputs: WorkflowAnalysisInput[] = [
      {
        workflow: mockWf,
        nodes: [
          {
            id: 'n1',
            workflow_id: mockWf.id,
            name: '검토 단계',
            duration: 130, // High 병목
            cost: 80000,
            owner: '홍길동',
            role: '매니저',
            tool: 'Slack',
            position_x: 0,
            position_y: 0,
          },
          {
            id: 'n2',
            workflow_id: mockWf.id,
            name: '승인 단계',
            duration: 30,
            cost: 20000,
            owner: '홍길동',
            role: '매니저',
            tool: 'DocuSign',
            position_x: 100,
            position_y: 0,
          },
        ],
        edges: [
          { id: 'e1', workflow_id: mockWf.id, source_node_id: 'n1', target_node_id: 'n2' },
        ],
      },
    ];

    const bundle = analyzeWorkflows(inputs);
    expect(bundle.overview.totalWorkflows).toBe(1);
    expect(bundle.overview.totalTimeMinutes).toBe(160);
    expect(bundle.overview.totalCostAmount).toBe(100000);
    expect(bundle.overview.totalNodes).toBe(2);
    expect(bundle.workflows[0].ownerCount).toBe(1);
    expect(bundle.workflows[0].toolCount).toBe(2);
    expect(bundle.bottlenecks.some((b) => b.type === 'duration_overload')).toBe(true);
    expect(bundle.ownerLoads[0].ownerName).toBe('홍길동');
    expect(bundle.toolUsages).toHaveLength(2);
  });

  it('getOperationsIntelligenceAnalysis는 저장소에서 데이터를 수집하여 분석 결과를 반환한다', async () => {
    const mockInputs: WorkflowAnalysisInput[] = [
      {
        workflow: mockWf,
        nodes: [],
        edges: [],
      },
    ];

    const spy = vi
      .spyOn(repository, 'fetchAllWorkflowAnalysisInputs')
      .mockResolvedValueOnce(mockInputs);

    const bundle = await getOperationsIntelligenceAnalysis();
    expect(spy).toHaveBeenCalled();
    expect(bundle.overview.totalWorkflows).toBe(1);

    spy.mockRestore();
  });
});
