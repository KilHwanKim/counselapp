-- 보강 수업: 정기 수업(lesson_id) 없이 특정 날짜·시간에 추가되는 actual_lessons
ALTER TABLE actual_lessons
  ALTER COLUMN lesson_id DROP NOT NULL;

ALTER TABLE actual_lessons
  ADD COLUMN IF NOT EXISTS student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS is_makeup BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_actual_lessons_makeup_date ON actual_lessons(lesson_date) WHERE is_makeup = true;
