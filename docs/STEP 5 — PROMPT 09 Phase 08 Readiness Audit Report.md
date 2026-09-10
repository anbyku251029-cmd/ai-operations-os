# OPS Blueprint V1
# STEP 5 — PROMPT #09 Phase 08 Database & Persistence Readiness Audit Report

> **작성일**: 2026-09-08  
> **엔지니어**: Senior Full-Stack Engineer / Supabase Persistence Architect (Antigravity)  
> **역할**: Audit Only (코드 수정 없음, 비변형 검증만 수행)  
> **프로젝트**: `c:\Dev\ai-operations-os`  
> **수행 작업**: PHASE 08-A — Database & Persistence Readiness Audit  
> **최종 판정**: **READY WITH CHANGES (Human Review 대기)**  

---

## 1. 종합 판정 (Overall Status)

```text
================================================================================
AUDIT STATUS: READY WITH CHANGES
================================================================================
```

- **판정 사유**:
  - 클라이언트 에디터(Zustand, React Flow 캔버스, 프로퍼티 폼) 및 Supabase SSR 연동 인프라는 준비가 완료되었습니다.
  - 현재 실제 Supabase 마이그레이션 파일(`01_workspaces_workflows.sql`)에는 `workspaces`와 `workflows`만 정의되어 있으며, 하위 데이터 계층인 **`sections`, `nodes`, `edges` 테이블 DDL 및 RLS 정책 정의가 아직 작성되지 않은 상태**입니다.
  - 또한 `WorkflowEditor`의 저장 로직이 현재 600ms 시뮬레이션 상태이므로, 계획서에 정의된 **Persistence 계층(`lib/persistence/`) 신설 및 DB 스키마 확충**을 진행하면 PHASE 08을 성공적으로 완수할 수 있습니다.

---

## 2. 현재 아키텍처 분석

```text
[ Browser / Client ]
  ├── EditorHeader (Save 버튼, 4단계 상태 배지: saved / unsaved / saving / error)
  ├── WorkflowEditor (현재 handleSave는 setTimeout 시뮬레이션 동작 중)
  ├── useEditorStore (Zustand: nodes, edges, saveStatus, selection 관리)
  └── PropertiesPanel / CanvasPanel / StructurePanel

[ Server & Persistence (Current) ]
  ├── features/workflow/actions/workflow-actions.ts (워크플로우 메타데이터 CRUD)
  ├── lib/supabase/server.ts & client.ts (@supabase/ssr 기반 정규 클라이언트)
  ├── app/api/canvas/route.ts (레거시 local fs persistence, 현재 미사용)
  └── supabase/migrations/01_workspaces_workflows.sql (workspaces, workflows만 존재)
```

---

## 3. Supabase 준비 상태

- **클라이언트 인프라**:
  - `lib/supabase/client.ts` (`createBrowserClient`), `lib/supabase/server.ts` (`createServerClient` with Cookie Store) 완비.
  - Next.js 16 App Router 및 React 19 환경과 100% 호환 동작 확인.
- **환경 변수 구성**:
  - `.env.example`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 선언 완료.
  - Supabase 미연결 시 로컬 개발 및 테스트를 위한 Fallback 인메모리 스토어(`global.__mockWorkflows`)가 안전망으로 구성되어 있어 테스트 실행 안정성이 확보됨.

---

## 4. 데이터베이스 스키마 준비 상태

| 테이블 | 현재 상태 | STEP 3 및 PHASE 08 요구사항 | 조치 필요 사항 |
| :--- | :---: | :--- | :--- |
| **`profiles`** | 기획/auth 연동 | Auth User 연동 기본 프로필 | 필요 시 auth trigger 연동 점검 |
| **`workspaces`** | **준비됨** (`01_migration`) | `id`, `owner_id`, `name`, `created_at`, `updated_at` 완비 | 없음 (현행 유지) |
| **`workflows`** | **준비됨** (`01_migration`) | `id`, `workspace_id`, `name`, `description`, `created_at`, `updated_at` 완비 | 없음 (현행 유지) |
| **`sections`** | **미작성 (Missing)** | `id`, `workflow_id`, `name`, `position`, `timestamps` | **신규 DDL 마이그레이션 작성 필요** |
| **`nodes`** | **미작성 (Missing)** | `id`, `workflow_id`, `section_id`, `name`, `description`, `owner`, `role`, `tool`, `duration`, `cost`, `notes`, `position_x`, `position_y` | **신규 DDL 마이그레이션 작성 필요** |
| **`edges`** | **미작성 (Missing)** | `id`, `workflow_id`, `source_node_id`, `target_node_id` | **신규 DDL 마이그레이션 작성 필요** |

> ⚠️ **핵심 스키마 결정 사항**:
> - Editor의 `durationMinutes`, `costAmount`와 DB의 `duration`, `cost` 간의 필드명 불일치는 **컴포넌트가 아닌 Mapper Layer(`workflow-mapper.ts`)에서 전담 변환**하도록 설계되어야 합니다.

---

## 5. RLS 준비 상태

- `workspaces`, `workflows`:
  - `owner_id = auth.uid()` 기반의 워크스페이스 소유권 및 워크플로우 하위 RLS 4종(SELECT, INSERT, UPDATE, DELETE) 완비.
- `sections`, `nodes`, `edges`:
  - 현재 미작성 상태이므로, 부모인 `workflows`의 소유권을 상속받는 RLS 정책을 작성해야 함.

