-- 실제 수업: 정기 수업(lessons)을 특정 날짜에 발생한 기록
-- INSERT 시 이번 달 데이터 추가, 삭제 시 오늘 기준 미래 수업만 삭제
CREATE TABLE IF NOT EXISTS actual_lessons (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id),
  lesson_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lesson_id, lesson_date)
);

CREATE INDEX IF NOT EXISTS idx_actual_lessons_lesson_date ON actual_lessons(lesson_date);
CREATE INDEX IF NOT EXISTS idx_actual_lessons_lesson_id ON actual_lessons(lesson_id);
