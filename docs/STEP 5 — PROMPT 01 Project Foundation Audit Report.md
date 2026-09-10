# OPS Blueprint V1
# Project Foundation Audit

> **작성일**: 2026-09-08
> **감사자**: Senior Implementation Engineer & Codebase Auditor (Antigravity)
> **프로젝트 위치**: `c:\Dev\ai-operations-os`
> **기준 문서**: STEP 0 ~ STEP 4
> **규약**: AUDIT ONLY (코드/패키지 수정 없음, 수정된 파일 0개)

---

## 1. Executive Summary

### Overall status: **READY WITH CHANGES**

현재 레포지토리는 Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, shadcn/ui 기반의 프로토타입 상태를 갖추고 있습니다. 그러나 STEP 0~4에서 확정된 **Supabase(DB/Auth), Zod, React Hook Form, 테스트 러너(Vitest, Playwright)** 등의 핵심 인프라가 누락되어 있고, 반대로 STEP 3 아키텍처와 충돌하는 **Prisma(미사용), 로컬 파일 기반 영속화(canvas-data.json/fs route)** 및 Windows x64 환경의 **`lightningcss` 바이너리 빌드 이슈**가 잔존해 있어 정식 PHASE 01 진입 전 정리가 필요합니다.

---

## 2. Project Structure

```text
c:\Dev\ai-operations-os/
├── app/
│   ├── api/canvas/route.ts       # [CONFLICT] 로컬 파일(fs) 기반 저장 API
│   ├── canvas/page.tsx           # [PROTOTYPE] 임시 캔버스 화면
│   ├── layout.tsx                # 루트 레이아웃 (lang="ko", sonner Toaster 마운트됨)
│   ├── page.tsx                  # 루트 리다이렉트 (redirect('/canvas'))
│   └── globals.css               # Tailwind CSS v4 + 테마 토큰
├── components/
│   ├── nodes/WorkflowNode.tsx    # 커스텀 React Flow 노드 컴포넌트
│   └── ui/                       # shadcn UI (button, card, dialog, input, textarea 등)
├── docs/                         # STEP 0 ~ STEP 4 설계 명세서 보관
├── lib/
│   ├── prisma.ts                 # [CONFLICT] 스키마 없는 미사용 Prisma 클라이언트
│   ├── utils.ts                  # cn() 유틸리티
│   └── store/useCanvasStore.ts   # Zustand 캔버스 스토어
├── public/                       # 정적 에셋 (기본 svg 삭제 상태)
├── .gitignore
├── components.json               # shadcn 설정
├── eslint.config.mjs             # ESLint 9 플랫 컨피그
├── next.config.ts                # Next.js 설정
├── package.json                  # 패키지 의존성 명세
├── postcss.config.mjs            # PostCSS 설정 (@tailwindcss/postcss)
└── tsconfig.json                 # TypeScript 설정 (target: ES2017, bundler resolution)
```

---

## 3. Technology Audit

| 영역 | 기대 기술 (STEP 3 확정) | 실제 설치 상태 | 상태 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `next@16.3.4` | **PASS** | App Router 활성화 |
| **Language** | TypeScript | `typescript@^5` | **PASS** | `tsconfig.json` 존재 |
| **UI Library** | React 19 + shadcn/ui | `react@19.2.8`, `shadcn@4.21.0` | **PASS** | UI 컴포넌트 7개 탑재 |
| **Styling** | Tailwind CSS v4 | `tailwindcss@^4` | **PASS** | PostCSS 연동 |
| **Canvas Engine**| React Flow | `@xyflow/react@^12.11.6` | **PASS** | 설치 및 동작 확인 |
| **Client State** | Zustand | `zustand@^5.0.15` | **PASS** | `useCanvasStore.ts` 탑재 |
| **Database** | Supabase (PostgreSQL) | 없음 | **MISSING** | `@supabase/supabase-js`, `@supabase/ssr` 누락 |
| **Authentication**| Supabase Auth | 없음 | **MISSING** | 인증 계층 전무 |
| **ORM / Data** | Direct Supabase | `@prisma/client@^7.10.0` | **CONFLICT** | 불필요한 Prisma 잔존 |
| **Validation** | Zod | 없음 | **MISSING** | `zod` 패키지 누락 |
| **Form** | React Hook Form | 없음 | **MISSING** | `react-hook-form` 누락 |
| **Testing** | Vitest + Testing Library | 없음 | **MISSING** | 테스트 환경 미구축 |
| **E2E Testing** | Playwright | 없음 | **MISSING** | E2E 테스트 스위트 미구축 |

