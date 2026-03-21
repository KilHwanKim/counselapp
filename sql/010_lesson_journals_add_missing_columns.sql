-- 기존 lesson_journals 테이블이 이미 생성되어 있는 경우를 위한 보강 마이그레이션
-- (초기 생성 시점에 누락된 컬럼을 안전하게 추가)

ALTER TABLE lesson_journals
  ADD COLUMN IF NOT EXISTS lesson_content TEXT,
  ADD COLUMN IF NOT EXISTS amount_type VARCHAR(30),
  ADD COLUMN IF NOT EXISTS lesson_time VARCHAR(60),
  ADD COLUMN IF NOT EXISTS approval_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS parent_consultation TEXT,
  ADD COLUMN IF NOT EXISTS homework TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

