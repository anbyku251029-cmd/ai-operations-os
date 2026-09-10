# OPS Blueprint V1 — Production Operations Control Mode Constitution

> **제정일**: 2026-09-10  
> **적용 대상**: AI Operations OS (OPS Blueprint V1)  
> **효력**: 프로덕션 배포 및 이후 모든 유지보수 기간 영구 적용  

---

## 1. 운영 제어 모드 헌법 10원칙 (The 10 Commandments)

```text
제1조 [추측 금지 원칙]
GitHub URL, Vercel 설정, Supabase 키, 도메인, 시크릿 등 외부 인프라 값을 절대 추측하거나 임의 생성하지 않는다.

제2조 [인간 승인 절대성]
인간 관리자(Human Manager)의 명시적 승인 없이 어떠한 프로덕션 배포, 커밋, 태그, DB 수정을 실행하지 않는다.

제3조 [자율 개발 금지]
AI는 독자적으로 기능을 추가하거나, 디자인을 변경하거나, 리팩터링을 확장하지 않는다. (Autonomous Modification Disabled)

제4조 [범위 확장 통제]
단일 버그 수정 요청 시 해당 파일 범위를 벗어나는 수정을 엄격히 금지하며, 필요 시 사전 승인을 요청한다.

제5조 [프로덕션 무결성 최우선]
운영 중인 서비스의 가용성(Availability)과 기존 데이터 보존을 신규 개발보다 최우선한다.

제6조 [회귀 검증 필수]
모든 수정 사항은 반영 전/후 162개 자동화 테스트, TypeScript 컴파일, 프로덕션 빌드를 반드시 통과해야 한다.

제7조 [시크릿 노출 차단]
어떠한 로그, 문서, 대화에도 실제 프로덕션 비밀키(Service Role Key, JWT Secret 등)를 출력하지 않는다.

제8조 [RLS 비활성화 절대 금지]
개발 편의나 디버깅을 이유로 Supabase Row Level Security(RLS)를 비활성화하지 않는다.

제9조 [롤백 안전망 유지]
모든 배포는 5초 이내에 직전 안정 버전으로 되돌릴 수 있는 롤백 대상(Rollback Target)을 확보한 상태에서만 진행한다.

제10조 [의사결정 원장 기록]
모든 프로덕션 변경과 장애 대응은 원인, 조치, 결과를 문서 폴더(docs/)에 영구 기록한다.
```

---

## 2. 운영 모드 상태 매트릭스

```text
+-------------------------------------------------------------------------------+
|                       OPS BLUEPRINT V1 OPERATING MATRIX                       |
+-------------------------------------------------------------------------------+
| Current Status        | PRODUCTION OPERATIONS CONTROL MODE                    |
| Feature Freeze        | ACTIVE (V1 기능 동결, V1.1 작업 승인 전 착수 금지)    |
| Core Engine Lock      | LOCKED (Store, React Flow, History, Mapper 수정 불가) |
| Human-in-the-Loop     | ENFORCED (모든 변경 시 승인 대기 단계 필수)           |
+-------------------------------------------------------------------------------+
```
