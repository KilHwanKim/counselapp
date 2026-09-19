import { neon } from '@neondatabase/serverless';

if (typeof process !== 'undefined' && !process.env.VERCEL) {
  await import('dotenv/config');
}

function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return {};
}

function toDateString(value) {
  if (value == null) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0');
  }
  const s = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

function parseStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'cancelled') return 'cancelled';
  return 'scheduled';
}

function parseTime(s) {
  const t = String(s || '').trim();
  if (!/^\d{1,2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return (h < 10 ? '0' + h : '' + h) + ':' + (m < 10 ? '0' + m : '' + m);
}

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function overlaps(s1, e1, s2, e2) {
  const a = timeToMinutes(s1);
  const b = timeToMinutes(e1);
  const c = timeToMinutes(s2);
  const d = timeToMinutes(e2);
  return a < d && c < b;
}

function defaultEndTime(startTime) {
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + (m || 0) + 60;
  const h2 = Math.floor(total / 60);
  const m2 = total % 60;
  return (h2 < 10 ? '0' + h2 : '' + h2) + ':' + (m2 < 10 ? '0' + m2 : '' + m2);
}

function sliceTime(value) {
  return value ? String(value).slice(0, 5) : '';
}

/** lessons.day_of_week convention: 1=월 … 7=일 */
function dayOfWeekFromDate(dateStr) {
  const s = toDateString(dateStr);
  if (!s) return null;
  const parts = s.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const jsDay = d.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function mapActualLessonRow(r) {
  const lessonDate = toDateString(r.lesson_date);
  const isMakeup = !!r.is_makeup;
  let startTime;
  let endTime;
  let studentId;
  if (isMakeup) {
    startTime = sliceTime(r.al_start_time);
    endTime = sliceTime(r.al_end_time);
    studentId = r.al_student_id;
  } else {
    startTime = sliceTime(r.al_start_time || r.lesson_start_time);
    endTime = sliceTime(r.al_end_time || r.lesson_end_time);
    studentId = r.al_student_id || r.lesson_student_id;
  }
  return {
    id: r.id,
    lesson_id: r.lesson_id,
    lesson_date: lessonDate,
    status: r.status || 'scheduled',
    is_makeup: isMakeup,
    day_of_week: dayOfWeekFromDate(lessonDate),
    start_time: startTime,
    end_time: endTime,
    color: r.color || '',
    student_id: studentId,
    student_name: r.student_name || '',
    student_birth_date: toDateString(r.student_birth_date),
    created_at: r.created_at ? String(r.created_at) : '',

    journal_exists: !!r.journal_id,
    journal: r.journal_id
      ? {
          lesson_content: r.lesson_content || '',
          amount_type: r.amount_type || '',
          lesson_time: r.lesson_time || '',
          approval_number: r.approval_number || '',
          parent_consultation: r.parent_consultation || '',
          homework: r.homework || '',
          updated_at: r.journal_updated_at ? String(r.journal_updated_at) : '',
        }
      : null,
  };
}

async function findDateOverlapError(sql, lessonDate, startTime, endTimeNorm, excludeId) {
  const rows = await sql`
    SELECT al.id, al.status, al.is_makeup,
           l.start_time AS lesson_start_time, l.end_time AS lesson_end_time,
           al.start_time AS al_start_time, al.end_time AS al_end_time
    FROM actual_lessons al
    LEFT JOIN lessons l ON l.id = al.lesson_id
    WHERE al.lesson_date = ${lessonDate}
  `;
  for (const row of rows || []) {
    if (excludeId != null && row.id === excludeId) continue;
    if ((row.status || 'scheduled') === 'cancelled') continue;
    const otherStart = row.is_makeup
      ? sliceTime(row.al_start_time)
      : sliceTime(row.al_start_time || row.lesson_start_time);
    const otherEndRaw = row.is_makeup
      ? sliceTime(row.al_end_time)
      : sliceTime(row.al_end_time || row.lesson_end_time);
    const otherEndNorm = otherEndRaw || defaultEndTime(otherStart);
    if (!otherStart) continue;
    if (overlaps(startTime, endTimeNorm, otherStart, otherEndNorm)) {
      return '선택한 시간이 해당 날짜의 다른 수업과 겹칩니다.';
    }
  }
  return null;
}

/** 오늘 날짜 (Asia/Seoul, YYYY-MM-DD). DB CURRENT_DATE(UTC)와 달리 한국 날짜 기준 */
export function seoulToday(from = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(from);
}

/** 조회 시 자동 생성하는 달: 이번 달 ~ 12개월 뒤 (과거 달·먼 미래 달은 생성하지 않음) */
const SYNC_MONTHS_AHEAD = 12;

function isSyncableMonth(year, month, today) {
  const [ty, tm] = today.split('-').map(Number);
  const diff = (year - ty) * 12 + (month - tm);
  return diff >= 0 && diff <= SYNC_MONTHS_AHEAD;
}

/**
 * Generate actual_lessons rows for one calendar month from recurring lessons (templates).
 * - 정기 행은 시간·학생을 복사하지 않는다(NULL) → 템플릿 수정이 미래 행에 그대로 반영된다.
 * - 오늘 이전 날짜는 템플릿이 그날 이후 수정되지 않은 경우에만 생성한다 (소급 생성 방지).
 * - 생성 가능한 달(이번 달 ~ 12개월 뒤)이 아니면 아무것도 하지 않는다.
 */
export async function syncActualLessonsForMonth(sql, year, month) {
  const today = seoulToday();
  if (!isSyncableMonth(year, month, today)) return { inserted: 0 };

  const lastDay = new Date(year, month, 0).getDate();
  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const result = await sql`
    INSERT INTO actual_lessons (lesson_id, lesson_date)
    SELECT l.id, gs.day::date
    FROM lessons l
    CROSS JOIN generate_series(${fromDate}::date, ${toDate}::date, interval '1 day') AS gs(day)
    WHERE (CASE WHEN l.day_of_week = 7 THEN 0 ELSE l.day_of_week END) = EXTRACT(DOW FROM gs.day)::int
      AND (
        gs.day::date >= ${today}::date
        OR (l.updated_at AT TIME ZONE 'Asia/Seoul')::date <= gs.day::date
      )
    ON CONFLICT (lesson_id, lesson_date) DO NOTHING
    RETURNING id
  `;
  return { inserted: result?.length ?? 0 };
}

/** 템플릿 수정·삭제 직전 호출: 이번 달 지난 날짜 중 빠진 정기 행을 변경 전 템플릿 기준으로 채운다 */
export async function catchUpCurrentMonthActualLessons(sql) {
  const [year, month] = seoulToday().split('-').map(Number);
  return syncActualLessonsForMonth(sql, year, month);
}

/** 과거 실제 수업에 변경 전 템플릿 시간·학생을 고정 (이미 스냅샷 있으면 유지) */
export async function snapshotPastActualLessonsForLesson(sql, lessonId, oldLesson) {
  const startTime = oldLesson.start_time ? String(oldLesson.start_time).slice(0, 5) : null;
  const endTimeRaw = oldLesson.end_time ? String(oldLesson.end_time).slice(0, 5) : null;
  const endTime = endTimeRaw || (startTime ? defaultEndTime(startTime) : null);
  const studentId = oldLesson.student_id;
  if (!startTime || !studentId) return;

  const today = seoulToday();
  await sql`
    UPDATE actual_lessons
    SET
      start_time = COALESCE(start_time, ${startTime}::time),
      end_time = COALESCE(end_time, ${endTime}::time),
      student_id = COALESCE(student_id, ${studentId})
    WHERE lesson_id = ${lessonId}
      AND lesson_date < ${today}::date
      AND COALESCE(is_makeup, false) = false
  `;
}

/** 요일 변경 시 오늘 이후·구 요일에 해당하는 정기 actual_lessons만 제거 (새 요일 행은 조회 시 생성) */
export async function deleteFutureActualLessonsOnOldSchedule(sql, lessonId, oldDayOfWeek) {
  const today = seoulToday();
  const result = await sql`
    DELETE FROM actual_lessons
    WHERE lesson_id = ${lessonId}
      AND lesson_date >= ${today}::date
      AND COALESCE(is_makeup, false) = false
      AND (CASE WHEN ${oldDayOfWeek} = 7 THEN 0 ELSE ${oldDayOfWeek} END) = EXTRACT(DOW FROM lesson_date)::int
    RETURNING id
  `;
  return { deleted: result?.length ?? 0 };
}

async function handleMakeupPost(sql, body, res) {
  const studentId = body.student_id != null ? parseInt(String(body.student_id), 10) : NaN;
  const lessonDate = body.lesson_date ? String(body.lesson_date).trim() : '';
  const startTime = parseTime(body.start_time);
  const endTime = body.end_time != null ? parseTime(body.end_time) : null;

  if (!Number.isInteger(studentId) || studentId < 1) {
    return res.status(400).json({ ok: false, error: 'student_id is required' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lessonDate)) {
    return res.status(400).json({ ok: false, error: 'lesson_date invalid (YYYY-MM-DD)' });
  }
  if (!startTime) {
    return res.status(400).json({ ok: false, error: 'start_time invalid (e.g. 14:00)' });
  }

  const studentRows = await sql`SELECT id FROM students WHERE id = ${studentId}`;
  if (!studentRows || studentRows.length === 0) {
    return res.status(400).json({ ok: false, error: 'student not found' });
  }

  const endTimeNorm = endTime || defaultEndTime(startTime);
  const overlapError = await findDateOverlapError(sql, lessonDate, startTime, endTimeNorm, null);
  if (overlapError) return res.status(400).json({ ok: false, error: overlapError });

  const inserted = await sql`
    INSERT INTO actual_lessons (lesson_id, lesson_date, student_id, start_time, end_time, is_makeup, status)
    VALUES (NULL, ${lessonDate}, ${studentId}, ${startTime}, ${endTime}, true, 'scheduled')
    RETURNING id
  `;
  const id = inserted && inserted[0] ? inserted[0].id : null;
  return res.status(200).json({ ok: true, id });
}

export default async function handler(req, res) {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ ok: false, error: 'POSTGRES_URL or DATABASE_URL is not set.' });
  }

  const sql = neon(connectionString);
  const method = (req.method || 'GET').toUpperCase();

  try {
    if (method === 'GET') {
      const year = req.query && req.query.year != null ? parseInt(String(req.query.year), 10) : null;
      const month = req.query && req.query.month != null ? parseInt(String(req.query.month), 10) : null;
      let fromDate, toDate, targetYear, targetMonth;
      if (year != null && !Number.isNaN(year) && month != null && !Number.isNaN(month)) {
        targetYear = year;
        targetMonth = month;
        fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      } else {
        const now = new Date();
        targetYear = now.getFullYear();
        targetMonth = now.getMonth() + 1;
        fromDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(targetYear, targetMonth, 0).getDate();
        toDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      }
      // 조회하는 달(이번 달 ~ 12개월 뒤)의 정기 수업을 템플릿에서 채운다 (멱등)
      try {
        await syncActualLessonsForMonth(sql, targetYear, targetMonth);
      } catch (syncErr) {
        console.error('actual_lessons sync failed:', syncErr);
      }
      const rows = await sql`
        SELECT al.id, al.lesson_id, al.lesson_date, al.created_at, al.status, al.is_makeup,
               l.start_time AS lesson_start_time, l.end_time AS lesson_end_time,
               l.student_id AS lesson_student_id, l.color,
               al.start_time AS al_start_time, al.end_time AS al_end_time,
               al.student_id AS al_student_id,
               s.name AS student_name, s.birth_date AS student_birth_date,

               lj.id AS journal_id, lj.lesson_content, lj.amount_type, lj.lesson_time,
               lj.approval_number, lj.parent_consultation, lj.homework, lj.updated_at AS journal_updated_at
        FROM actual_lessons al
        LEFT JOIN lessons l ON l.id = al.lesson_id
        LEFT JOIN students s ON s.id = COALESCE(al.student_id, l.student_id)
        LEFT JOIN lesson_journals lj ON lj.actual_lesson_id = al.id
        WHERE al.lesson_date >= ${fromDate} AND al.lesson_date <= ${toDate}
        ORDER BY al.lesson_date, COALESCE(to_char(al.start_time, 'HH24:MI'), l.start_time, '')
      `;
      const list = (rows || []).map(mapActualLessonRow);
      return res.status(200).json({ ok: true, actual_lessons: list });
    }

    if (method === 'POST') {
      const body = getBody(req);
      if (body.action === 'makeup' || (body.student_id != null && body.lesson_date && body.start_time)) {
        return handleMakeupPost(sql, body, res);
      }
      const now = new Date();
      const year = body.year != null && !Number.isNaN(Number(body.year)) ? Number(body.year) : now.getFullYear();
      const month = body.month != null && !Number.isNaN(Number(body.month)) ? Number(body.month) : now.getMonth() + 1;
      const { inserted } = await syncActualLessonsForMonth(sql, year, month);
      return res.status(200).json({ ok: true, inserted });
    }

    if (method === 'PATCH') {
      const body = getBody(req);
      const idParam = req.query && req.query.id != null ? parseInt(String(req.query.id), 10) : NaN;
      const dateParam = req.query && req.query.date ? String(req.query.date).trim() : '';
      const status = parseStatus(body.status);

      if (Number.isInteger(idParam) && idParam > 0) {
        await sql`
          UPDATE actual_lessons
          SET status = ${status}
          WHERE id = ${idParam}
        `;
        return res.status(200).json({ ok: true });
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        await sql`
          UPDATE actual_lessons
          SET status = ${status}
          WHERE lesson_date = ${dateParam}
        `;
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ ok: false, error: 'id or date (YYYY-MM-DD) is required' });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(503).json({ ok: false, error: err.message || 'Database error' });
  }
}
