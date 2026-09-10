# OPS Blueprint V1 — Production Rollback Runbook

> **기준일자**: 2026-09-10  
> **목적**: 프로덕션 배포 후 예상치 못한 장애 발생 시 1분 이내에 안전한 직전 버전으로 복원하는 실행 매뉴얼  

---

## 1. 롤백 기준 대상 (Rollback Targets)

- **공식 안정 태그**: `v1.0.0-rc1`
- **공식 안정 커밋**: `7ca6c9d` (OPS Blueprint V1 Release Candidate Baseline)
- **Vercel 안정 배포**: 직전 빌드 성공 스냅샷

---

## 2. 긴급 롤백 2대 실행 방법

### 방법 A: Vercel 대시보드 원클릭 즉시 롤백 (가장 빠름, 약 5초 소요)
1. [Vercel Dashboard](https://vercel.com) 접속
2. `ai-operations-os` 프로젝트 선택 > **Deployments** 탭 이동
3. 정상 동작했던 직전 배포 항목 우측의 점 세 개(`...`) 클릭
4. **`Promote to Production`** 선택
5. 즉시 프로덕션 트래픽이 이전 안정 버전으로 전환됨

### 방법 B: Git 기반 롤백 배포 (코드 베이스 동기화)
1. 로컬 저장소에서 안정 태그로 롤백 브랜치 생성:
   ```bash
   git checkout -b rollback-v1.0.0-rc1 v1.0.0-rc1
   git push origin rollback-v1.0.0-rc1
   ```
2. Vercel에서 `rollback-v1.0.0-rc1` 브랜치를 프로덕션으로 지정하거나,
   `master` 브랜치에 revert 커밋 후 푸시:
   ```bash
   git revert HEAD
   git push origin master
   ```

---

## 3. 롤백 후 필수 사후 점검 리스트
- [ ] `https://ai-operations-os.vercel.app/login` 정상 접근 확인
- [ ] 대시보드 및 기존 워크플로우 데이터 표시 확인
- [ ] Supabase Auth 세션 정상 동작 확인
- [ ] 브라우저 콘솔 에러 및 Vercel Function 에러 로그 0건 확인
