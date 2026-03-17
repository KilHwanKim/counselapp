-- 수업 카드 색상 저장용 컬럼
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS color VARCHAR(7);
