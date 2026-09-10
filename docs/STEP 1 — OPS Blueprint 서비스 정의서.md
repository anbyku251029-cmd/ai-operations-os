# STEP 1 — OPS Blueprint 서비스 정의서

> **작성일**: 2026-09-08
> **전제**: STEP 0 개발 5원칙 전체 유지
> **목표**: 코딩 없이 "우리가 정확히 무엇을 만들 것인가"를 확정
> **다음 단계**: STEP 2 — Product UX & Information Architecture

---

## 1.1 제품 가칭

### **OPS Blueprint**

> **조직의 업무를 시각적으로 설계하고 구조화하는 Blueprint**

> ⚠️ 이름은 현재 **가칭**이다. 제품을 먼저 만들고 이름은 나중에 확정한다.

---

## 1.2 제품 한 문장 정의

> ### **OPS Blueprint는 복잡한 업무 프로세스를 하나의 Canvas에서 시각화하고, 각 업무 단계의 담당자·역할·도구·시간·비용을 연결해 관리하는 Visual Workflow OS이다.**

쉬운 표현:

> **"우리 조직이 일을 어떻게 하는지 한눈에 보여주는 업무 지도"**

---

## 1.3 우리가 해결하려는 문제

조직의 업무 정보는 현재 이렇게 흩어져 있다:

```
업무 매뉴얼     → Word / PDF
업무 프로세스   → Excel / PowerPoint
담당자         → 조직도
사용 도구       → 각종 SaaS
업무 비용       → 별도 문서
업무 변경 이력  → 메일 / 메신저
```

결국 이 질문에 답하기 어렵다:

> **"이 업무는 실제로 누가, 어떤 도구를 사용해서, 어떤 순서로 처리하고 있는가?"**

---

## 1.4 핵심 Problem Statement

> **조직의 업무 프로세스와 그 업무를 수행하는 사람·역할·도구에 대한 정보가 서로 분리되어 있어 전체 업무 구조를 한눈에 파악하고 개선하기 어렵다.**

---

## 1.5 타깃 사용자

### Primary User (V1 집중)

**업무 프로세스를 관리하는 실무자 / 관리자**

- 팀장
- 업무 담당자
- 운영 관리자
- 프로젝트 관리자
- 프로세스 개선 담당자
- 업무 매뉴얼 작성자

### Secondary User (Phase 2+)

```
경영진 / 기획자 / 컨설턴트 / AI Agent / IT 관리자
```

---

## 1.6 핵심 사용 상황

**고객 민원 처리** 예시:

```
현재 (분산):
  Word 문서 + 조직도 + SaaS 목록 = 파악 불가

OPS Blueprint:
[민원 접수] → [유형 분류] → [담당자 배정]
     → [관련 부서 검토] → [답변 작성] → [고객 회신]

각 Node에:
  담당자 / 역할 / Tool / 소요시간 / 비용 / 설명
```

---

## 1.7 핵심 가치 제안 (3가지)

| 가치 | 설명 |
|------|------|
| **VALUE 01 — See** | 복잡한 업무를 Canvas에서 한눈에 본다 |
| **VALUE 02 — Understand** | Step마다 Who·Role·Tool·Time·Cost를 이해한다 |
| **VALUE 03 — Improve** | 중복·병목·과비용을 발견하는 기반을 만든다 (자동 분석은 V1 제외) |

---

## 1.8 제품의 핵심 Loop (North Star Loop)

```
CREATE → MAP → CONNECT → UNDERSTAND → IMPROVE

구체적으로:
업무 생성 → Step 작성 → Step 연결
→ 담당자/역할/도구 입력 → Canvas 전체 확인 → 업무 개선

미래 (Phase 2+):
업무 설명 → AI → Workflow 자동 생성 → Canvas → Human Review
```

---

## 1.9 V1 MVP 핵심 기능