---

## 4. Dependency Audit

### 확정 아키텍처 필수 의존성 현황
- `next@16.3.4`: **설치됨 (PASS)**
- `react@19.2.8` / `react-dom@19.2.8`: **설치됨 (PASS)**
- `@xyflow/react@^12.11.6`: **설치됨 (PASS)**
- `zustand@^5.0.15`: **설치됨 (PASS)**
- `sonner@^2.0.8`: **설치됨 (PASS)**
- `lucide-react@^1.41.0`: **설치됨 (PASS)**
- `@supabase/supabase-js`: **미설치 (MISSING)**
- `@supabase/ssr`: **미설치 (MISSING)**
- `zod`: **미설치 (MISSING)**
- `react-hook-form`: **미설치 (MISSING)**
- `vitest`, `@testing-library/react`: **미설치 (MISSING)**

### 아키텍처 외 불필요/충돌 의존성
- `@prisma/client@^7.10.0` & `prisma@^8.0.0-rc.13`: **제거 대상 (CONFLICT)** - Supabase 채택으로 불필요
- `@base-ui/react@^1.8.0`: **검토 필요 (UNNECESSARY)** - shadcn 기본 컴포넌트 외 불필요한 종속성
- `cn@^0.2.6`: **검토 필요 (UNNECESSARY)** - `clsx`와 `tailwind-merge` 기반 유틸로 대체 가능

---

## 5. Configuration Audit

- **Next.js (`next.config.ts`)**: 기본 옵션 상태 (`export default nextConfig;`), Turbopack 구동.
- **TypeScript (`tsconfig.json`)**: `"strict": true`, `"moduleResolution": "bundler"`, paths `@/*` 매핑 정상.
- **Tailwind & PostCSS**: `@tailwindcss/postcss` 및 `@import "tailwindcss";` 정상 선언.
- **ESLint (`eslint.config.mjs`)**: ESLint 9 플랫 설정 정상.
- **shadcn/ui (`components.json`)**: new-york 스타일, `components/ui`, `lib/utils` 경로 정상 매핑.
- **Supabase 설정**: 클라이언트 설정 파일(`lib/supabase/`) 전무.

---

## 6. Environment Variable Audit

- `.env`, `.env.local`, `.env.example`: **존재하지 않음 (MISSING)**
- 비밀 키 노출 여부: **노출 없음 (PASS)**
- 필요 환경변수 (STEP 3 규격):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 7. Existing Code Audit

- **라우트 구조**:
  - `/` (`app/page.tsx`): `/canvas`로 서버 리다이렉트
  - `/canvas` (`app/canvas/page.tsx`): 초기 캔버스 화면 (React Flow + Inspector 패널)
  - `/api/canvas` (`app/api/canvas/route.ts`): `fs/promises`를 이용해 루트 디렉터리의 `canvas-data.json`을 읽고 쓰는 임시 Mock API (Supabase 전환 대상)
- **컴포넌트**:
  - `components/nodes/WorkflowNode.tsx`: 휴지통 삭제 버튼 및 시간/비용 배지가 포함된 커스텀 노드
  - `components/ui/*`: button, card, input, textarea, sheet, dialog, dropdown-menu
