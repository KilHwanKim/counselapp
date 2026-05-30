/**
 * 달력 조회 등으로 미리 쌓인 미래 달 정기 actual_lessons 삭제.
 * 보강(is_makeup)·당월 이전 데이터는 유지. 기본: 익월 1일 이후 lesson_date.
 *
 *   node scripts/cleanup-future-actual-lessons.js
 *   node scripts/cleanup-future-actual-lessons.js --dry-run
 */
import 'dotenv/config';
import pg from 'pg';

const dryRun = process.argv.includes('--dry-run');
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('POSTGRES_URL or DATABASE_URL is not set.');
  process.exit(1);
}

const now = new Date();
const cutoff = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const cutoffStr =
  cutoff.getFullYear() +
  '-' +
  String(cutoff.getMonth() + 1).padStart(2, '0') +
  '-01';

const pool = new pg.Pool({ connectionString });

try {
  const preview = await pool.query(
    `
    SELECT to_char(date_trunc('month', lesson_date), 'YYYY-MM') AS month,
           COUNT(*)::int AS rows
    FROM actual_lessons
    WHERE lesson_date >= $1::date
      AND lesson_id IS NOT NULL
      AND COALESCE(is_makeup, false) = false
    GROUP BY 1 ORDER BY 1
    `,
    [cutoffStr]
  );
  console.log('Cutoff (delete from):', cutoffStr);
  console.log('=== to delete (regular only) ===');
  console.table(preview.rows);

  if (dryRun) {
    console.log('Dry run — no rows deleted.');
    process.exit(0);
  }

  const delJournals = await pool.query(
    `
    DELETE FROM lesson_journals lj
    USING actual_lessons al
    WHERE lj.actual_lesson_id = al.id
      AND al.lesson_date >= $1::date
      AND al.lesson_id IS NOT NULL
      AND COALESCE(al.is_makeup, false) = false
    `,
    [cutoffStr]
  );
  const delLessons = await pool.query(
    `
    DELETE FROM actual_lessons
    WHERE lesson_date >= $1::date
      AND lesson_id IS NOT NULL
      AND COALESCE(is_makeup, false) = false
    `,
    [cutoffStr]
  );
  console.log('Deleted journals:', delJournals.rowCount);
  console.log('Deleted actual_lessons:', delLessons.rowCount);
} finally {
  await pool.end();
}
