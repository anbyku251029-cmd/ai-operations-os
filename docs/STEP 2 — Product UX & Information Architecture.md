# STEP 2 — Product UX & Information Architecture

> **작성일**: 2026-09-08
> **제품명**: OPS Blueprint (가칭)
> **전제**: STEP 0 개발 5원칙 + STEP 1 제품 정의 전체 유지
> **목표**: V1 전체 UX와 Information Architecture를 개발 가능한 수준으로 확정
> **저장 위치**: docs/STEP 2 — Product UX & Information Architecture.md
> **다음 단계**: STEP 3 — Technical Architecture
> **중요**: 본 문서는 코딩 명세가 아니라 UX/IA 설계 명세이다.

---

## 2.0 STEP 2 설계 원칙

STEP 2에서는 다음 6대 원칙을 절대 변경하지 않는다.

```text
1. Canvas First
2. Data First
3. Simple First
4. MVP Lock
5. Human Control
6. Verify Before Next
```

모든 화면은 다음 질문을 통과해야 한다:
> **"이 기능이 Workflow를 더 쉽게 만들고 이해하는 데 필요한가?"**
아니라면 V1에서는 제거한다.

---

## 2.1 V1 Information Architecture

OPS Blueprint V1의 전체 구조는 최대한 단순하게 유지한다.

```text
OPS Blueprint
│
├── Landing
│
├── Authentication
│   ├── Sign In
│   └── Sign Up
│
└── Application
    │
    ├── Dashboard
    │
    ├── Workflows
    │   ├── Workflow List
    │   ├── Create Workflow
    │   └── Workflow Editor (핵심 화면)
    │
    └── Settings (최소 계정 설정)
```

---

## 2.2 URL Architecture

URL은 단순하고 예측 가능해야 한다.

```text
/                       Landing
/login                  Sign In
/signup                 Sign Up
/dashboard              Dashboard
/workflows              Workflow List
/workflows/new          Workflow 생성
/workflows/[workflowId] Workflow Editor (P0)
/settings               Settings
```

---

## 2.3 Global Navigation

로그인 후 주요 화면은 공통 Application Shell을 사용한다.

```text
┌──────────────────────────────────────────────────────┐
│ OPS Blueprint                         User ▾         │
├──────────────┬───────────────────────────────────────┤
│              │                                       │
│ Dashboard    │                                       │
│              │                                       │
│ Workflows    │              CONTENT                  │
│              │                                       │
│              │                                       │
│ Settings     │                                       │
└──────────────┴───────────────────────────────────────┘
```

Navigation 메뉴: `Dashboard`, `Workflows`, `Settings` (V1의 전부).

---

## 2.4 Application Shell

```text
Desktop 규격:
- Sidebar: 220px
- Main Content: calc(100vw - 220px)
```
단, **Workflow Editor**에서는 Canvas가 중심이므로 별도의 **3-Panel Editor Layout**을 사용한다.

---

## 2.5 Landing Page IA

목표: **"OPS Blueprint가 무엇인지 10초 안에 이해시킨다."**

- **Hero 핵심 카피**: *"See how your work actually works."*
- **보조 카피**: 업무 프로세스를 하나의 Canvas에서 시각화하고, 담당자·역할·도구·시간·비용을 연결하세요.
- **CTA**: `[Create your first workflow]` / `[See how it works]`

---

## 2.6 Dashboard IA

목표: **"내가 만들고 있는 Workflow로 빠르게 들어가는 것"**

```text
┌──────────────────────────────────────────────┐
│ Dashboard                                    │
│ Welcome back                                 │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ + Create Workflow                        │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Recent Workflows                             │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│ │ Onboarding │ │ CS Support │ │ Marketing  │ │
│ └────────────┘ └────────────┘ └────────────┘ │
└──────────────────────────────────────────────┘
```

---

## 2.7 Workflow List (/workflows)

목적: **내 Workflow를 찾고 새 Workflow를 시작한다.**
- 상단: `Search` 및 `+ Create` 버튼
- 목록 테이블: `Workflow Name`, `Updated Date`, `Action (Open)`

---

## 2.8 Workflow 생성 UX

- 모달/인라인 팝업: `Name` (필수), `Description` (선택)
- 생성 완료 즉시 `/workflows/[workflowId]` 에디터로 자동 전환

---

## 2.9 & 2.10 Workflow Editor (핵심 화면 & 3-Panel 구조)

```text
┌─────────────────────────────────────────────────────────────┐
│ ← Workflows   Customer Onboarding            Save / Status  │
├───────────────┬───────────────────────────────┬─────────────┤
│               │                               │             │
│ Structure     │            CANVAS             │ Properties  │
│ (220px)       │            (flex 1)           │ (300px)     │
│               │                               │             │
│ Section 1     │       ┌───────────┐           │ Name        │
│  ├ Step A     │       │  Step A   │           │ Description │
│  ├ Step B     │       └─────┬─────┘           │ Owner       │
│               │             ↓                 │ Role        │
│ Section 2     │       ┌───────────┐           │ Tool        │
│  ├ Step C     │       │  Step B   │           │ Duration    │
│               │       └───────────┘           │ Cost        │
│               │                               │ Notes       │
└───────────────┴───────────────────────────────┴─────────────┘
```

---

## 2.11 & 2.12 Editor Header 및 Save 상태

Header 구성:
- `← Workflows` (뒤로가기)
- `Workflow Title`
- `Save 상태 인디케이터` + `[Save] 버튼`

**명시적 4단계 Save 상태:**
1. `● Saved` (저장됨)
2. `● Unsaved changes` (변경사항 있음)
3. `● Saving...` (저장 중)
4. `● Save failed` (저장 실패)

