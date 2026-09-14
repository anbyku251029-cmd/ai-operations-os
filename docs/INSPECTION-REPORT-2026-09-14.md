# OPS Blueprint — Weekly Baseline Inspection Report

> **보고 일시**: 2026년 9월 14일  
> **점검 대상**: `C:\Dev\ai-operations-os`  
> **버전 기준선**: `v1.0.0` (Commit: `1a66039`)  
> **저장소**: `https://github.com/anbyku251029-cmd/ai-operations-os.git`  
> **책임 엔지니어**: Principal Software Architect, Senior Full-Stack Engineer, QA Engineer, SRE  
> **원칙 준수**: 인간 승인 기반 통제 개발 (Human-Controlled Development) — 무단 코드 수정 없음

---

## 1. Actual Repository Structure Verification

역사적 보고서의 가정이 아닌, 실제 파일 시스템 검사 결과입니다:
- **`src/` 디렉터리**: 존재하지 않음 (본 프로젝트는 루트 기반 App Router 구조 채택)
- **`app/`**: Next.js 16.3.4 App Router (`api/`, `canvas/`, `dashboard/`, `login/`, `signup/`, `workflows/`)
- **`components/`**: UI 및 공통 컴포넌트 (`layout/`, `nodes/`, `ui/`)
- **`features/`**: 도메인 모듈 (`auth/`, `dashboard/`, `editor/`, `workflow/`)
- **`stores/`**: Zustand 기반 글로벌 에디터 스토어 (`useEditorStore.ts`)
- **`lib/`**: 유틸리티, Supabase 클라이언트/서버/미들웨어, 영속성 계층 (`persistence/`, `store/`, `supabase/`, `utils.ts`)
- **`supabase/`**: 데이터베이스 마이그레이션 (`migrations/01_workspaces_workflows.sql`, `02_editor_persistence.sql`)
- **`docs/`**: 운영 표준 가이드 및 단계별 보고서 (총 37개 문서)
- **`tests/`**: 단위, 컴포넌트, E2E 회귀 테스트 스위트 (총 18개 테스트 파일)
- **설정 파일**: `vitest.config.mjs`, `next.config.ts`, `package.json`, `.npmrc` (legacy-peer-deps=true), `proxy.ts` (Next.js 16 프록시)
- **환경 변수**: `.env.example` 존재, `.env.local` 미존재

---

## 2. Section A — Baseline Verification Results

```
+-------------------------------------------------------------------------------+
|                       BASELINE STATUS MATRIX (2026-09-14)                     |
+-------------------------------------------------------------------------------+
| 1. Current Commit    | 1a66039 (docs: add full program review report 2026-09-11)|
| 2. Current Branch    | master (Tracking origin/master, fully up-to-date)      |
| 3. Working Tree      | Clean (신규 검토 보고서 1건 제외 변경사항 없음)         |
| 4. TypeScript (tsc)  | npx tsc --noEmit -> 0 errors (100% 무결성 PASS)        |
| 5. Next.js Build     | Exit Code 0 -> 11개 라우트 전원 프로덕션 빌드 성공       |
| 6. Vitest Test Suite | 7개 파일(65개 테스트) PASS / 11개 파일 Worker Timeout    |
+-------------------------------------------------------------------------------+
```

### 상세 검증 내역
1. **Git 형상**:
   - `master` 브랜치는 `origin/master`와 커밋 해시 `1a66039`로 정확히 일치함.
2. **TypeScript 정적 타입 무결성 (`npx tsc --noEmit`)**:
   - 에러 0건 (Exit Code 0). 엄격 모드 계약 완전 준수.
3. **Next.js 프로덕션 최적화 빌드 (`npm run build`)**:
   - Next.js 16.3.4 (Turbopack) 정상 컴파일 완료 (Exit Code 0).
   - 생성 라우트: `○ /`, `○ /_not-found`, `ƒ /api/canvas`, `○ /canvas`, `ƒ /dashboard`, `○ /login`, `○ /signup`, `ƒ /workflows`, `ƒ /workflows/[workflowId]`, `ƒ /workflows/new`, `ƒ Proxy (Middleware)`.
