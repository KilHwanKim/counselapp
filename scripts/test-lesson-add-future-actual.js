/**
 * 주간 수업 POST(신규 추가) 후 미래 actual_lessons 생성 여부 검증.
 * 사용: node scripts/test-lesson-add-future-actual.js
 * 정리: --cleanup-only (이전 테스트 슬롯만 삭제)
 */
import 'dotenv/config';
import pg from 'pg';
import lessonsHandler from '../server/handlers/lessons.js';

const TEST_START = '23:47';
const TEST_END = '23:48';
const MARKER = '__test_lesson_add_future_actual__';

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

async function callLessonsPost(body) {
  const req = { method: 'POST', body };
  const res = mockRes();
  await lessonsHandler(req, res);
  return res;
}

function jsDayToLessonDow(jsDay) {
  return jsDay === 0 ? 7 : jsDay;
}

function futureDatesForMonth(year, month, dayOfWeek) {
  const lastDay = new Date(year, month, 0).getDate();
  const targetDow = dayOfWeek === 7 ? 0 : dayOfWeek;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out = [];
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getDay() !== targetDow) continue;
    if (date < today) continue;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    out.push(`${y}-${m}-${dd}`);
  }
  return out;
}

async function main() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('FAIL: POSTGRES_URL or DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString });
  const cleanupOnly = process.argv.includes('--cleanup-only');

  try {
    const existing = await pool.query(
      `SELECT l.id FROM lessons l
       JOIN students s ON s.id = l.student_id
       WHERE l.start_time = $1 AND s.name LIKE $2`,
      [TEST_START, `%${MARKER}%`]
    );

    if (cleanupOnly) {
      for (const row of existing.rows) {
        await pool.query('DELETE FROM actual_lessons WHERE lesson_id = $1', [row.id]);
        await pool.query('DELETE FROM lessons WHERE id = $1', [row.id]);
      }
      console.log('cleanup:', existing.rows.length, 'lesson(s)');
      return;
    }

    let studentId;
    const studentRow = await pool.query(
      `SELECT id FROM students WHERE name = $1 LIMIT 1`,
      [MARKER]
    );
    if (studentRow.rows[0]) {
      studentId = studentRow.rows[0].id;
    } else {
      const ins = await pool.query(
        `INSERT INTO students (name) VALUES ($1) RETURNING id`,
        [MARKER]
      );
      studentId = ins.rows[0].id;
    }

    const now = new Date();
    const dayOfWeek = jsDayToLessonDow(now.getDay());
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const nextDate = new Date(year, now.getMonth() + 1, 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = nextDate.getMonth() + 1;

    await pool.query(
      'DELETE FROM actual_lessons WHERE lesson_id IN (SELECT id FROM lessons WHERE day_of_week = $1 AND start_time = $2)',
      [dayOfWeek, TEST_START]
    );
    await pool.query('DELETE FROM lessons WHERE day_of_week = $1 AND start_time = $2', [
      dayOfWeek,
      TEST_START,
    ]);

    const postRes = await callLessonsPost({
      day_of_week: dayOfWeek,
      start_time: TEST_START,
      end_time: TEST_END,
      student_id: studentId,
      color: '#AABBCC',
    });

    if (postRes.statusCode !== 200 || !postRes.body?.ok) {
      console.error('FAIL: POST /api/lessons', postRes.statusCode, postRes.body);
      process.exit(1);
    }
    const lessonId = postRes.body.id;
    console.log('POST ok, lesson_id:', lessonId, 'day_of_week:', dayOfWeek);

    const expectedThis = futureDatesForMonth(year, month, dayOfWeek);
    const expectedNext = futureDatesForMonth(nextYear, nextMonth, dayOfWeek);
    const expectedAll = expectedThis;

    const rows = await pool.query(
      `SELECT lesson_date::text AS d
       FROM actual_lessons
       WHERE lesson_id = $1 AND lesson_date >= CURRENT_DATE
         AND COALESCE(is_makeup, false) = false
       ORDER BY lesson_date`,
      [lessonId]
    );
    const actual = rows.rows.map((r) => r.d);

    const missing = expectedAll.filter((d) => !actual.includes(d));
    const extra = actual.filter((d) => !expectedAll.includes(d));

    console.log('--- expected future dates (this month only) ---');
    console.log('this month:', expectedThis.length, expectedThis.join(', ') || '(none)');
    console.log('next month (cron, not required on POST):', expectedNext.length);
    console.log('--- actual_lessons in DB ---');
    console.log('count:', actual.length, actual.join(', ') || '(none)');

    let pass = missing.length === 0;
    const nextMonthInDb = actual.filter((d) => d.startsWith(`${nextYear}-${String(nextMonth).padStart(2, '0')}`));
    if (nextMonthInDb.length) {
      console.log('WARN: next-month rows created on POST (expected cron only):', nextMonthInDb.join(', '));
    }

    if (missing.length) console.log('MISSING:', missing.join(', '));
    if (extra.length) console.log('EXTRA (unexpected):', extra.join(', '));

    if (pass) {
      console.log('\nPASS: future actual_lessons match expected schedule.');
    } else {
      console.log('\nFAIL: 주간 수업 신규 추가만으로 미래 actual_lessons가 기대대로 생성되지 않음.');
      process.exitCode = 1;
    }

    if (lessonId) {
      await pool.query('DELETE FROM actual_lessons WHERE lesson_id = $1', [lessonId]);
      await pool.query('DELETE FROM lessons WHERE id = $1', [lessonId]);
      console.log('cleaned up test lesson', lessonId);
    }
  } finally {
    await pool.end();
  }
  if (process.exitCode === 1) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
