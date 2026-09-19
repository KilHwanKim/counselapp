-- 미래 정기 actual_lessons는 시간·학생을 복사하지 않고 lessons 템플릿을 따라간다.
-- (조회 시 COALESCE(al.값, 템플릿값) 로 읽으므로 NULL 이면 템플릿 수정이 그대로 반영됨)
-- 과거 행은 수정·삭제 시 snapshotPastActualLessonsForLesson 이 고정한다.
UPDATE actual_lessons
SET start_time = NULL, end_time = NULL, student_id = NULL
WHERE lesson_id IS NOT NULL
  AND COALESCE(is_makeup, false) = false
  AND lesson_date >= (NOW() AT TIME ZONE 'Asia/Seoul')::date;
