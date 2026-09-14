import {
  BottleneckItem,
  ImprovementPriorityItem,
  WorkflowAnalysisResult,
  OwnerLoadItem,
} from '../types/intelligence-types';

/**
 * 탐지된 병목 및 부하 분석을 기반으로 운영 개선 우선순위 항목(P1 / P2 / P3)을 산출하는 순수 함수
 */
export function deriveImprovementPriorities(
  workflows: WorkflowAnalysisResult[],
  bottlenecks: BottleneckItem[],
  ownerLoads: OwnerLoadItem[]
): ImprovementPriorityItem[] {
  const priorities: ImprovementPriorityItem[] = [];

  if (!workflows || workflows.length === 0) {
    return [];
  }

  // 1. [P1] 심각 병목 (High Severity: 120분 이상 초과 노드, 다중 유입 병목)
  const highBottlenecks = bottlenecks.filter((b) => b.severity === 'high');
  for (const hb of highBottlenecks) {
    priorities.push({
      id: `priority-p1-${hb.id}`,
      priority: 'P1',
      title: `[핵심 병목] ${hb.nodeName} 처리 절차 간소화`,
      targetWorkflowId: hb.workflowId,
      targetWorkflowName: hb.workflowName,
      description: hb.reason,
      expectedBenefit: `${hb.type === 'duration_overload' ? '프로세스 소요 시간 40% 이상 단축' : '운영 지연 리스크 50% 완화'}`,
    });
  }

  // 2. [P2] 특정 담당자 과부하 개선 권고 (총 소요 시간 180분 이상 또는 4개 이상 단계 집중)
  const overloadedOwners = ownerLoads.filter(
    (o) => o.ownerName !== '담당자 미지정' && (o.totalMinutes >= 180 || o.stepCount >= 4)
  );
  for (const owner of overloadedOwners) {
    const primaryWfId = owner.workflowIds[0] || '';
    const targetWf = workflows.find((w) => w.workflowId === primaryWfId);
    priorities.push({
      id: `priority-p2-owner-${owner.ownerName}`,
      priority: 'P2',
      title: `[부하 분산] ${owner.ownerName}(${owner.role}) 업무 재분장 권장`,
      targetWorkflowId: primaryWfId,
      targetWorkflowName: targetWf ? targetWf.workflowName : '관련 워크플로우',
      description: `총 ${owner.stepCount}개 단계, ${owner.totalMinutes}분의 업무가 집중되어 담당자 부재 시 업무 마비 위험이 있습니다.`,
      expectedBenefit: '팀 내 업무 다변화 및 특정 인원 의존도 위험 완화',
    });
  }

  // 3. [P2] 고비용 워크플로우 비용 효율화
  const highCostWorkflows = workflows.filter((w) => w.totalCost >= 200000);
  for (const wf of highCostWorkflows) {
    priorities.push({
      id: `priority-p2-cost-${wf.workflowId}`,
      priority: 'P2',
      title: `[비용 최적화] ${wf.workflowName} 단계별 비용 절감 검토`,
      targetWorkflowId: wf.workflowId,
      targetWorkflowName: wf.workflowName,
      description: `전체 워크플로우 비용이 ${wf.totalCost.toLocaleString()}원으로 조직 내 최상위 운영비 지출 프로세스입니다.`,
      expectedBenefit: '반복 실행 시 분기별 수백만 원 운영비 절감 효과',
    });
  }

  // 4. [P3] 고립 노드 및 담당자 미지정 정리
  const mediumOrLowBottlenecks = bottlenecks.filter(
    (b) => b.type === 'orphan_node' || b.type === 'unassigned_owner'
  );
  for (const mb of mediumOrLowBottlenecks.slice(0, 5)) {
    priorities.push({
      id: `priority-p3-${mb.id}`,
      priority: 'P3',
      title: `[데이터 정돈] ${mb.nodeName} 담당자 및 연결선 보완`,
      targetWorkflowId: mb.workflowId,
      targetWorkflowName: mb.workflowName,
      description: mb.reason,
      expectedBenefit: '프로세스 가시성 100% 확보 및 신규 참여자 인수인계 용이',
    });
  }

  // 우선순위 정렬 (P1 -> P2 -> P3)
  const priorityRank: Record<string, number> = { P1: 1, P2: 2, P3: 3 };
  return priorities.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
}
