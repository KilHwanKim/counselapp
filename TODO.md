# counselapp TODO

> 마지막 정리: 2026-05-19  
> 상담 관리자 센터 — 학생 · 반복 수업 · 실제 수업 · 일지 · Vercel Cron

---

## 현재 상태 요약

| 영역 | 상태 |
|------|------|
| 학생 CRUD | 완료 (`students.html`, `/api/students`) |
| 반복 수업 등록·색상 | 완료 (`lessons.html`, `/api/lessons`) |
| 월별 실제 수업·취소/복구·일괄 처리 | 완료 (`index.html`, `/api/actual-lessons`) |
| 공휴일 표시 | 완료 (`/api/holidays`) |
| 일지 DB·API·조회 페이지 | 대부분 완료 (`lesson_journals`, `journals.html`) |
| 캘린더 일지 모달 → DB 저장 | 구현됨 (UI 문구·localStorage 잔여 정리 필요) |
| Vercel 월간 actual_lessons 동기화 | 코드 완료 — **프로덕션 검증 필요** |
| 보강 등록 (정기 외 추가 수업) | **미구현** (설계만 `TODO_JOURNAL_MAKEUP.md`) |
| 첨부파일 | UI만 있음 |
| 문자 발송·통계 | 사이드바 placeholder |

**작업 트리 참고:** `api/actual-lessons.js`, `index.html`, `js/sidebar.js`, `server.js`, `vercel.json`이 modified로 표시될 수 있음. 실질 diff 없으면 줄바꿈(CRLF) 차이일 수 있으니 커밋 전 `git diff` 확인.

**레거시 문서:** `TODO_HANDOFF.md`는 “변경 되돌림” 기준이라 **현재 코드와 불일치**할 수 있음. 이 파일(`TODO.md`)을 기준으로 작업.

---

## A. 운영 · 배포 (Vercel Cron)

최근 커밋: 매월 1일 UTC에 **다음 달** `actual_lessons` 생성 (`/api/cron/sync-actual-lessons`).

- [ ] Vercel Environment Variables 확인
  - [ ] `POSTGRES_URL` 또는 `DATABASE_URL`
  - [ ] `CRON_SECRET`
- [ ] Vercel **Settings → Cron Jobs**에 경로·스케줄 등록 확인
  - 경로: `/api/cron/sync-actual-lessons`
  - 스케줄: `0 0 1 * *` (`vercel.json`)
- [ ] 수동 호출 테스트
  ```bash
  curl -s "https://<프로젝트>.vercel.app/api/cron/sync-actual-lessons" \
    -H "Authorization: Bearer <CRON_SECRET>"
  ```
  - [ ] 응답 `{"ok":true,"year":...,"month":...,"inserted":...}` 확인
  - [ ] `401` → `CRON_SECRET` 불일치 / 미설정
  - [ ] `503` → DB URL 등 환경 변수 문제
- [ ] Vercel **Logs**에서 `GET /api/cron/sync-actual-lessons` 200 기록 확인
- [ ] (선택) 한국 시간 기준 실행 시각에 맞게 `vercel.json` `schedule` 조정 (Cron은 UTC)
- [ ] (선택) 생성 규칙 재확인: “다음 달만” vs “당월+익월” 등

**관련 파일**

- `api/cron/sync-actual-lessons.js`
- `api/actual-lessons.js` (`syncActualLessonsForMonth`)
- `vercel.json`
- `server.js` (로컬 동일 경로)

---

## B. 일지 기능 — 마무리 · 정리

### B-1. DB · API

- [ ] dev / 프로덕션 DB에 일지 DDL 적용 여부 확인
  - [ ] `sql/009_lesson_journals.sql`
  - [ ] `sql/010_lesson_journals_add_missing_columns.sql` (기존 테이블 보강 시)
- [ ] `/api/lesson-journals` GET · POST · DELETE 동작 확인
- [ ] `/api/actual-lessons` 월 조회 시 `journal_exists`, `journal` join 반영 확인

### B-2. UI · UX

- [ ] `index.html` 캘린더 → 일지 모달: 작성 · 수정 · 비우기(삭제) 수동 테스트
- [ ] `journals.html` 학생 · 월별 마스터-디테일 조회 테스트
- [ ] **오래된 안내 문구 수정** (`index.html`)
  - 예: “일지 팝업은 UI만 구현되어 있으며 입력값은 저장되지 않습니다” → 실제 DB 저장 반영