4. **테스트 스위트 런타임 결과 (`npm run test -- --run`)**:
   - **통과 스위트 (7개 파일, 65개 테스트 PASS)**:
     - `auth.test.ts`, `workflow-crud.test.ts`, `editor-history.test.ts`, `workflow-persistence.test.ts`, `workflow-security.test.ts`, `smoke.test.ts` 등 주요 유닛/스토리지 로직 통과.
   - **비정상 종료 스위트 (11개 파일)**:
     - Windows 환경의 `vitest-pool` 워커 생성 시 `Timeout waiting for worker to respond` unhandled error 발생.
     - 테스트 코드 assertion 오류가 아니라, Windows 환경에서의 jsdom 포크 워커 기동 지연에 따른 타임아웃 현상임.

---

## 3. Section B — Production Environment Audit

1. **실제 라이브 배포 상태 (`https://ai-operations-os.vercel.app`)**:
   - **[CRITICAL DISCOVERY]**: 라이브 URL 직접 HTTP Fetch 검증 결과, 현재 배포되어 있는 웹페이지는 최신 V1 OPS Blueprint 코드가 아닌 **과거 정적 데모 사이트("Free demo MVP", /app, /trial)**로 확인되었습니다.
   - 즉, 원격 Git 저장소(`master`)에는 최신 코드가 푸시되어 있으나, Vercel 상에서 최신 커밋이 프로덕션으로 빌드/배포되어 있지 않거나 프로젝트 루트/브랜치 연결 설정 점검이 필요합니다.
2. **실제 환경 구성 상태**:
   - 로컬 환경에 `.env.local`이 구성되어 있지 않아, 브라우저 클라이언트 컴포넌트(`createClient()`) 실행 시 예외(`throw new Error`)가 발생할 수 있습니다.
   - Vercel 프로젝트 대시보드의 환경 변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) 주입 상태 확인이 선행되어야 합니다.
3. **인증(Auth) 및 세션 상태**:
   - `proxy.ts` -> `lib/supabase/middleware.ts`(`updateSession`)를 통한 보호 라우트(`/dashboard`, `/workflows`) 차단 및 리다이렉트 로직은 구현되어 있으나, 실제 Supabase 라이브 인스턴스와의 E2E 세션 교환은 환경 변수 바인딩 후 확인 가능합니다.
4. **데이터베이스 연결 상태**:
   - 현재 Supabase 미연결 시 `global.__mockEditorData`로 폴백하도록 구성되어 있어 UI 프로토타입은 작동하나, 실제 PostgreSQL RLS 및 지속 저장은 라이브 DB 연결이 필수적입니다.

---

## 4. Section C — Comprehensive Risk Analysis

### P0 Issues (즉시 차단 및 해결 필요)
1. **프로덕션 라이브 사이트 불일치**:
   - `https://ai-operations-os.vercel.app`에 최신 V1.0.0 애플리케이션이 활성화되지 않고 구형 데모가 서빙되고 있음.

### P1 Issues (기능 및 품질 위협)
1. **Windows 환경 Vitest Worker Timeout**:
   - 18개 스위트 중 11개가 워커 생성 타임아웃으로 실행되지 못하여, 로컬 환경에서 100% 자동화 회귀 검증을 즉시 통과하지 못함.
2. **에디터 진입 시 잔존 상태 오염 위험 (Dirty Store State)**:
   - `app/workflows/[workflowId]/page.tsx`에서 신규 워크플로우 또는 다른 워크플로우 진입 시 `resetEditor()`를 선행 호출하지 않아, 이전 편집하던 워크플로우의 노드/섹션 데이터가 남아있을 위험 존재.
3. **저장 결과 Silent Fallback에 따른 착시 위험**:
   - `lib/persistence/workflow-repository.ts`에서 Supabase 저장이 실패했을 때 인메모리 `__mockEditorData`에 저장하고 `{ success: true }`를 반환함. 사용자는 클라우드 DB에 정상 저장된 것으로 오인할 수 있음.

### P2 Issues (안정성 및 구조적 개선 필요)
1. **스냅샷 저장 시 트랜잭션 원자성 결여**:
   - `saveWorkflowSnapshot`이 단일 DB 트랜잭션이 아닌 5단계 순차 REST 호출(섹션 정리 -> 엣지 전체 삭제 -> 노드 삭제 -> 노드 업서트 -> 엣지 삽입)로 수행됨. 중간 네트워크 실패 시 엣지가 유실될 위험.
2. **PostgREST IN 필터 쿼리 포맷 검증**:
   - `.not('id', 'in', `(${currentSectionIds.join(',')})`)` 문법의 실제 Supabase REST 엔진 호환성 검증 필요.

