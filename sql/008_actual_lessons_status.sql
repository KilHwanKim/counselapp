-- 실제 수업 취소 상태 추가
ALTER TABLE actual_lessons
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'scheduled';

UPDATE actual_lessons
SET status = 'scheduled'
WHERE status IS NULL;
