# STEP 0 — Puzzle 역설계 결과보고서

> **작성일**: 2026-09-08  
> **목적**: OPS Blueprint 개발을 위한 Puzzle 구조 역설계 및 핵심 인사이트 추출  
> **참조 출처**: Puzzle 공식 홈페이지(puzzleapp.io), 공식 Help Center  
> **다음 단계**: STEP 1 — 서비스 정의

---

## 분석 관점

Puzzle을 그대로 복제하지 않는다. 우리는 다음 질문으로 분석한다.

> **"Puzzle이 왜 이렇게 설계되었고, 어떤 UX 원칙 때문에 사용자가 복잡한 업무를 하나의 화면에서 이해할 수 있는가?"**

분석은 7개 층으로 구분한다:

```
┌───────────────────────────────┐
│  01. Business Model           │
├───────────────────────────────┤
│  02. User Experience          │
├───────────────────────────────┤
│  03. Information Architecture │
├───────────────────────────────┤
│  04. Core Objects             │
├───────────────────────────────┤
│  05. Canvas Interaction       │
├───────────────────────────────┤
│  06. AI / Data Architecture   │
├───────────────────────────────┤
│  07. MVP 개발 범위             │
└───────────────────────────────┘
```

---

## 01. Business Model — Puzzle의 핵심 가치

Puzzle 공식 홈페이지의 핵심 메시지:

> **"Where operational context lives"**

단순히 업무 프로세스를 그리는 도구가 아니라, **조직의 운영 맥락(operational context)을 하나의 구조화된 공간에 저장하는 시스템**이다.

| 항목 | 내용 |
|------|------|
| **제품 본질** | Connected Operational Knowledge System |
| **핵심 차별점** | Diagram Tool이 아니라 데이터 기반 운영 시스템 |
| **가격 정책** | Free → Team → Business → Enterprise |
| **AI 제품** | Nova (문서/이미지/CSV → Workflow 자동 생성) |
| **확장성** | MCP Connector → 외부 AI Agent가 Blueprint 읽기 가능 |

---

## 02. User Experience — 핵심 발견

### Puzzle vs 일반 Diagram 도구의 결정적 차이

**일반 Diagram (Miro, Lucidchart):**
```
┌─────────────┐
│  고객문의    │
└──────┬──────┘
       ↓
┌─────────────┐
│  담당자 배정 │
└─────────────┘
```
→ Node는 **그림**이다.

**Puzzle:**
```
┌──────────────────────┐
│  고객문의 접수        │
│                      │
│  Owner:  CS Team     │
│  Role:   CS Agent    │
│  Tool:   HubSpot     │
│  Data:   Customer    │
│  Cost:   $X          │
└──────────┬───────────┘
           ↓
```
→ Node는 **데이터 객체**다.

> ⚡ **이것이 우리가 반드시 가져와야 할 핵심 UX다.**

---

## 03. Information Architecture — 전체 구조

### Puzzle Workspace 전체 구조

```
PUZZLE WORKSPACE
│
┌──────────────────┼──────────────────┐
│                  │                  │
▼                  ▼                  ▼
WORKFLOWS        TEAMS             PEOPLE
│                  │                  │
└──────────────────┼──────────────────┘
                   │
                   ▼
                 TOOLS
                   │
                   ▼
               CHANGELOG
```

공식 Help Center 기준 **4개의 연결된 Canvas + Changelog** 구조다.

### Tab 개념

각 Canvas 안에서 콘텐츠를 그룹화한다:

```
Workflows
│
├── Sales
├── Marketing
├── Customer Support
└── HR
```

Workflows뿐 아니라 Teams, People, Tools에도 동일한 Tab 개념이 적용된다.

---

## 04. Core Objects — 핵심 객체 분석

### 객체 계층 구조

```
Workspace
│
├── Workflows
│   └── Workflow
│       └── Section (관련 Step 그룹)
│           └── Step (가장 작은 핵심 단위)
│               ├── Name
│               ├── Description
│               ├── Owner (Person)
│               ├── Role
│               ├── Tool
│               ├── Attributes / Data
│               ├── Connections (Edge)
│               └── Notes / SOP
│
├── Teams
│   └── Role → Person
│
├── People
│   └── Person → Role → Team
│
└── Tools
    └── Tool → Workflow Step
```

### 핵심 Graph 관계 (Puzzle의 진짜 데이터 모델)

```
Workspace
│
┌──────────┼──────────┐
│          │          │
▼          ▼          ▼
Workflow  Team      Tools
│          │
▼          ▼
Section   Role
│          │
▼          ▼
Step ─────── Role
│              │
│              ▼
│            Person
│
├── Data
├── Tool ←──── Tools
├── Person ←── People
├── Cost
└── SOP
```

---

