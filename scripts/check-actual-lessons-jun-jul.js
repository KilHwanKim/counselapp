import 'dotenv/config';
import pg from 'pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.log('NO_DB_URL');
  process.exit(0);
}

const pool = new pg.Pool({ connectionString });

try {
  const byMonth = await pool.query(`
    SELECT to_char(date_trunc('month', lesson_date), 'YYYY-MM') AS month,
           COUNT(*)::int AS rows,
           MIN(created_at) AS first_created,
           MAX(created_at) AS last_created
    FROM actual_lessons
    WHERE lesson_date >= '2026-06-01' AND lesson_date < '2026-08-01'
    GROUP BY 1 ORDER BY 1
  `);
  console.log('=== by month (2026-06 ~ 2026-07) ===');
  console.table(byMonth.rows);

  const sample = await pool.query(`
    SELECT lesson_date::text, COUNT(*)::int AS cnt, MIN(created_at) AS first_created
    FROM actual_lessons
    WHERE lesson_date >= '2026-06-01' AND lesson_date < '2026-08-01'
    GROUP BY lesson_date ORDER BY lesson_date LIMIT 10
  `);
  console.log('=== sample dates ===');
  console.table(sample.rows);

  const col = await pool.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actual_lessons' AND column_name = 'is_makeup'
  `);
  if (col.rows.length > 0) {
    const types = await pool.query(`
      SELECT COUNT(*) FILTER (WHERE is_makeup) AS makeup,
             COUNT(*) FILTER (WHERE NOT COALESCE(is_makeup, false)) AS regular
      FROM actual_lessons
      WHERE lesson_date >= '2026-06-01' AND lesson_date < '2026-08-01'
    `);
    console.log('=== makeup vs regular ===');
    console.table(types.rows);
  }
} finally {
  await pool.end();
}