### Suspected Loop Paths & Verification
- **useEffect 의존성 루프**: 없음. `fetchBundle`은 `workflowId` 기준으로 안정적이며 재시도 횟수 제어됨.
- **Zustand 히스토리 루프**: 없음. `isInternalHistoryAction` 플래그로 undo/redo 시 재진입 차단 완비.
- **React Flow 이벤트 루프**: 없음. 중복 연결 및 self-loop 방어 로직 완비.

---

## 5. Section D — Targeted Change Proposals (인간 승인 요청용)

> **[ABSOLUTE CONTROL RULE]**  
> 아래 제안 사항은 인간 관리자의 명시적 승인이 떨어지기 전까지 단 한 줄의 코드도 수정하지 않고 대기합니다.

### [Proposal 1] Vitest Windows 환경 워커 타임아웃 해결
- **대상 파일**: `vitest.config.mjs`
- **현재 동작**: 기본 forks pool로 다수 파일 실행 시 Windows 프로세스 스폰 지연으로 60초 타임아웃 발생.
- **문제점**: 18개 테스트 중 11개가 실행되지 못하고 Unhandled Error 발생.
- **제안 해결책**: `poolOptions: { threads: { singleThread: true } }` 또는 `maxConcurrency: 1` 및 `testTimeout: 30000` 설정 조정.
- **필요성**: CI 및 로컬에서 162개 전체 테스트의 실시간 실행 및 통과 증거 확보.
- **위험도**: Low (설정 파일에만 국한).
- **회귀 검증**: `npm run test -- --run` 실행 후 18개 파일 전수 통과 확인.
- **작업 범위**: `vitest.config.mjs` 단 1개 파일.

### [Proposal 2] 워크플로우 상세 페이지 진입 시 스토어 초기화 가드 추가
- **대상 파일**: `app/workflows/[workflowId]/page.tsx`
- **현재 동작**: 이전 워크플로우가 로드되어 있는 상태에서 다른 워크플로우 ID로 이동 시 스토어를 리셋하지 않고 주입 시도.
- **문제점**: 대상 워크플로우가 비어있거나 로딩 실패 시 이전 워크플로우의 노드가 화면에 잔존할 위험.
- **제안 해결책**: `fetchBundle` 시작 시 또는 언마운트 시 `resetEditor()`를 명시적으로 호출.
- **필요성**: 워크플로우 간 데이터 격리 및 사용자 오작동 방지.
- **위험도**: Low.
- **회귀 검증**: `editor-shell.test.tsx`, `editor-ux-states.test.tsx`.
- **작업 범위**: `app/workflows/[workflowId]/page.tsx` 단 1개 파일.

### [Proposal 3] 영속성 저장 시 Silent Fallback 제거 및 명시적 에러 반환
- **대상 파일**: `lib/persistence/workflow-repository.ts`
- **현재 동작**: Supabase DB 저장 실패 시 `__mockEditorData`에 넣고 `success: true` 반환.
- **문제점**: 실제 클라우드 저장이 실패했음에도 사용자 UI에는 "성공적으로 저장되었습니다"로 표시되어 데이터 영구 유실 위험.
- **제안 해결책**: 실제 Supabase 에러 발생 시 명확하게 `{ success: false, error: ... }`를 반환하고 토스트로 알림. (Mock 데이터는 테스트 환경 변수 `NODE_ENV === 'test'`일 때만 허용)
- **필요성**: 프로덕션 데이터 무결성 보장.
- **위험도**: Medium.
- **회귀 검증**: `workflow-persistence.test.ts`.
- **작업 범위**: `lib/persistence/workflow-repository.ts` 단 1개 파일.

---

## 6. Next Steps & Human Decision Required

본 엔지니어는 절대 통제 규칙(Absolute Control Rules)에 따라 임의의 코드 수정을 일체 진행하지 않았습니다.

**관리자 결정 필요 사항**:
1. **Workstream 선택 및 승인**:
   - [ ] Workstream A (프로덕션 배포 및 Vercel 상태 동기화 점검)
   - [ ] Workstream C (Proposal 1, 2, 3 코드 변경 승인 및 안정성 오딧)
   - [ ] Workstream B (합성 행정 워크플로우 수용성 검증)
2. **Proposal 승인 여부**:
   - Proposal 1 (Vitest 설정 최적화) 승인 여부
   - Proposal 2 (에디터 진입 스토어 리셋) 승인 여부
   - Proposal 3 (영속성 Silent Fallback 제거) 승인 여부