| # | 기능 | 설명 |
|---|------|------|
| ① | Workflow 생성 | 이름 입력 후 Workflow 생성 |
| ② | Section 생성 | Workflow 안에 Step 그룹 생성 |
| ③ | Step 생성 | Section 안에 업무 단계 추가 |
| ④ | Canvas 배치 | Step을 Canvas에서 자유롭게 이동 |
| ⑤ | Node 연결 | Step 간 Edge(화살표) 연결 |
| ⑥ | Node 상세정보 | Name / Description / Owner / Role / Tool / Duration / Cost / Notes |
| ⑦ | 저장 | Canvas 상태를 Database에 저장 |

---

## 1.10 V1 절대 제외 기능

> ⚠️ **이 목록은 Antigravity 개발 중에도 변경하지 않는다.**

```
❌ AI Workflow Generator (Nova)
❌ MCP Connector
❌ Teams Canvas
❌ People Canvas
❌ Tools Canvas
❌ Changelog
❌ 외부 SaaS Integration (n8n, Zapier, Make, HubSpot)
❌ Billing / Stripe
❌ 실시간 공동편집
❌ 고급 권한관리
❌ Shared View
```

---

## 1.11 V1 핵심 화면 구조

```
Landing → Dashboard → Workflows → Workflow Editor
```

**핵심 화면 — Workflow Editor:**

```
┌────────────┬───────────────────┬────────────┐
│            │                   │            │
│ Structure  │      Canvas       │ Properties │
│            │                   │            │
│ Section 1  │    ┌────────┐     │ Name       │
│  ├ Step A  │    │ Step A │     │ Owner      │
│  ├ Step B  │    └───┬────┘     │ Role       │
│            │        ↓          │ Tool       │
│ Section 2  │    ┌────────┐     │ Duration   │
│  ├ Step C  │    │ Step B │     │ Cost       │
│            │    └────────┘     │            │
└────────────┴───────────────────┴────────────┘
  Left 200px      Center flex    Right 280px
```

> **이 화면이 제품의 중심이다.**

---

## 1.12 UX 핵심 원칙 (5가지)

| # | 원칙 | 설명 |
|---|------|------|
| 1 | **한 화면에서 이해** | 한 화면에서 전체 업무를 파악할 수 있어야 한다 |
| 2 | **Canvas 중심** | Canvas가 항상 화면의 중심이다 |
| 3 | **Node = 데이터** | Node 클릭 시 실제 데이터가 나와야 한다 |
| 4 | **단계적 정보 표시** | Canvas → Node 선택 → Properties → 상세 정보 |
| 5 | **행동 최소화** | Node 생성 → 이름 입력 → Enter 수준으로 빠르게 |

---

## 1.13 경쟁 포지셔닝

```
Diagram Tool      → Miro, Lucidchart, FigJam
Workflow 자동화    → n8n, Zapier, Make
Operational OS    → Puzzle

OPS Blueprint V1: Diagram Tool에서 출발 → Operational System으로 성장
```

> **V1은 자동화 도구가 아니다. "업무가 어떻게 구성되어 있는지 구조화"부터 시작한다.**

---

## 1.14 Puzzle vs OPS Blueprint

| 구분 | Puzzle | OPS Blueprint V1 |
|------|--------|------------------|
| 목적 | Operational Context | Visual Workflow |
| Canvas | ✅ | ✅ |
| Step (데이터 객체) | ✅ | ✅ |
| Section | ✅ | ✅ |
| Teams | ✅ | Phase 2 |
| People | ✅ | Phase 2 |
| Tools Canvas | ✅ | Phase 2 |
| AI (Nova) | ✅ | Phase 2 |
| MCP | ✅ | Phase 2 |
| Integration | ✅ | Phase 2 |
| 복잡도 | 높음 | **낮음 (의도적)** |

> **전략: Puzzle의 강력한 구조를 배우되, 초기 사용 경험은 훨씬 단순하게.**

---

## 1.15 추구하는 UX 포지션

```
        강력함
          ↑
          │      ● OPS Blueprint 목표 영역
          │     /   (강력하지만 단순함)
          │    /
          └────────────→ 복잡성
```

> **"처음 사용하는 사람도 5분 안에 첫 Workflow를 만들 수 있지만,**
> **깊게 사용하면 전문적인 업무 시스템으로 발전할 수 있는 구조"**

