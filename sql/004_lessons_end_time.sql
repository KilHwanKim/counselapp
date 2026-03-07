-- 수업 종료 시간 추가 (10분 단위 표시용)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS end_time VARCHAR(5);