## 05. Canvas Interaction — UI 구조

### Workflow Editor 화면 구조

```
┌──────────────────────────────────────────────────────────┐
│  Header                                                  │
├──────────────┬──────────────────────────┬────────────────┤
│              │                          │                │
│  Sidebar     │        Canvas            │   Properties   │
│              │                          │                │
│  Sections    │  ┌─────────┐             │  Step Name     │
│  │           │  │ Step A  │             │  Description   │
│  ├ Section 1 │  └────┬────┘             │  Owner         │
│  │ ├ Step 1  │       ↓                  │  Role          │
│  │ ├ Step 2  │  ┌─────────┐             │  Tool          │
│  │ └ Step 3  │  │ Step B  │             │  Notes         │
│  │           │  └─────────┘             │                │
│  └ Section 2 │                          │  [Save]        │
│    ├ Step 4  │                          │                │
│    └ Step 5  │                          │                │
│              │                          │                │
└──────────────┴──────────────────────────┴────────────────┘
  Left 200px         Center flex           Right 280px
```

### Sidebar 역할

단순 메뉴가 아니다. **Section으로 빠르게 이동하고, Workflow의 전체 구조를 파악하는 탐색 도구**다.

### Properties Panel

Node 클릭 시 표시되는 상세 정보 패널:

**MVP 구현 범위:**
```
Step Name
Description
Owner
Role
Tool
Notes
[Save]
```

**향후 확장 (Phase 2+):**
```
Attributes
Cost
Frequency
Comments
SOP
AI Suggestions
```

---

## 06. AI / Data Architecture

### Nova AI 구조

```
Documents
Screenshots
CSV
Transcript
     │
     ▼
   NOVA
     │
     ▼
Structured Blueprint
     │
     ▼
   Canvas
     │
     ▼
Human Refinement
```

### MCP 구조

```
Puzzle
  │
  │ MCP Connector
  ▼
AI Agent (Claude, ChatGPT, Custom)
  │
  ▼
Operational Context 활용
```

> 두 기능 모두 **Phase 2 이후로 확정**. Architecture에 확장 포인트만 남겨둔다.

---

## 07. MVP 개발 범위 결정

### V1에서 만들 것 ✅

```
OPS Blueprint V1
│
├── Dashboard        — 워크플로우 목록, 통계 카드
├── Workflow 목록     — 생성, 이름 변경, 삭제, 검색
├── Workflow Editor  — 3패널 레이아웃
│   ├── Sidebar      — Section / Step 트리 탐색
│   ├── Canvas       — React Flow 기반 노드 편집
│   └── Properties   — Node 상세 정보 입력
├── Section          — Step 그룹화 단위
├── Step (Node)      — 이름, 설명, 담당자, 역할, 도구, 시간, 비용
├── Edge (Connection)— 드래그로 노드 연결
└── 저장             — Supabase DB
```

### V1에서 절대 만들지 않을 것 ❌

| 기능 | 이유 |
|------|------|
| Nova AI | Phase 2 |
| MCP Connector | Phase 2 |
| Teams Canvas | Phase 2 |
| People Canvas | Phase 2 |
| Tools Canvas | Phase 2 |
| Changelog | Phase 2 |
| Cost Analysis Dashboard | Phase 2 |
| External Integrations (n8n, Zapier) | Phase 2 |
| Billing (Stripe) | Phase 2 |
| Advanced Permissions | Phase 2 |
| Real-time Collaboration | Phase 2 |
| Complex Data Attributes | Phase 2 |
| Shared View | Phase 2 |

### Puzzle 패턴 도입 여부

| Puzzle 패턴 | V1 도입 | 비고 |
|------------|---------|------|
| Canvas 중심 UX | ✅ | 핵심 |
| Node 기반 Workflow | ✅ | 핵심 |
| Section | ✅ | 핵심 |
| Step (데이터 객체) | ✅ | 핵심 |
| Edge / Connection | ✅ | 핵심 |
| Sidebar (구조 탐색) | ✅ | 핵심 |
| Properties Panel | ✅ | 핵심 |
| Zoom / Pan | ✅ | React Flow 기본 |
| Node 이동 | ✅ | React Flow 기본 |
| Workflow 저장 | ✅ | Supabase |
| Tab 개념 | ⏳ | Phase 2 |
| Teams Canvas | ⏳ | Phase 2 |
| People Canvas | ⏳ | Phase 2 |
| Tools Canvas | ⏳ | Phase 2 |
| AI (Nova) | ⏳ | Phase 2 |
| MCP | ⏳ | Phase 2 |
| Shared View | ⏳ | Phase 2 |

---

## 핵심 사용자 Journey (V1)

