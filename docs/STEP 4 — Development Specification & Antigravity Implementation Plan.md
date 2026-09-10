# STEP 4 — Development Specification & Antigravity Implementation Plan

> **작성일**: 2026-09-08  
> **제품명**: OPS Blueprint (가칭)  
> **전제**: STEP 0 ~ STEP 3 전체 유지  
> **목표**: Antigravity에서 V1을 안정적으로 개발하기 위한 상세 구현 명세와 실행 계획을 확정한다.  
> **저장 위치**: docs/STEP 4 — Development Specification & Antigravity Implementation Plan.md  
> **다음 단계**: STEP 5 — Antigravity Prompt Execution (Prompt #01 Foundation Audit)  
> **핵심 원칙**: 한 번에 전체 제품을 개발하지 않는다. Human-Controlled Loop 준수.  

---

## 4.0 STEP 4 목적

STEP 0~3에서 설계된 WHAT, WHY, UX, ARCHITECTURE를 바탕으로 **HOW(개발 실행 명세)**를 확정한다.
> **"Antigravity가 다음 작업에서 무엇을 해야 하는가?"**

---

## 4.1 개발 헌법 10계명 (Development Constitution)

```text
RULE 01: 기존 Architecture를 임의로 변경하지 않는다.
RULE 02: V1 제외 기능(AI, MCP, Teams/People Canvas 등)을 구현하지 않는다.
RULE 03: 현재 Phase의 목표 외 기능을 구현하지 않는다.
RULE 04: 기존 코드를 먼저 정밀 분석한 후 수정한다.
RULE 05: 파일을 만들기 전에 기존 구조와 중복 여부를 확인한다.
RULE 06: TypeScript 타입 오류를 절대 남기지 않는다.
RULE 07: 작업 완료 후 반드시 검증(lint/test/build)한다.
RULE 08: 검증 실패 상태에서 다음 Phase로 이동하지 않는다.
RULE 09: 문제 발생 시 임의로 우회 라이브러리를 추가하지 않는다.
RULE 10: Architecture 변경이 필요하면 Human Review를 요청한다.
```

---

## 4.2 & 4.4 개발 핵심 Loop & Phase Gate System

```text
Prompt → Analyze → Implement → Verify → [Gate PASS / FAIL] → Commit → Next
```
- **Phase Gate 원칙**: 검증 통과(Gate PASS) 없이는 절대로 다음 Phase로 넘어가지 않는다.

---

## 4.3 12단계 Phase Pipeline & 핵심 완료 조건

```text
PHASE 01: Project Foundation (Next.js, TS, Tailwind, shadcn, Supabase Client 기본 구동)
PHASE 02: Authentication (Supabase Auth, 가입, 로그인, 세션 유지, RLS)
PHASE 03: Workflow CRUD (캔버스 없이 순수 워크플로우 생성/목록/수정/삭제)
PHASE 04: Editor Shell (3-Panel 레이아웃: Header, Structure 220px, Canvas flex, Properties 300px)
PHASE 05: Canvas Node (React Flow 노드 렌더링, 생성/선택/이동/삭제)
PHASE 06: Edge Connection (단순 Directed Edge 연결/삭제)
PHASE 07: Properties (노드 선택 연동 메타데이터 입력 폼 & Zod 검증)
PHASE 08: Persistence (명시적 Save 트랜잭션, 4단계 상태 머신, 새로고침 복원)
PHASE 09: Undo / Redo (클라이언트 인메모리 History Stack)
PHASE 10: UX States (Skeleton Loading, Empty, Error, Unsaved Guard)
PHASE 11: Testing (Unit, Component, E2E Acceptance Test 통과)
PHASE 12: Polish (타이포그래피, 반응형, 접근성, 마이크로 인터랙션)
```

---

## 4.17 ~ 4.24 컴포넌트 아키텍처 및 파일 생성 규칙

- **컴포넌트 구조**:
  - `WorkflowEditor` (오케스트레이션)
  - `EditorHeader` (저장 상태 머신, 뒤로가기)
  - `StructurePanel` (SectionTree, StepTreeItem)
  - `CanvasPanel` (ReactFlow, WorkflowNode, WorkflowEdge)
  - `PropertiesPanel` (NodePropertiesForm, EmptyPropertiesState)
- **네이밍 & 중복 금지 규칙**:
  - Component: `PascalCase`
  - Function/Action: `camelCase`
  - Types: `PascalCase`
  - Database: `snake_case`
  - `utils.ts`, `utils2.ts`, `workflow-helper.ts` 등의 역할 중복 파일 생성 엄격 금지.

---

## 4.26 ~ 4.31 저장 및 인터랙션 규약 (Contracts)

- **Save Contract**: Section, Node, Edge 전체를 단일 Server Action에서 원자적 트랜잭션으로 커밋.
- **Save Status**: `saved(● Saved)`, `unsaved(● Unsaved changes)`, `saving(● Saving...)`, `error(● Save failed)`.
- **Selection Contract**:
  - Canvas Node 클릭 → `selectedNodeId` 갱신 → 노드 하이라이트 + Properties 패널 열림.
  - Structure Step 클릭 → `selectedNodeId` 갱신 → Canvas 포커스 이동(Viewport Pan) + Properties 패널 열림.

---

## 4.38 V1 제외 락 (Exclusion Lock)

Antigravity는 다음 기능/UI를 일체 구현하지 않는다:
> ❌ AI(Nova), MCP, Teams/People/Tools 독자 캔버스, 외부 통합(n8n, Zapier), 결제(Stripe), 실시간 협업, Shared View, Changelog.

---

## 4.39 ~ 4.46 Antigravity 프롬프트 규격 (Standard Prompt Structure)

모든 Antigravity 프롬프트는 아래 10개 필드를 필수로 포함한다:
```text
1. ROLE
2. CONTEXT (STEP 0~4 문서 기반)
3. CURRENT STATE
4. TASK
5. SCOPE
6. DO NOT (금지 사항)
7. FILES (대상 파일)
8. IMPLEMENTATION RULES
9. VERIFICATION (검증 명령)
10. STOP CONDITION (작업 종료 조건)
```

---

## 4.47 ~ 4.49 첫 번째 프롬프트 (Prompt #01) 정의

**PROMPT #01: Project Foundation Audit & Setup**
- **목적**: 코드를 바로 수정하지 않고 현재 `c:\Dev\ai-operations-os` 상태를 STEP 0~4 아키텍처와 대조 분석.
- **점검 대상**: `package.json`, Next.js/Turbopack, TypeScript 버전 충돌, Tailwind/PostCSS, Supabase 패키지, 환경변수, 폴더 구조.
- **Gate**: Antigravity 분석 보고서 제출 → **Human Review & 승인 후** Implementation(Prompt #02) 착수.

---

## 4.55 ~ 4.56 최종 V1 검증 기준 (5분 Acceptance Test)

> **사전 교육 없는 신규 사용자가 설명 없이 5분 이내에 "신규 직원 온보딩" 워크플로우(Section 3개, Step 7개, 연결, 속성 입력, 저장, 새로고침 복원)를 완수할 수 있는가?**

---

## STEP 4 최종 결론

> ### **"Antigravity를 자율 개발자로 사용하는 것이 아니라, 사람이 Architecture와 범위를 통제하고 Antigravity가 작은 단위의 구현을 수행하는 Human-Controlled Development Loop로 개발한다."**

```text
AUDIT (Prompt #01) → REPORT → HUMAN REVIEW → APPROVE → IMPLEMENT
```
