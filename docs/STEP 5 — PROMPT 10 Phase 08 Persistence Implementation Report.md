# OPS Blueprint V1
# STEP 5 — PROMPT #10 Phase 08 Persistence Implementation Report

> **작성일**: 2026-09-08  
> **엔지니어**: Senior Full-Stack Engineer / Supabase Persistence Architect (Antigravity)  
> **수행 작업**: PHASE 08 — Supabase Persistence & Explicit Save Implementation  
> **최종 판정**: **PHASE GATE PASS (100% SUCCESS)**  

---

## 1. 개요 및 구현 성과

PHASE 08에서는 브라우저 인메모리에만 머물던 워크플로우 에디터의 `sections`, `nodes`, `edges` 데이터를 **Supabase PostgreSQL에 안전하게 저장(Explicit Save)하고 새로고침 시 완벽하게 복원(Load & Restore)하는 Persistence Layer**를 성공적으로 구축했습니다.

---

## 2. 6대 엄격 통제 락 (Enforced Locks) 준수 검증

- **[LOCK 01] Explicit Save Only**:
  - Autosave, Debounce, Interval, Background 저장을 철저히 배제하고, 오직 사용자가 `EditorHeader`의 Save 버튼을 직접 클릭했을 때만 저장 로직이 동작하도록 구현했습니다.
- **[LOCK 02] DB Server Source of Truth**:
  - Supabase PostgreSQL이 영속성의 유일한 진실의 원천이며, Zustand는 클라이언트 편집 상태만 관리합니다. 페이지 로드 시 Supabase로부터 최신 상태를 로드하여 복원합니다.
- **[LOCK 03] Save Transaction Boundary**:
  - `saveWorkflowSnapshot`에서 Edges 정리 → Nodes Upsert → Edges 재삽입 순서를 엄격히 보장하여 외래키 무결성을 유지하며, 저장 실패 시 `error` 상태로 전환되고 현재 에디터 상태는 온전히 보존됩니다.
- **[LOCK 04] DB ↔ Editor Mapper 분리**:
  - `workflow-mapper.ts`를 신설하여 `durationMinutes ↔ duration`, `costAmount ↔ cost`, `position.x/y ↔ position_x/y`, `source/target ↔ source_node_id/target_node_id`의 명시적 양방향 변환을 수행합니다.
- **[LOCK 05] 기존 DB Architecture 유지**:
  - STEP 3의 스키마 설계를 엄격히 유지하며, Prisma나 Drizzle 등 신규 ORM을 전혀 추가하지 않고 `@supabase/ssr` 기반 Server Action과 SQL 마이그레이션으로만 구현했습니다.
- **[LOCK 06] RLS 절대 우회 금지**:
  - 클라이언트에서 `user_id`를 임의로 주입하지 않으며, 워크스페이스 소유권(`owner_id = auth.uid()`)에 기반한 Supabase RLS 정책 12종을 통해 권한을 강제합니다.

---

## 3. 세부 파일 구현 내역