- [ ] **localStorage 일지 레거시 제거**
  - `JOURNAL_STORAGE_PREFIX`, `saveJournalForLesson` 등 미사용 코드·주석 정리
- [ ] (선택) `vercel.json`에 `/journals` → `journals.html` rewrite 추가

### B-3. 미구현 · 확장

- [ ] 첨부파일: 저장 방식 결정 (로컬 only / object storage / DB metadata)
- [ ] 첨부파일 API·UI 연동
- [ ] 일지 이력형(수정 이력 누적) vs 단일 row 덮어쓰기 — 현재는 덮어쓰기 전제로 운영 중인지 확인

**관련 파일**

- `index.html` (일지 모달, 상세 패널)
- `journals.html`
- `api/lesson-journals.js`
- `api/actual-lessons.js`
- `js/sidebar.js` (일지 조회 메뉴)

---

## C. 보강 등록 (신규 기능)

정기 `lessons` 템플릿 밖에, **특정 날짜에 추가되는 실제 수업**을 등록하는 기능.  
상세 설계 초안: `TODO_JOURNAL_MAKEUP.md`

### C-1. 설계 결정

- [ ] 보강을 `actual_lessons` 확장으로 처리할지, `makeup_lessons` 별도 테이블로 둘지 결정
- [ ] `lesson_id` 없이 독립 보강 허용 여부
- [ ] 필드 정의
  - 예: 학생, 날짜, 시작·종료 시간, 원수업 연결, 메모
- [ ] 보강도 취소/복구(`status`) 필요 여부
- [ ] 등록 UI 위치: `index.html` 상세 패널 vs `lessons.html` vs 별도 화면

### C-2. 구현

- [ ] DB 마이그레이션 SQL 추가
- [ ] 보강 등록·조회·(수정·삭제) API
- [ ] `index.html` 달력/상세에 보강 수업 표시
- [ ] 기존 일지·취소/복구 흐름과 충돌 없는지 검증

**권장 구현 순서**

1. 저장 구조 확정  
2. SQL 마이그레이션  
3. API  
4. `index.html` UI  
5. 수동 테스트 체크리스트

---

## D. 저장소 · 문서 정리

- [ ] 작업 트리 modified 5개 파일: `git diff` 후 실변경 없으면 `git restore`, 있으면 커밋
- [ ] `TODO_HANDOFF.md` 내용을 이 파일 기준으로 갱신하거나 deprecated 표시
- [ ] 보강 설계가 확정되면 `TODO_JOURNAL_MAKEUP.md` 체크리스트 반영

---

## E. 향후 (미착수)

- [ ] 문자 발송 관리 (사이드바 placeholder)
- [ ] 통계 분석 (사이드바 placeholder)

---

## 수동 테스트 체크리스트

### Cron

- [ ] 로컬: `.env`에 `CRON_SECRET` 설정 후 `GET /api/cron/sync-actual-lessons` + Bearer 헤더
- [ ] 프로덕션: curl 응답 `ok: true`, DB에 해당 월 `actual_lessons` 행 증가

### 일지

- [ ] 실제 수업 1건에 일지 등록 가능
- [ ] 기존 일지 수정 가능
- [ ] 핵심 필드 비우고 저장 시 일지 삭제(미작성) 처리
- [ ] 상세 패널에 “일지” / “일지 수정” 라벨 즉시 반영
- [ ] `journals.html`에서 학생·월 필터 조회 정상

### 보강 (구현 후)

- [ ] 특정 날짜에 보강 수업 추가 등록
- [ ] 달력·상세에 보강 표시
- [ ] 일지·취소/복구와 충돌 없음

---

## 주요 파일 맵

| 목적 | 파일 |
|------|------|
| 메인 캘린더 | `index.html` |
| 일지 조회 | `journals.html` |
| 학생 | `students.html`, `api/students.js` |
| 반복 수업 | `lessons.html`, `api/lessons.js` |
| 실제 수업 | `api/actual-lessons.js` |
| 일지 API | `api/lesson-journals.js` |
| 월간 Cron | `api/cron/sync-actual-lessons.js` |
| 로컬 서버 | `server.js` |
| 배포·Cron 스케줄 | `vercel.json` |
| DB 스키마 | `sql/*.sql` |

---

## 추천 작업 순서

1. **A** — Vercel Cron 프로덕션 검증  
2. **B** — 일지 기능 테스트 · UI/레거시 정리  
3. **C** — 보강 등록 설계 → 구현  
4. **D** — 문서·git 정리  
