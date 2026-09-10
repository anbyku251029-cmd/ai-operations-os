# OPS Blueprint V1 — Production Baseline Specification

> **기준일자**: 2026-09-10  
> **제품명**: AI Operations OS (OPS Blueprint V1)  
> **공식 기준 커밋**: `7ca6c9d`  
> **공식 릴리스 태그**: `v1.0.0-rc1`  
> **프레임워크**: Next.js 16.3.4 (App Router, Turbopack, Proxy Convention)  
> **상태 관리**: Zustand 5.0.15 (In-Memory 50-Step History Engine)  
> **인증 및 DB**: Supabase SSR + PostgreSQL with Row Level Security (RLS)  
> **다이어그램 엔진**: `@xyflow/react` 12.11.6  

---

## 1. 아키텍처 및 라우트 스펙 (11개 라우트)

```text
Route (app)
┌ ○ /                              # 메인 진입점 (인증 상태 기반 리다이렉트)
├ ○ /_not-found                    # 404 안내 페이지
├ ƒ /api/canvas                    # 로컬 캔버스 호환 엔드포인트
├ ○ /canvas                        # 레거시 캔버스 프로토타입
├ ƒ /dashboard                     # 워크스페이스 대시보드 (통계 및 빠른 생성)
├ ○ /login                         # Supabase 로그인 폼
├ ○ /signup                        # Supabase 회원가입 폼 (Zod 스키마 검증)
├ ƒ /workflows                     # 워크플로우 목록 관리 (CRUD 테이블)
├ ƒ /workflows/[workflowId]        # 3단 반응형 워크플로우 캔버스 에디터 엔진
└ ƒ /workflows/new                 # 신규 워크플로우 생성 폼

ƒ Proxy (Middleware)               # Next.js 16 글로벌 세션 갱신 및 라우트 가드
```

---

## 2. 3단 반응형 에디터 엔진 레이아웃 규약

1. **Header (Top)**:
   - 뒤로가기 버튼 (`isDirty` 감지 기반 `UnsavedChangesModal` 가드)
   - 워크플로우 명칭 인라인 편집
   - 4단계 저장 상태 머신 (`saved` ↔ `unsaved` ↔ `saving` ↔ `error`)
   - 50단계 Undo/Redo 단축키 지원 (`Ctrl+Z`, `Ctrl+Shift+Z`)
2. **StructurePanel (Left, 220px)**:
   - 섹션 및 스텝 계층 트리 구조 아웃라인
   - 섹션 추가, 이름 수정, 접기/펼치기
   - 스텝 클릭 시 캔버스 뷰포트 자동 이동(Pan & Focus)
3. **CanvasPanel (Center, Flex)**:
   - React Flow 기반 무한 캔버스
   - 미니맵, 줌 인/아웃, 점선 그리드 배경
   - 노드 드래그 배치, 단일/다중 노드 선택
   - 핸들 간 방향성 엣지 연결 (Self-loop 및 중복 엣지 100% 차단)
4. **PropertiesPanel (Right, 300px)**:
   - 선택된 노드의 메타데이터(이름, 담당자, 역할, 도구, 소요 시간, 비용, 설명) 실시간 편집
   - Zod 스키마 기반 유효성 검증 및 에디터 스토어 양방향 동기화

---

## 3. 데이터베이스 및 영속성 무결성 규약

- **Workspaces Table**: 사용자 계정별 테넌트 격리 (`owner_id = auth.uid()`)
- **Workflows Table**: 워크스페이스 종속 워크플로우 엔티티
- **Sections Table**: 업무 단계 그룹화 컨테이너 (위치, 접힘 상태, 테마 색상)
- **Nodes Table**: 개별 업무 단위 (이름, 설명, 소요 시간, 비용, x/y 좌표)
- **Edges Table**: 단계 간 방향성 연결선 (소스 노드, 타깃 노드, 핸들)
- **무결성 보장**: 섹션 삭제 시 소속 노드 안전 재할당, 노드 삭제 시 종속 엣지 자동 연쇄 삭제(Cascade Delete).

---

## 4. 품질 및 안정성 베이스라인 지표

- **Vitest 자동화 회귀 테스트**: **18개 스위트 / 162개 테스트 100% PASS**
- **TypeScript 정적 검증**: **0 errors (Strict Mode)**
- **Next.js 프로덕션 빌드**: **Exit Code 0 (Turbopack, 빌드 경고 0건)**
- **E2E 전체 여정**: **STEP 01 ~ STEP 36 전수 통과 (359ms)**
- **런타임 위험도**: **Infinite Loop / Hang / Memory Leak 일체 없음 (SAFE)**