---

## 2.13 ~ 2.15 Structure Panel & Section UX

3가지 핵심 역할:
1. 전체 구조 확인
2. 특정 Step 탐색
3. **클릭 시 Canvas의 해당 Node로 Focus 이동 & Properties 연동**

Section 생성 인터랙션:
- 별도 모달 없이 `+ Add Section` 클릭 → 인라인 입력 폼 노출 → 텍스트 입력 후 `Enter` 즉시 생성

---

## 2.16 ~ 2.18 Step 생성 & Node 디자인 및 상태

Step 생성:
- Panel 또는 Canvas의 `+ Add Step` → 인라인 타이틀 입력 → `Enter` 즉시 생성

Node 카드 기본 표시 정보:
- `Title`
- `Owner / Role`
- `Tool`

Node 상태 인터랙션:
- `Default`, `Hover`, `Selected` (명확한 border/shadow/focus), `Dragging`, `Connecting`

---

## 2.19 & 2.20 Canvas 인터랙션 모델

핵심 6대 인터랙션:
1. `Pan` (화면 이동)
2. `Zoom` (확대/축소)
3. `Select` (노드 클릭 시 Properties 열림)
4. `Drag` (노드 위치 이동)
5. `Connect` (드래그하여 Edge 연결선 생성)
6. `Delete` (선택된 노드 및 결합 엣지 삭제)

*Canvas 빈 공간 클릭 시 노드 선택 해제 및 Properties가 Empty State로 전환.*

---

## 2.21 ~ 2.24 Properties Panel 명세

선택된 Node의 상세 속성을 관리:

| Field | Type | Required |
|-------|------|----------|
| Name | Text | Yes |
| Description | Textarea | No |
| Owner | Text | No |
| Role | Text | No |
| Tool | Text | No |
| Duration | Number (분) | No |
| Cost | Number (원) | No |
| Notes | Textarea | No |

**Empty State:**
- 노드 미선택 시 안내 메시지 표시: *"Select a step — Click a step on the canvas to view its details."*

---

## 2.25 ~ 2.29 상태별 UX 명세

- **Delete UX**: 노드 삭제 시 영구 삭제 확인 다이얼로그 제공 (연결 엣지 자동 연쇄 삭제)
- **Empty State**:
  - Workflow 없음: `No workflows yet. [+ Create Workflow]`
  - Step 없음: `This workflow is empty. [+ Add Section]`
- **Loading State**: 레이아웃 쉬프트(CLS)를 방지하는 3-Panel Skeleton 화면 제공
- **Error State**: 기술적 에러 감추고 명확한 한글 메시지와 `[Retry]` 액션 제공

---

## 2.30 ~ 2.32 핵심 User Flow 및 5분 UX 테스트

```text
Create Workflow → Add Section → Add Step → Connect → Select → Edit Properties → Save
```

**5분 UX Acceptance Test 합격 기준:**
- 사전 교육 없는 신규 사용자가 5분 내 신규 직원 온보딩 워크플로우(섹션 3개, 스텝 5개 이상, 연결, 속성 입력, 저장)를 성공하고 새로고침 후 데이터가 유지되는가?

---

## 2.33 ~ 2.37 디자인 시스템 & 반응형 가이드

- **Desktop First**: V1 검증 기준은 Desktop (3패널 동시 노출).
- **Tablet/Mobile**: 태블릿은 우측 서랍(Drawer), 모바일은 바텀 시트(Bottom Sheet) 오버레이로 전환.
- **Visual Keyword**: Clean, Calm, Precise, Professional, Minimal, Structured (과도한 장식 및 불필요한 차트 배제).
- **시각적 우선순위**: Workflow Title → Canvas → Node → Properties → Structure

---

## 2.38 ~ 2.45 V1 Component Architecture & 스코프 엄수

### Component Architecture
```text
AppShell (Header, Sidebar, MainContent)
├── WorkflowList (WorkflowCard, CreateModal)
└── WorkflowEditor (EditorHeader, StructurePanel, Canvas, PropertiesPanel)
```

### V1 의도적 제거 목록 (UI 노출 절대 금지)
- ❌ AI 버튼 / Nova
- ❌ MCP
- ❌ Teams / People / Tools 독립 메뉴
- ❌ Automation / Integration / Billing
- ❌ Real-time Collaboration

---

## 2.46 ~ 2.50 STEP 2 핵심 결론

### 핵심 결정사항
1. **Workflow Editor가 제품의 P0 핵심 화면이다.**
2. **Editor는 Structure / Canvas / Properties 3패널 구조를 확립한다.**
3. **Canvas가 항상 화면의 중심을 차지한다.**
4. **Node 선택 → Properties 편집이 핵심 Loop이다.**
5. **Desktop First + 4단계 Save 상태 + Skeleton Loading을 필수로 갖춘다.**

### STEP 2 한 줄 결론
> ### **"OPS Blueprint V1은 Dashboard가 아니라 Workflow Editor를 중심으로 설계하며, 사용자는 Structure에서 구조를 보고, Canvas에서 업무를 만들고, Properties에서 데이터를 관리한다."**

---

## 다음 단계: STEP 3 — Technical Architecture

STEP 2에서 확정한 화면 및 데이터 모델을 바탕으로 다음 개발 구조를 설계합니다:
1. Tech Stack & Directory Structure
2. Database Schema (Supabase PostgreSQL)
3. React Flow Canvas & Custom Node/Edge Architecture
4. Zustand 상태 저장소 분리 (Server State vs UI State)
5. Save Strategy & Error Handling
6. **Antigravity 첫 번째 개발 프롬프트(Prompt #01) 및 순차적 개발 루프 수립**
