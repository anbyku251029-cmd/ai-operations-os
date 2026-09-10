# OPS Blueprint V1

# STEP 5 — PROMPT 13: PHASE 11 Structure Panel Multi-Section Hierarchy & Canvas Sync 구현 보고서

> **작성일**: 2026-09-09
> **작성자**: Senior Full-Stack Engineer / UX Architecture Specialist (Antigravity)
> **프로젝트**: `c:\Dev\ai-operations-os`
> **기준 문서**: STEP 0 ~ STEP 5, PROMPT #11 Planning & Audit, LOCK 01 ~ LOCK 05
> **결과 상태**: **PHASE 11 PASS (100% 정상 구현 및 전체 테스트/빌드 통과)**

---

## 1. 개요 및 목적

PHASE 11의 목적은 좌측 `StructurePanel`을 단순 단일 스텝 목록에서 **다중 섹션(Multi-Section) 아코디언 계층 구조**로 업그레이드하고, 섹션 내 스텝 클릭 시 캔버스 뷰포트가 해당 노드로 부드럽게 이동(Pan & Center)하는 **Step-to-Canvas Viewport 동기화**를 구현하는 것입니다.

특히 데이터 무결성을 위해 섹션 삭제 시 속해 있던 노드들이 고아(Orphan)가 되지 않고 안전하게 남아있는 섹션으로 재할당되는 **Orphan Node 방지 정책(LOCK 02)**과 저장 진행 중 뒤로가기 가드(LOCK 04)를 완벽히 구축했습니다.

---

## 2. 핵심 구현 내용

### 2.1 [LOCK 01] Multi-Section 데이터 모델 및 상태 관리 (`useEditorStore.ts`)
- **타입 정의 (`features/editor/types/section.ts`)**:
  - `EditorSection`: `{ id, name, position, isCollapsed?: boolean }`
  - `DEFAULT_INITIAL_SECTIONS`: 기본 1개 이상의 섹션 유지
- **스토어 상태 및 액션**:
  - `sections: EditorSection[]`
  - `addSection(name?: string)`: 신규 섹션 생성 및 정렬 인덱스 부여
  - `updateSection(id: string, name: string)`: 섹션명 인라인 수정
  - `deleteSection(id: string)`: 최소 1개 섹션 유지 가드 및 하위 노드 재할당
  - `toggleSectionCollapse(id: string)`: 섹션별 아코디언 접힘/펼침 토글
- **노드 모델 연동 (`WorkflowNodeData`)**:
  - `sectionId?: string | null` 필드 추가
  - `addNode(name, position, sectionId)`: 특정 섹션을 지정하여 스텝 추가 가능하도록 확장
- **Undo / Redo 인메모리 스냅샷 연동**:
  - `EditorHistorySnapshot`에 `sections: EditorSection[]` 포함
  - 섹션 추가, 삭제, 이름 수정 시에도 Undo/Redo 이력 완벽 보존

### 2.2 [LOCK 02] 섹션 삭제 시 고아 노드 방지 안전망 (Safe Node Reallocation)
- 섹션이 삭제될 때 삭제되는 섹션에 속해 있던 모든 노드를 남아있는 첫 번째 섹션(`remainingSections[0].id`)으로 즉시 안전하게 재할당
- 섹션이 1개만 남아있을 경우 삭제 동작을 원천 차단하여 최소 1개의 섹션이 항상 보장되도록 방어

### 2.3 [LOCK 03] Structure Panel 계층 UI & Step-to-Canvas 동기화
- **`StructurePanel.tsx`**:
  - 다중 섹션 아코디언 렌더링
  - 섹션별 스텝 개수 배지 표시
  - 섹션 헤더 인라인 이름 변경 (Pencil 버튼 및 Enter/Esc 키보드 조작 지원)
  - 섹션별 직접 스텝 추가 (`+` 버튼)
  - 스텝 클릭 시 `setSelectedNodeId(node.id)` 즉시 트리거
- **`CanvasPanel.tsx` (`CanvasFocusController`)**:
  - `@xyflow/react`의 `useReactFlow()` 기반으로 `CanvasFocusController` 컴포넌트 탑재
  - `selectedNodeId` 변경 감지 시 대상 노드의 좌표 중심(Width 220, Height 100 기준 중앙)을 계산하여 캔버스 뷰포트를 부드럽게 Pan & Center (`setCenter(centerX, centerY, { duration: 400 })`)
  - 단위 테스트 및 목킹 환경에서도 에러 없이 우아하게 동작하도록 방어 처리