```
Landing
  ↓
Sign Up
  ↓
Workspace 생성
  ↓
Dashboard
  ↓
Create Workflow (이름 입력)
  ↓
Canvas 진입
  ↓
Section 추가
  ↓
Step (Node) 추가
  ↓
Step 연결 (Edge 드래그)
  ↓
Step 클릭 → Properties 입력
  (이름 / 담당자 / 도구 / 설명)
  ↓
저장
  ↓
결과:

┌─────────────┐
│  문의 접수   │
└──────┬──────┘
       ↓
┌─────────────┐
│  유형 분류   │
└──────┬──────┘
       ↓
┌─────────────┐
│  담당자 배정 │
└──────┬──────┘
       ↓
┌─────────────┐
│   답변      │
└─────────────┘
```

---

## V1 데이터 모델 (최소화)

```sql
-- 워크스페이스 (조직 단위)
workspaces
  id, name, created_at

-- 워크플로우
workflows
  id, workspace_id, name, description, created_at, updated_at

-- 섹션 (Step 그룹)
sections
  id, workflow_id, name, position, created_at

-- 노드 (Step)
nodes
  id, workflow_id, section_id
  type        -- 'process' | 'decision' | 'start' | 'end'
  title
  description
  owner_name
  role_name
  tool_name
  duration_min
  cost_krw
  position_x, position_y
  created_at

-- 연결 (Edge)
edges
  id, workflow_id, source_id, target_id
```

---

## V1 기술 스택

```
Frontend
├── Next.js 16 (App Router)
├── TypeScript 5
├── Tailwind CSS v4
└── shadcn/ui

Canvas
└── @xyflow/react 12

State
└── Zustand 5

Toast
└── sonner

Backend
└── Supabase
    ├── PostgreSQL
    └── Auth (Phase 2)

AI (Phase 2+)
├── OpenAI API
├── Anthropic API
└── Google AI API
```

---

## V1 라우트 구조

```
/                       → redirect → /dashboard
/dashboard              → 워크플로우 목록, 통계
/workflows              → 워크플로우 목록 (전체)
/workflows/new          → 워크플로우 생성
/workflows/[id]         → Canvas Editor (핵심 화면)

--- Phase 2 이후 ---
/teams
/people
/tools
/settings
/shared/[token]
```

---

## 개발 5원칙 (개발 헌법)

> STEP 0 분석에서 도출한 핵심 원칙. 이번 프로젝트 전 기간에 걸쳐 적용한다.

| # | 원칙 | 설명 |
|---|------|------|
| **원칙 1** | **Canvas가 제품의 중심이다** | Dashboard가 제품이 아니다. Canvas Editor가 핵심이다. |
| **원칙 2** | **Node는 그림이 아니라 데이터 객체다** | 모든 Step은 이름·담당자·역할·도구·비용 데이터를 가진다. |
| **원칙 3** | **관계가 가치다** | Step ↔ Person ↔ Role ↔ Team ↔ Tool ↔ Data의 연결성이 서비스를 강력하게 만든다. |
| **원칙 4** | **복잡한 기능은 나중에 붙인다** | AI, MCP, Integration은 확장 기능이다. MVP를 먼저 완성한다. |
| **원칙 5** | **처음에는 Workflow 하나만 완벽하게 만든다** | 기능 10개를 명확하게 > 기능 100개를 복잡하게. |

---

## 결론 — 우리가 만들 서비스의 뼈대

```
OUR PRODUCT: OPS Blueprint
│
▼
Visual Workflow OS
│
▼
┌─────────────────┐
│    Workflow     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Section    Section
    │
    ▼
  Step (데이터 객체)
    │
  ┌─┼──────┐
  ▼ ▼      ▼
Person Role Tool
  │
  ▼
Team

         ↓
    Canvas UI
         ↓
  Structured Data
         ↓
┌──────────────────┐
│  Future: AI      │
│  Future: MCP     │
│  Future: Tools   │
└──────────────────┘
```

---

## 다음 단계

> **STEP 1 — 서비스 정의**로 이동한다.

STEP 1에서 확정할 10가지:

1. 서비스 이름 / 가칭
2. 서비스 한 문장 정의
3. 타깃 사용자
4. 핵심 문제
5. 핵심 가치
6. V1 MVP 기능 목록
7. 절대 만들지 않을 기능
8. 핵심 User Journey
9. MVP 성공 기준
10. Puzzle과 우리 서비스의 차별점

> ⚠️ **STEP 1 확정 전까지 Antigravity에서 코딩하지 않는다.**  
> 이 규칙이 "AI가 만든 사이트"가 아니라 "우리가 설계한 제품을 AI가 구현하는 구조"를 만드는 핵심이다.

---

*저장 위치: `c:\Dev\ai-operations-os\docs\STEP 0 — Puzzle 역설계.md`*

