# Journal And Makeup TODO

## Goal
- `actual_lessons` 1건마다 연결되는 `일지 등록` 기능 추가
- 정기 수업 외에 특정 날짜에 추가 실제 수업을 넣는 `보강 등록` 기능 추가

## Current State
- `students`는 학생 기본 정보와 메모를 저장합니다.
- `lessons`는 주간 반복 수업 슬롯을 저장합니다.
- `actual_lessons`는 실제 날짜 기준 수업을 저장합니다.
- `index.html`은 월간 달력과 날짜 클릭 상세 패널을 이미 사용 중입니다.
- `actual_lessons`는 현재 월 조회, 월 생성, 취소/복구 상태 변경까지 연결된 상태입니다.

## Current Files
- `sql/002_students.sql`
  - 학생 기본 정보 저장
- `sql/003_lessons.sql`
  - 주간 반복 수업 슬롯 저장
- `sql/005_actual_lessons.sql`
  - 실제 날짜 수업 저장
- `api/lessons.js`
  - 주간 반복 수업 조회/등록/삭제
- `api/actual-lessons.js`
  - 실제 날짜 수업 월 조회, 월 생성, 취소/복구
- `index.html`
  - 날짜 클릭 시 실제 수업 상세 표시

## Journal Feature TODO
- [ ] `actual_lessons` 1건에 연결되는 일지 저장 구조를 확정한다.
- [ ] 일지를 `actual_lessons` 테이블 컬럼으로 둘지, 별도 `lesson_journals` 테이블로 둘지 결정한다.
- [ ] 일지 등록/수정/조회 API를 설계한다.
- [ ] `index.html` 상세 패널에서 실제 수업별 일지를 작성할지, 별도 화면에서 작성할지 결정한다.
- [ ] 일지 내용에 필요한 필드를 정의한다.
  - 예: 수업 내용, 학생 반응, 숙제, 부모 전달사항, 특이사항
- [ ] 기존 일지가 있는 경우 수정 가능하게 할지, 이력형으로 누적할지 결정한다.
- [ ] 일지 등록 후 상세 패널에 저장 상태가 바로 반영되게 한다.

## Makeup Feature TODO
- [ ] 보강을 “정기 수업 외에 추가되는 실제 수업 1건”으로 저장하는 구조를 확정한다.
- [ ] 보강을 기존 `actual_lessons`에 포함할지, 별도 `makeup_lessons` 테이블로 둘지 결정한다.
- [ ] 보강 등록에 필요한 필드를 정의한다.
  - 예: 학생, 날짜, 시작 시간, 종료 시간, 원수업 연결 여부, 메모
- [ ] 보강이 기존 정기 수업에서 파생되지 않는 경우 `lesson_id` 없이 저장 가능한 구조가 필요한지 검토한다.
- [ ] 보강 등록 API를 설계한다.
- [ ] `index.html`에서 날짜 클릭 시 보강 수업도 상세에 함께 보이도록 할지 결정한다.
- [ ] 보강 수업도 취소/복구가 필요한지 결정한다.

## Open Design Decisions
- [ ] 일지는 `actual_lessons` 컬럼으로 저장할지, 별도 테이블로 분리할지
- [ ] 보강은 `actual_lessons` 확장으로 처리할지, 별도 테이블로 분리할지
- [ ] 보강이 기존 정기 수업과 연결되는지, 완전 독립 수업도 허용할지
- [ ] 일지 작성 UI를 `index.html` 상세 패널에 바로 넣을지, 별도 모달/페이지로 분리할지
- [ ] 보강 등록 UI를 `index.html`에서 할지, `lessons.html` 또는 별도 화면에서 할지

## Suggested Implementation Order
1. 일지 저장 구조 확정
2. 보강 저장 구조 확정
3. 필요한 DB 마이그레이션 추가
4. API 초안 구현
5. `index.html` 상세 패널 확장
6. 등록/수정/조회 흐름 검증

## Recommended Direction
- 일지는 `actual_lessons` 1건과 직접 연결되는 별도 테이블로 두는 편이 확장에 유리합니다.
- 보강은 정기 수업과 독립적으로도 생길 수 있으므로, 기존 `actual_lessons`만으로 처리하기보다 별도 구조를 먼저 검토하는 것이 안전합니다.
- 단, 빠른 구현이 목표라면 `actual_lessons` 확장 여부를 먼저 검토한 뒤 최소 변경안으로 시작할 수 있습니다.

## Code References
```1:9:C:\J\counselapp\sql\005_actual_lessons.sql
CREATE TABLE IF NOT EXISTS actual_lessons (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id),
  lesson_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lesson_id, lesson_date)
);
```

```27:63:C:\J\counselapp\api\actual-lessons.js
if (method === 'GET') {
  // 월별 실제 수업 조회
  ...
  return res.status(200).json({ ok: true, actual_lessons: list });
}
```

```467:543:C:\J\counselapp\index.html
function renderDetail() {
  const items = lessonsByDate[selectedDate] || [];
  // 날짜 클릭 시 상세 패널 렌더
  ...
}
```

## Verification Checklist
- [ ] 실제 수업별 일지 등록이 가능하다
- [ ] 기존 일지를 다시 열어 수정할 수 있다
- [ ] 보강 수업을 특정 날짜에 추가 등록할 수 있다
- [ ] 보강 수업이 달력/상세에 정상적으로 표시된다
- [ ] 일지와 보강이 기존 취소/복구 흐름과 충돌하지 않는다