---

## 6. 에디터 상태 준비 상태

- `stores/useEditorStore.ts`:
  - `nodes: EditorNode[]`, `edges: EditorEdge[]` 지원.
  - `saveStatus: 'saved' | 'unsaved' | 'saving' | 'error'` 상태 머신 100% 가동 중.
  - 노드 이동, 추가, 삭제, 엣지 연결, 속성 수정 시 `saveStatus: 'unsaved'` 자동 전이 완료.
  - **준비 완벽**: 영속성 계층에서 스냅샷을 읽고 주입할 수 있는 인터페이스 완비.

---

## 7. 매퍼 준비 상태

- 현재 상태: 전용 Mapper 파일 부재 (`lib/persistence/` 미생성 상태).
- 필요 구현:
  - `lib/persistence/workflow-types.ts`: DB Row 타입 및 Snapshot 페이로드 타입 정의.
  - `lib/persistence/workflow-mapper.ts`: DB Row ↔ Editor State 양방향 변환.

---

## 8. 영속성 리스크 분석

1. **외래키 제약조건(FK Cascade) 및 저장 순서 리스크**:
   - `Sections → Nodes → Edges` 순서의 엄격한 순차 저장 및 삭제 시 역순(`Edges → Nodes → Sections`) 보장.
2. **저장 중 편집 경쟁 상태 (Race Condition)**:
   - 불변 스냅샷(Immutable Snapshot)을 복제하여 전송하고, `saving` 중에는 Save 버튼 disabled 처리.
3. **Autosave 유입 리스크 (LOCK 01 위반 방지)**:
   - 오직 사용자가 `EditorHeader`의 Save 버튼을 직접 클릭했을 때만 호출되는 명시적 트리거로 철저히 제한.

---

## 9. 요구되는 변경 내역

1. **DB DDL 마이그레이션 파일 작성 (`supabase/migrations/02_editor_persistence.sql`)**
2. **영속성 계층 신설 (`lib/persistence/` - types, mapper, repository)**
3. **에디터 뷰 연동 (`WorkflowEditor.tsx` & `page.tsx` - load & save)**
4. **단위 및 통합 테스트 작성 (`tests/workflow-persistence.test.ts`)**

---

## 10. 수정/생성 대상 파일 목록

| 작업 | 파일 경로 | 설명 |
| :---: | :--- | :--- |
| **[NEW]** | `supabase/migrations/02_editor_persistence.sql` | `sections`, `nodes`, `edges` 테이블 및 RLS DDL |
| **[NEW]** | `lib/persistence/workflow-types.ts` | 영속성 데이터 인터페이스 정의 |
| **[NEW]** | `lib/persistence/workflow-mapper.ts` | DB Row ↔ Editor State 변환 매퍼 |
| **[NEW]** | `lib/persistence/workflow-repository.ts` | Supabase Load/Save 통신 계층 |
| **[MODIFY]** | `app/workflows/[workflowId]/page.tsx` | 워크플로우 진입 시 초기 데이터 페칭 연동 |
| **[MODIFY]** | `features/editor/components/WorkflowEditor.tsx` | 시뮬레이션 `handleSave`를 실제 Repository 호출로 교체 |
| **[MODIFY]** | `features/editor/components/EditorHeader.tsx` | `saving` 상태 시 저장 버튼 disabled 처리 |
| **[NEW]** | `tests/workflow-persistence.test.ts` | PHASE 08 전용 10대 검증 테스트 |

---

## 11. 권장 구현 순서

```text
Step 1: PROMPT #08-B — Database Schema & RLS DDL 작성 (02_editor_persistence.sql)
Step 2: PROMPT #08-C — Persistence Mapper & Types 구현 (workflow-types.ts, workflow-mapper.ts)
Step 3: PROMPT #08-D — Persistence Repository & Load Flow 구현 (workflow-repository.ts, page.tsx)
Step 4: PROMPT #08-E — Explicit Save & Status Machine 연동 (WorkflowEditor.tsx, EditorHeader.tsx)
Step 5: PROMPT #08-F — Persistence Tests 작성 (workflow-persistence.test.ts)
Step 6: PROMPT #08-G — Full Verification (타입, 린트, 전체 테스트, 빌드)
```

---

## 12. 비변형 검증 결과

- **`npx tsc --noEmit`**: **PASS** (오류 0건, Exit Code 0)
- **`npm test`**: **PASS** (10개 파일 70개 테스트 통과)
- **`npm run build`**: **PASS** (Next.js 16 Turbopack 프로덕션 빌드 성공, Exit Code 0)

---

## 13. 절대 변경해서는 안 되는 항목

- ❌ `useEditorStore.ts`의 `saveStatus` 4단계 상태 머신 정의 (`saved`, `unsaved`, `saving`, `error` 외 임의 추가 금지)
- ❌ Autosave, Debounced Save, Interval Save 등 자동 저장 로직 일체 도입 금지
- ❌ Prisma, Drizzle 등 신규 ORM 설치 및 추가 금지
- ❌ Undo/Redo 기능 구현 금지 (Phase 09 전용)
- ❌ AI, Teams, 협업 등 미승인 기능 일체 금지

---

## 14. Gate Decision

```text
================================================================================
GATE DECISION: READY WITH CHANGES (PROCEED TO HUMAN REVIEW)
STOP: NO CODE MODIFIED. AWAITING USER APPROVAL.
================================================================================
```