---

## 1.16 V1 성공 기준 (7가지)

```
□ 사용자가 Workflow를 생성할 수 있다
□ Section을 만들 수 있다
□ Step을 5개 이상 만들 수 있다
□ Step을 Canvas에서 자유롭게 이동할 수 있다
□ Step과 Step을 연결할 수 있다
□ Node를 클릭하면 상세정보를 수정할 수 있다
□ 새로고침 후에도 Workflow가 유지된다
```

### V1 UX Acceptance Test

> **처음 보는 사람이 별도의 설명 없이 5분 이내에 간단한 Workflow를 하나 만들 수 있는가?**

---

## 1.17 V1 핵심 테스트 시나리오

**"신규 직원 온보딩"** — 모든 개발 테스트에서 이 시나리오를 기준으로 사용

```
신규 직원 온보딩

Section: 입사 전
  [채용 확정] → [계정 생성] → [장비 준비]

Section: 입사일
  [오리엔테이션] → [업무 교육]

Section: 입사 후
  [1주차 점검] → [피드백]

각 Step 예시 (계정 생성):
  Owner:    IT 담당자
  Role:     IT Admin
  Tool:     Google Workspace
  Duration: 30분
  Cost:     10,000원
```

---

## 1.18 V1 이후 확장 로드맵

```
            V1: Workflow Canvas
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
      Teams       People      Tools
        │           │           │
        └───────────┼───────────┘
                    ▼
                   Data
                    │
                    ▼
                   AI (Nova)
                    │
                    ▼
                  MCP
                    │
                    ▼
             External Agents
```

---

## 1.19 최종 Product Definition

> ### **OPS Blueprint는 조직의 복잡한 업무를 Workflow Canvas로 시각화하고, 각 업무 단계의 사람·역할·도구·시간·비용을 구조화하여 업무를 이해하고 개선할 수 있도록 돕는 Visual Workflow OS이다.**

**V1 범위:**

> ### **"Workflow를 만들고 → Canvas에서 연결하고 → 각 Step의 정보를 관리하는 것"**

**V1 단 하나의 목표:**

> ### **"사용자가 5분 안에 자신의 업무 Workflow를 만들고, Canvas에서 그 구조를 이해할 수 있게 한다."**

---

## 1.20 개발 헌법 (STEP 0 5원칙 + 1 추가)

```
┌──────────────────────────────────────────┐
│       OPS BLUEPRINT DEVELOPMENT LAW      │
├──────────────────────────────────────────┤
│                                          │
│ 1. Canvas First                          │
│    Canvas가 항상 제품의 중심이다.          │
│                                          │
│ 2. Data First                            │
│    Node는 그림이 아니라 데이터다.          │
│                                          │
│ 3. Simple First                          │
│    기능보다 사용성을 우선한다.             │
│                                          │
│ 4. MVP Lock                              │
│    V1 범위를 임의로 확대하지 않는다.       │
│                                          │
│ 5. Human Control                         │
│    AI가 프로젝트 범위를 임의로 결정하지    │
│    않는다.                               │
│                                          │
│ 6. Verify Before Next  ← STEP 1 추가    │
│    검증되지 않은 기능 위에 다음 기능을     │
│    쌓지 않는다.                           │
│                                          │
└──────────────────────────────────────────┘
```

---

## 다음 단계

> **STEP 2 — Product UX & Information Architecture**

설계 항목:
- 전체 화면 구조 / Global Navigation
- Dashboard / Workflow List / Workflow Editor
- Sidebar / Canvas / Properties Panel
- Modal / Context Menu
- Empty State / Error State / Loading State
- 반응형 구조
- 페이지별 사용자 행동 / 페이지 간 이동 / URL 구조

> ⚠️ **STEP 2가 끝나야 STEP 3 Technical Architecture를 확정하고,**
> **그 다음에야 Antigravity 첫 Prompt를 작성한다.**
> **현재는 코드를 작성하지 않는다.**

---

*저장 위치: `c:\Dev\ai-operations-os\docs\STEP 1 — OPS Blueprint 서비스 정의서.md`*