### 2.4 [LOCK 04] 저장 중 뒤로가기 가드 & 네비게이션 제어
- `EditorHeader.tsx`: `saveStatus === 'saving'` 상태일 때 "목록으로" 및 뒤로가기 버튼 비활성화 (`disabled={saveStatus === 'saving'}`)하여 데이터 경합 및 레이스 컨디션 차단

### 2.5 Supabase DB 영속성 매퍼 동기화 (`workflow-mapper.ts`, `workflow-repository.ts`)
- `workflow-types.ts`: `DbSection`, `EditorWorkflowSnapshot.sections` 정의
- `workflow-mapper.ts`:
  - `mapEditorToDbSections`: `EditorSection[]` → `DbSection[]` 매핑
  - `mapDbSectionsToEditor`: `DbSection[]` → `EditorSection[]` 역매핑
  - `mapDbNodesToEditor` / `mapEditorToDbNodes`: `section_id` ↔ `data.sectionId` 양방향 매핑
  - `mapSnapshotToDbPayload`: Supabase 저장 페이로드에 `sections` 배열 반영
- `workflow-repository.ts`: Supabase DB에 sections upsert/delete 동기화 및 목업 캐시 갱신

---

## 3. 검증 결과

| 검증 항목 | 수행 명령 / 테스트 파일 | 결과 | 상세 내용 |
|---|---|---|---|
| **TypeScript 정적 검사** | `npx tsc --noEmit` | **PASS (0 errors)** | 전체 프로젝트 타입 컴파일 에러 0건 |
| **Section 계층 단위 테스트** | `tests/editor-sections.test.tsx` | **PASS (12/12)** | 섹션 CRUD, 노드 재할당, Undo/Redo, StructurePanel, DB 매퍼 전체 통과 |
| **UX 상태 & 가드 테스트** | `tests/editor-ux-states.test.tsx` | **PASS (15/15)** | 미저장 변경 모달, 자동 저장 상태, 뒤로가기 차단 검증 통과 |
| **Undo / Redo 테스트** | `tests/editor-history.test.ts` | **PASS (20/20)** | 인메모리 히스토리 스택 검증 통과 |
| **Editor Shell 통합 테스트** | `tests/editor-shell.test.tsx` | **PASS (11/11)** | 3-패널 레이아웃 및 패널 토글 검증 통과 |
| **Next.js 프로덕션 빌드** | `npm run build` | **PASS (Exit Code 0)** | 11개 경로 최적화 및 정적/동적 렌더링 검증 완료 |

---

## 4. 변경된 파일 목록

- `features/editor/types/section.ts` [신규]
- `features/editor/types/editor.ts` [수정]
- `stores/useEditorStore.ts` [수정]
- `features/editor/components/StructurePanel.tsx` [수정]
- `features/editor/components/CanvasPanel.tsx` [수정]
- `features/editor/components/EditorHeader.tsx` [수정]
- `features/editor/components/WorkflowEditor.tsx` [수정]
- `app/workflows/[workflowId]/page.tsx` [수정]
- `lib/persistence/workflow-types.ts` [수정]
- `lib/persistence/workflow-mapper.ts` [수정]
- `lib/persistence/workflow-repository.ts` [수정]
- `tests/editor-sections.test.tsx` [신규]
- `tests/editor-ux-states.test.tsx` [수정]
- `docs/STEP 5 — PROMPT 13 Phase 11 Sections Implementation Report.md` [신규]

---

## 5. 결론 및 다음 단계 제안

PHASE 11 요구사항인 **다중 섹션 계층 구조 지원, 고아 노드 방지 안전망, Step-to-Canvas 뷰포트 동기화, 영속성 동기화**가 단 한 건의 타입 에러나 리그레션 없이 완벽하게 구현되었습니다.

다음 단계로는 **PHASE 12 (템플릿 라이브러리 연동 및 워크플로우 복제/내보내기)** 또는 **PHASE 13 (전체 통합 회귀 검증 및 E2E 테스트)**를 진행할 준비가 완료되었습니다.
