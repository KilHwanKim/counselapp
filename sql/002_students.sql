-- 학생 관리 테이블 (재실행 시 에러 방지를 위해 IF NOT EXISTS 사용)
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_phone VARCHAR(50),
  birth_date DATE,
  first_visit_date DATE,
  reg_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
