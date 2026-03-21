-- 수업별 일지 저장(영구 저장)
-- actual_lessons 1건(수업 날짜/시간)당 일지 1개 저장을 기본으로 합니다.

CREATE TABLE IF NOT EXISTS lesson_journals (
  id SERIAL PRIMARY KEY,
  actual_lesson_id INTEGER NOT NULL UNIQUE REFERENCES actual_lessons(id) ON DELETE CASCADE,

  lesson_content TEXT,
  amount_type VARCHAR(30),
  lesson_time VARCHAR(60),
  approval_number VARCHAR(100),
  parent_consultation TEXT,
  homework TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_journals_actual_lesson_id ON lesson_journals(actual_lesson_id);

