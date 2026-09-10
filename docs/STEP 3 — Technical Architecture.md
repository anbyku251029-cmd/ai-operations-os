# STEP 3 — Technical Architecture

> **작성일**: 2026-09-08  
> **제품명**: OPS Blueprint (가칭)  
> **전제**: STEP 0 개발 헌법 + STEP 1 Product Definition + STEP 2 UX & IA 전체 유지  
> **목표**: V1을 안정적으로 구현하기 위한 기술 아키텍처를 확정한다.  
> **저장 위치**: docs/STEP 3 — Technical Architecture.md  
> **다음 단계**: STEP 4 — Development Specification & Antigravity Implementation Plan  
> **중요**: 본 문서는 V1 구현에 필요한 기술만 정의한다.  

---

## 3.0 Technical Architecture 원칙

```text
UX 요구사항 → 기능 요구사항 → 기술 필요성 → 최소 기술 선택 → 구현 → 검증
```

### 개발 헌법 6원칙 + 4대 기술 원칙
```text
1. Canvas First
2. Data First
3. Simple First
4. MVP Lock
5. Human Control
6. Verify Before Next
7. Type Safe (타입 정합성 최우선)
8. Server State와 UI State 분리
9. Persistence는 명시적으로 관리
10. 외부 서비스 의존성 최소화
```

---

## 3.1 확정 기술 스택 (V1 Stack)

| 영역 | 기술 | 역할 |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | Web Application (풀스택) |
| **Language** | TypeScript 5 | 엄격한 Type Safety |
| **UI Library** | React 19 + shadcn/ui | UI Component Primitives |
| **Styling** | Tailwind CSS v4 | Styling |
| **Canvas Engine** | React Flow (@xyflow/react) | Node Graph Engine |
| **Client State** | Zustand | Editor UI & Interaction State |
| **Backend & DB** | Supabase (PostgreSQL) | Persistence & Relational DB |
| **Authentication** | Supabase Auth | User Auth & Session |
| **Validation** | Zod | Runtime Schema Validation |
| **Form** | React Hook Form | Form State Management |
| **Testing** | Vitest + Testing Library / Playwright | Unit/Component & E2E Test |

---

## 3.3 ~ 3.6 아키텍처 계층 및 폴더 구조

```text
ai-operations-os/
├── app/                        # Next.js App Router (Routing/Page Composition)
│   ├── (public)/               # Landing, login, signup
│   ├── (app)/                  # dashboard, workflows, [workflowId] (P0), settings
│   ├── layout.tsx
│   └── globals.css
├── components/                 # 재사용 UI (ui/, layout/, editor/)
├── features/workflow/          # 핵심 도메인 (components, hooks, actions, schemas, types)
├── stores/editor-store.ts      # Zustand UI/Editor 상태 저장소
├── lib/                        # Infrastructure (supabase/client, server, validations)
├── types/                      # Database & Workflow TypeScript Interfaces
└── docs/                       # STEP 아키텍처 보고서 폴더
```

---

## 3.7 ~ 3.20 데이터베이스 스키마 (Supabase PostgreSQL)

```text
workspaces (1) ──< workflows (N)
                      ├──< sections (N) ──< nodes (N)
                      └──< edges (N)
```

1. **`profiles`**: `id(UUID PK, Auth User 연동)`, `display_name`, `timestamps`
2. **`workspaces`**: `id(UUID PK)`, `name`, `timestamps` (V1 기본 워크스페이스 1개 제공)
3. **`workflows`**: `id(UUID PK)`, `workspace_id(FK)`, `name`, `description`, `timestamps`
4. **`sections`**: `id(UUID PK)`, `workflow_id(FK)`, `name`, `position(INT)`, `timestamps`
5. **`nodes`**:
   - `id(UUID PK)`, `workflow_id(FK)`, `section_id(FK)`
   - `name(NOT NULL)`, `description`, `owner`, `role`, `tool`
   - `duration(INT)`, `cost(NUMERIC)`, `notes`
   - `position_x(FLOAT)`, `position_y(FLOAT)`
6. **`edges`**: `id(UUID PK)`, `workflow_id(FK)`, `source_node_id(FK)`, `target_node_id(FK)`

---

## 3.21 ~ 3.23 Database Node와 React Flow Mapping

Database 레코드와 React Flow Node를 직접 결합하지 않고 양방향 **Mapper 계층**을 도입한다.
```text
DB Node ──(Mapper)──> ReactFlowNode ({ id, position: {x,y}, data: {name, owner, role, tool} })
ReactFlowNode ──(Mapper)──> DB Record Payload
```

---

## 3.24 ~ 3.29 상태 및 Save 아키텍처