- **상태 관리**:
  - `lib/store/useCanvasStore.ts`: 노드 추가/삭제/수정, 겹침 방지 오프셋 알고리즘, 연쇄 삭제 로직 구현됨 (STEP 3의 `stores/editor-store.ts`로의 리팩토링 대상)
- **데이터베이스 연동**:
  - `lib/prisma.ts`: 스키마 없는 빈 PrismaClient 인스턴스 (미사용 상태)

---

## 8. Architecture Conflicts

1. **DB 영속화 방식 충돌**: STEP 3은 **Supabase PostgreSQL**을 영속화 계층으로 명시하였으나, 현재 코드는 `app/api/canvas/route.ts`에서 로컬 `canvas-data.json` 파일에 직접 쓰기를 수행함.
2. **Prisma 잔존**: Supabase 직접 연동(Client/Server Action) 방식과 무관하게 `prisma` 패키지 및 `lib/prisma.ts`가 남아 있음.
3. **스토어 위치 불일치**: STEP 3 권장 위치는 `stores/editor-store.ts`이나 현재 `lib/store/useCanvasStore.ts`에 위치.
4. **빌드 오류 (lightningcss)**: Windows 환경에서 Tailwind v4의 번들러 종속성인 `lightningcss.win32-x64-msvc.node` 바이너리 링크 문제로 `npm run build` 시 Turbopack 빌드 실패 발생 이력 존재.

---

## 9. Technical Risks

1. **`lightningcss` 플랫폼 바이너리 충돌**: Windows x64 환경에서 Next.js Turbopack + Tailwind v4 실행 시 네이티브 바이너리 참조 실패 위험.
2. **Auth & RLS 부재**: 사용자 인증 및 Workspace 격리(Row Level Security)가 전혀 적용되지 않은 로컬 단일 사용자 구조.
3. **인프라 패키지 누락**: Zod, React Hook Form, Supabase 패키지가 누락되어 Phase 02(Auth) 및 Phase 03(CRUD) 진행 불가.

---

## 10. Recommended Actions (Phase 01 진입 전 준비사항)

*(주의: 본 감사 단계에서는 실행하지 않으며 권고안만 제시합니다)*

1. **불필요한 레거시 정리**:
   - `prisma`, `@prisma/client`, `cn`, `@base-ui/react` 의존성 제거
   - `lib/prisma.ts` 파일 삭제
   - 임시 파일 기반 API(`app/api/canvas/route.ts`)를 추후 Server Action으로 대체 준비
2. **필수 의존성 추가**:
   - `@supabase/supabase-js`, `@supabase/ssr`
   - `zod`, `react-hook-form`
   - Vitest 및 Testing Library 환경
3. **환경변수 템플릿 구축**:
   - `.env.example` 및 `.env.local` 생성 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. **Supabase 클라이언트 분리 구조 생성**:
   - `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`

---

## 11. Proposed PHASE 01 Readiness

### **READY FOR PHASE 01 (수정 계획 승인 시)**

현재 기반 코드(Next.js App Router, Tailwind, React Flow, Zustand, shadcn)가 탄탄하게 작동 가능한 수준으로 준비되어 있으므로, 불필요한 패키지(Prisma 등) 정리와 Supabase 및 Zod 환경 설정만 진행하면 즉시 **PHASE 01 (Project Foundation Implementation)**을 성공적으로 완수할 수 있습니다.

---

## 12. Files Modified

본 감사는 감사 전용 규칙(AUDIT ONLY)을 철저히 준수하여 코드를 전혀 변경하지 않았습니다.

> **Files modified: 0**

---

## 13. Verification

- Repository inspection: **PASS**
- Architecture comparison: **PASS**
- Configuration inspection: **PASS**
- Secret exposure check: **PASS (비밀값 노출 0건)**

---

*보고서 저장 위치: `c:\Dev\ai-operations-os\docs\STEP 5 — PROMPT 01 Project Foundation Audit Report.md`*
