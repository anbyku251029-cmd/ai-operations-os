# OPS Blueprint — Phase 22 V1.1 Operations Intelligence Implementation Plan

> **작성 일시**: 2026년 9월 14일  
> **프로젝트**: `AI Operations OS — OPS Blueprint`  
> **기준 릴리스**: `v1.0.1` (Commit: `d50e144`)  
> **목표 릴리스**: `v1.1.0` (Operations Intelligence MVP)  
> **원칙 준수**: ADLO Human-Controlled Development (Step 1 점검 및 Step 2 제안 — 코드 수정 전 승인 대기)

---

## 1. Step 1 — Inspection Report (현황 점검 결과)

### 1.1 Git 및 저장소 상태
* **Current Commit**: `d50e144` (`fix(stability): resolve vitest worker timeout, editor store reset, and silent persistence fallback`)
* **Current Branch**: `master` (원격 `origin/master`와 완벽히 일치, Clean Working Tree)
* **릴리스 태그**: `v1.0.1` 태그가 GitHub 원격에 정상 등록됨

### 1.2 기존 디렉터리 및 아키텍처 구조
* **App Router 라우트**: `app/dashboard`, `app/workflows`, `app/workflows/[workflowId]`, `app/login`, `app/signup`
* **영속성 인터페이스 (`lib/persistence/workflow-types.ts`)**:
  * `DbWorkflowBundle`: `workflow`, `sections`, `nodes`, `edges`
  * `DbNode`: `name`, `owner`, `role`, `tool`, `duration` (number|null), `cost` (number|null), `notes`, `position_x`, `position_y`
* **에디터 노드 데이터 계약 (`features/editor/types/editor.ts`)**:
  * `WorkflowNodeData`: `workflowNodeId`, `name`, `owner`, `role`, `tool`, `durationMinutes`, `costAmount`, `sectionId`, `notes`
* **기존 데이터 접근 계층**:
  * `getWorkflows()` (`features/workflow/actions/workflow-actions.ts`): 사용자의 전체 워크플로우 목록 조회
  * `loadWorkflowBundle(workflowId)` (`lib/persistence/workflow-repository.ts`): 워크플로우 상세 번들(노드, 엣지, 섹션) 조회 (Read-Only 활용 가능)
* **인증 및 라우트 보호 구조**:
  * `app/dashboard` 및 `app/workflows`는 서버 컴포넌트 레벨에서 `createClient()`를 통해 세션을 확인하며 미인증 시 리다이렉트 처리됨.

---

## 2. Step 2 — Proposal (V1.1 Operations Intelligence 구현 계획)

### 2.1 생성 대상 파일 목록 (Approved Initial File Boundary 100% 준수)

기존 코드를 일체 오염시키지 않기 위해, 신규 파일은 사전에 승인된 경계 내에만 생성합니다:

#### [Domain Layer (순수 함수 — 외부 의존성 0%)]
1. `features/intelligence/types/intelligence-types.ts`: 운영 분석 데이터 타입 계약
2. `features/intelligence/domain/intelligence-calculations.ts`: 소요시간, 비용, 담당자 부하, 도구 통계 순수 계산 엔진
3. `features/intelligence/domain/intelligence-rules.ts`: 룰 기반 병목 탐지 로직 (시간 초과, 비용 과다, 비연결 노드, 선행 병목)
4. `features/intelligence/domain/intelligence-priority.ts`: 운영 개선 우선순위(P1/P2/P3) 자동 분류 규칙

#### [Service Layer (읽기 전용 분석 파이프라인)]
5. `features/intelligence/services/intelligence-repository.ts`: 기존 영속성 함수(`getWorkflows`, `loadWorkflowBundle`)를 안전하게 감싸는 Read-Only 어댑터
6. `features/intelligence/services/intelligence-service.ts`: 전체 워크플로우 데이터 취합 및 도메인 분석 실행기

#### [UI Layer (컴포넌트 & 반응형 레이아웃)]
7. `features/intelligence/components/IntelligenceDashboard.tsx`: 인텔리전스 메인 컨테이너
8. `features/intelligence/components/OverviewMetrics.tsx`: 총 시간, 총 비용, 병목 건수, 워크플로우 요약 카드 4종
9. `features/intelligence/components/WorkflowAnalysisCard.tsx`: 워크플로우별 시간/비용/병목 분석 카드
10. `features/intelligence/components/BottleneckList.tsx`: 탐지된 병목 현황 및 상세 원인 설명 리스트
11. `features/intelligence/components/ImprovementPriorityList.tsx`: P1/P2/P3 운영 개선 권고사항 목록
12. `features/intelligence/components/OwnerLoadTable.tsx`: 담당자(Owner)별 단계 수/소요 시간/비용 부하 매트릭스
13. `features/intelligence/components/ToolUsageTable.tsx`: 도구(Tool)별 활용 빈도 통계
14. `features/intelligence/components/AnalysisEmptyState.tsx`: 워크플로우가 없거나 데이터가 비어있을 때 안내 컴포넌트

#### [App Route]
15. `app/intelligence/page.tsx`: `/intelligence` 라우트 페이지 (인증 확인, SSR/CSR 데이터 로딩)