| 구분 | 파일 경로 | 주요 작업 내용 |
| :---: | :--- | :--- |
| **[NEW]** | `supabase/migrations/02_editor_persistence.sql` | `sections`, `nodes`, `edges` 테이블 DDL, 인덱스 및 워크스페이스 소유권 기반 RLS 정책 12종 작성 |
| **[NEW]** | `lib/persistence/workflow-types.ts` | `DbSection`, `DbNode`, `DbEdge`, `EditorWorkflowSnapshot`, `DbWorkflowBundle` 타입 인터페이스 정의 |
| **[NEW]** | `lib/persistence/workflow-mapper.ts` | `mapDbNodesToEditor`, `mapDbEdgesToEditor`, `mapEditorToDbNodes`, `mapEditorToDbEdges`, `mapSnapshotToDbPayload` 양방향 매퍼 구현 |
| **[NEW]** | `lib/persistence/workflow-repository.ts` | `loadWorkflowBundle`, `saveWorkflowSnapshot` Server Actions 구현 (외래키 순차 보장 및 스냅샷 불변 저장) |
| **[MODIFY]** | `app/workflows/[workflowId]/page.tsx` | 페이지 진입 시 `loadWorkflowBundle`을 호출하여 DB로부터 노드와 엣지를 복원하고 Store에 주입 |
| **[MODIFY]** | `features/editor/components/WorkflowEditor.tsx` | 600ms 시뮬레이션을 제거하고 `saveWorkflowSnapshot` 실시간 호출 및 4단계 상태 전이 연동 |
| **[MODIFY]** | `features/editor/components/EditorHeader.tsx` | `saving` 상태 시 저장 버튼 disabled 처리 (`disabled={saveStatus === 'saving'}`) |
| **[MODIFY]** | `vitest.config.ts` | 윈도우 환경 부하 시 안정적 테스트 구동을 위해 `testTimeout: 15000` 설정 |
| **[NEW]** | `tests/workflow-persistence.test.ts` | 10대 핵심 테스트 케이스(매핑, 위치, 속성, 엣지, 성공/실패 상태머신, 중복 차단, 복원, 격리) 작성 |

---

## 4. PHASE 08 Gate Criteria 18개 전원 충족 (G01 ~ G18)

| Gate | 조건 | 검증 결과 | 판정 |
| :---: | :--- | :--- | :---: |
| **G01** | Supabase 연결 성공 | `@supabase/ssr` 기반 Server Action 연동 완료 | **PASS** |
| **G02** | Workflow Load 성공 | `loadWorkflowBundle` 정상 동작 | **PASS** |
| **G03** | Section Load 성공 | `sections` 쿼리 및 번들 포함 완료 | **PASS** |
| **G04** | Node Load 성공 | `nodes` 조회 및 `mapDbNodesToEditor` 변환 완료 | **PASS** |
| **G05** | Edge Load 성공 | `edges` 조회 및 `mapDbEdgesToEditor` 변환 완료 | **PASS** |
| **G06** | Node Property 저장 | `durationMinutes ↔ duration`, `costAmount ↔ cost`, `owner`, `tool`, `notes` 저장 | **PASS** |
| **G07** | Node Position 저장 | `position.x/y ↔ position_x/y` 소수점 단위 보존 | **PASS** |
| **G08** | Edge 저장 | `source_node_id`, `target_node_id` 저장 | **PASS** |
| **G09** | Delete 상태 저장 | 삭제된 노드/엣지 외래키 순차 정리 | **PASS** |
| **G10** | Explicit Save 동작 | 오직 Save 버튼 클릭 시에만 저장 트리거 | **PASS** |
| **G11** | Save Status 4단계 정상 | `saved` → `unsaved` → `saving` → `saved` / `error` | **PASS** |
| **G12** | Save Error 처리 | 에러 시 `error` 상태 배지 및 토스트 안내 | **PASS** |
| **G13** | Refresh Persistence | 저장 후 재로드 시 동일한 노드/엣지/속성/위치 복원 (Test 09) | **PASS** |
| **G14** | RLS 데이터 격리 | 워크스페이스 소유자 기반 RLS 및 미인가 격리 (Test 10) | **PASS** |
| **G15** | TypeScript 0 errors | `npx tsc --noEmit` 에러 0건 통과 | **PASS** |
| **G16** | ESLint 0 errors | `npx eslint` 에러 0건, 경고 0건 통과 | **PASS** |
| **G17** | 전체 테스트 PASS | 총 11개 파일 **80개 테스트 100% 통과** | **PASS** |
| **G18** | Production Build PASS | Next.js 16 Turbopack 프로덕션 빌드 성공 | **PASS** |

---

## 5. 다음 단계 제안

- **PHASE 09 — Undo / Redo History Stack**:
  - 클라이언트 편집 작업(노드 이동, 추가, 삭제, 엣지 연결, 속성 변경)에 대한 실행 취소/다시 실행 히스토리 스택 구축.