- **Server State**: Supabase DB에 보존되는 Workflow, Section, Node, Edge 데이터
- **UI & Canvas State (Zustand)**: `selectedNodeId`, `viewport`, `zoom`, `panelState`, `isDirty`, `saveStatus`
- **V1 Save 정책**: **명시적 Save(Explicit Save)를 기본 원칙**으로 채택. 무분별한 실시간 Autosave는 네트워크 비용 및 경합 방지를 위해 배제.
- **Save 상태 머신**: `Saved` → (수정) → `Unsaved changes` → (저장 클릭) → `Saving...` → `Saved` / `Save failed`
- **페이지 이탈 방지**: Unsaved changes 상태에서 창 닫기/뒤로가기 시 확인 팝업 제공.

---

## 3.30 ~ 3.33 클라이언트 인메모리 Undo / Redo

- Client Session 범위의 **History Stack (Past, Present, Future)** 유지
- Undo 대상: Node 생성/삭제/이동/수정, Edge 연결/삭제, Section 생성/이름변경/삭제
- DB 부하를 방지하기 위해 DB 저장은 명시적 Save 시점에만 일괄 Commit 수행.

---

## 3.37 ~ 3.40 보안 및 권한 (Row Level Security)

- **Supabase Client 분리**: `client.ts` (브라우저 anon key) / `server.ts` (Server Component/Actions)
- **RLS 원칙**: 사용자는 본인이 속한 Workspace의 데이터만 접근 가능 (`auth.uid() = workspace_owner / member`).
- **키 보호**: Service Role Key는 클라이언트에 절대 노출 금지.

---

## 3.47 ~ 3.53 트랜잭션 및 삭제 정책

- **Node 삭제**: 연결된 Edge 자동 동시 삭제 (참조 무결성 보장)
- **Section 삭제**: 하위 포함 Node 및 연결 Edge 일괄 삭제 (확인 모달 필수)
- **Save Transaction**: Workflow 1회 저장 시 Section, Node, Edge를 단일 Server Action에서 원자적 트랜잭션으로 처리.

---

## 3.56 & 3.57 렌더링 전략 (RSC vs RCC)

- **Server Components (RSC)**: Dashboard, Workflow List, Landing (빠른 초기 로딩, SEO, 서버 데이터 직접 페칭)
- **Client Components (RCC)**: `WorkflowEditor`, `Canvas`, `StructurePanel`, `PropertiesPanel` (브라우저 인터랙션 및 React Flow 캔버스 조작)

---

## 3.63 12단계 순차적 개발 파이프라인 (Phase Pipeline)

```text
PHASE 01: Project Foundation (Next.js, Tailwind, shadcn, Supabase 초기화)
PHASE 02: Authentication (Supabase Auth, Session, Protected Routes)
PHASE 03: Workflow CRUD (Canvas 없는 순수 Workflow 목록/생성/삭제 DB 검증)
PHASE 04: Editor Shell (3-Panel 레이아웃: Header, Structure, Canvas, Properties 껍데기)
PHASE 05: Canvas Node (React Flow 바인딩, 노드 생성/이동/선택/삭제)
PHASE 06: Edge Connection (드래그 연결선 생성 및 삭제)
PHASE 07: Properties (노드 선택 시 우측 메타데이터 폼 연동)
PHASE 08: Persistence (명시적 Save, 4단계 상태 머신, 새로고침 복원)
PHASE 09: Undo / Redo (클라이언트 인메모리 히스토리 스택)
PHASE 10: UX States (Skeleton Loading, Empty, Error, Unsaved Guard)
PHASE 11: Testing (Unit, Component, E2E Acceptance Test 통과)
PHASE 12: Polish (반응형 다듬기, 접근성, 마이크로 인터랙션)
```

---

## 3.78 ~ 3.80 Antigravity 실행 가이드라인 (Architecture Lock)

1. **작은 단위 개발 루프 고수**: `Prompt → Build → Verify → Fix → Commit → Next Prompt`
2. **단일 책임 프롬프트**: 한 번의 프롬프트에서 여러 대형 기능을 요구하지 않음.
3. **Architecture Lock**: 프레임워크 추가, 상태관리 변경, DB 변경, V1 제외 기능 추가는 일체 불허 (Human Review 없이 임의 변경 금지).

---

## STEP 3 최종 결론

> ### **"OPS Blueprint V1은 Next.js + TypeScript 기반의 단일 Web Application으로 구축하며, React Flow를 Canvas Engine으로, Zustand를 Editor/UI State로, Supabase PostgreSQL을 Persistence와 Auth 기반으로 사용한다."**

**"작게 지시하고 → 실행하고 → 검증하고 → 수정하고 → Commit하고 → 다음 단계로 이동한다."**

---

## 다음 단계

> **STEP 4 — Development Specification & Antigravity Implementation Plan**  
> (구체적인 파일별 구현 규격 및 Antigravity 프롬프트 시퀀스 수립)