#### [Tests]
16. `tests/intelligence-domain.test.ts`: 계산 및 룰셋 순수 함수 단위 테스트
17. `tests/intelligence-service.test.ts`: 서비스 계층 취합 및 예외 처리 검증
18. `tests/intelligence-components.test.tsx`: UI 렌더링 및 에디터 이동 검증

### 2.2 수정 대상 파일
* **수정 대상 파일: 0개** (기존 파일 일체 수정 없음)
* *참고 (선택 제안)*: 상단 헤더(`components/layout/AppHeader.tsx`)에 "운영 분석" 메뉴 링크를 추가하는 것은 관리자의 별도 승인이 있을 때만 최소 변경(1줄)으로 적용합니다. 기본적으로는 `/intelligence` 독립 라우트로 바로 접근 가능합니다.

---

## 3. Data Flow & Type Contracts

### 3.1 데이터 흐름도
```mermaid
graph LR
    DB[(Supabase DB)] -->|getWorkflows / loadWorkflowBundle| Repo[intelligence-repository]
    Repo -->|DbWorkflowBundle[]| Service[intelligence-service]
    Service -->|순수 데이터 전달| Calc[intelligence-calculations]
    Service -->|노드/엣지 전달| Rules[intelligence-rules]
    Service -->|분석 결과 종합| Priority[intelligence-priority]
    Calc --> Aggregated[IntelligenceSummary]
    Rules --> Aggregated
    Priority --> Aggregated
    Aggregated --> UI[IntelligenceDashboard]
    UI --> EditorLink["/workflows/[id] 에디터 이동"]
```

### 3.2 핵심 타입 계약 (`intelligence-types.ts`)
```typescript
export interface OperationsOverviewMetrics {
  totalWorkflows: number;
  totalTimeMinutes: number;
  totalCostAmount: number;
  bottleneckCount: number;
  totalNodes: number;
}

export type BottleneckSeverity = 'high' | 'medium' | 'low';
export type BottleneckType = 'duration_overload' | 'cost_overload' | 'orphan_node' | 'dead_end';

export interface BottleneckItem {
  id: string;
  workflowId: string;
  workflowName: string;
  nodeId: string;
  nodeName: string;
  type: BottleneckType;
  severity: BottleneckSeverity;
  reason: string;
  metricValue: number;
  thresholdValue: number;
}

export interface OwnerLoadItem {
  ownerName: string;
  role: string;
  stepCount: number;
  totalMinutes: number;
  totalCost: number;
  workflows: string[];
}

export interface ToolUsageItem {
  toolName: string;
  usageCount: number;
  associatedOwners: string[];
  workflows: string[];
}

export interface ImprovementPriorityItem {
  priority: 'P1' | 'P2' | 'P3';
  title: string;
  targetWorkflowId: string;
  targetWorkflowName: string;
  description: string;
  expectedBenefit: string;
}
```

---

## 4. Test Plan (품질 검증 계획)

1. **도메인 순수 함수 검증 (`intelligence-domain.test.ts`)**:
   - 빈 워크플로우 배열 전달 시 0값 안전 처리
   - null/undefined 시간 및 비용 누락 노드(0으로 안전 처리)
   - 소요시간 임계치(예: 120분 초과) 초과 노드 정확한 병목 감지
   - 비용 임계치(예: 100,000원 초과) 초과 노드 감지
   - 엣지가 연결되지 않은 고립(Orphan) 노드 감지
   - 담당자 미지정, 도구 미지정 노드 그룹핑
   - P1/P2/P3 우선순위 정렬 정확도
2. **서비스 계층 검증 (`intelligence-service.test.ts`)**:
   - 기존 저장소 함수 Mocking을 통한 안전한 비동기 데이터 취합 검증
   - 네트워크 에러 발생 시 명시적 Error State 반환 검증
3. **UI 컴포넌트 검증 (`intelligence-components.test.tsx`)**:
   - 로딩 스켈레톤, 빈 상태 안내, 데이터 정상 렌더링 검증
   - "에디터 열기" 클릭 시 `/workflows/[workflowId]` 경로 바인딩 검증

---

## 5. Risk Assessment & Rollback Plan

* **리스크**:
  - 기존 DB 스키마 수정 없음 ➡️ DB 오염 위험 0%
  - 기존 에디터 및 영속성 함수 수정 없음 ➡️ 기존 V1.0.1 기능 회귀 위험 0%
  - 신규 라우트 `/intelligence`는 기존 라우트와 완전 격리됨
* **롤백 계획**:
  - 문제 발생 시 신규 생성된 파일(`app/intelligence/`, `features/intelligence/`, `tests/intelligence-*.test.ts`)만 삭제하거나 `git checkout d50e144`로 1초 이내 즉각 복구 가능.

---

## 6. 승인 요청 사항

본 엔지니어는 절대 규칙에 따라 일체의 코드 수정을 진행하지 않고 대기 중입니다.  
위 제안된 파일 목록 및 구조로 **Step 3 (도메인 순수 함수 계층 구현)**부터 단계별 진행을 승인해 주시겠습니까?
