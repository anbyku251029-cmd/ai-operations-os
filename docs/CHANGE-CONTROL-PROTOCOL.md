# OPS Blueprint V1 — Change Control Protocol (CCP)

> **제정일**: 2026-09-10  
> **목적**: 프로덕션 운영 중 발생하는 모든 수정, 개선, 기능 요청에 대한 13단계 엄격한 변경 통제 규정  

---

## 1. 13단계 변경 통제 워크플로우

```text
1. User Intent 확인 (사용자가 요구하는 정확한 문제와 목표 파악)
        ↓
2. Change Boundary 정의 (수정 대상 파일 및 영향 범위 최소화)
        ↓
3. Production Impact 평가 (가용성, 하위호환성, 보안 영향 분석)
        ↓
4. Pre-change State 기록 (변경 전 Git 커밋 및 테스트 상태 스냅샷)
        ↓
5. 변경 작업 수행 (최소 단위 코드 변경 적용)
        ↓
6. Actual Diff 검사 (git diff를 통해 불필요한 변경 포함 여부 전수 검사)
        ↓
7. Risk Assessment (부수 효과 및 회귀 가능성 재평가)
        ↓
8. Regression Test (162개 테스트, tsc, 빌드 100% 통과 확인)
        ↓
9. Staging / Preview 검증 (로컬 또는 프리뷰 환경에서 실제 동작 확인)
        ↓
10. Human Approval (사용자에게 변경 내역 및 리스크 제시 후 명시적 승인 획득)
        ↓
11. Production Deploy (승인된 코드만 프로덕션 배포 파이프라인 트리거)
        ↓
12. Production Smoke Test (실서버 엔드포인트 정상 응답 검증)
        ↓
13. Decision Ledger 작성 (문서 폴더에 변경 사유, 내용, 결과 영구 보존)
```

---

## 2. 범위 확장(Scope Expansion) 감지 및 방어 프로토콜

요청받은 단일 작업 외에 추가 파일 수정이 불가피한 경우, AI는 임의로 작업을 확장하지 않고 즉시 아래 형식으로 인간 관리자에게 승인을 요청해야 합니다:

```text
================================================================================
SCOPE EXPANSION DETECTED
================================================================================
요청 작업: [예: NodePropertiesForm 버그 수정]
원래 대상: features/editor/components/NodePropertiesForm.tsx
추가 필요 파일:
1. stores/useEditorStore.ts (상태 인터페이스 확장)
2. lib/persistence/workflow-mapper.ts (매퍼 정제)
사유: 노드 속성 업데이트 시 스토어 계약과의 정합성 유지 필요
예상 영향: 에디터 속성 바인딩 및 히스토리 스택에 영향
조치: 사용자 승인 전까지 추가 파일 수정 일체 보류
================================================================================
```
