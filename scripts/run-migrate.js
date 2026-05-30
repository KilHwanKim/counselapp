import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.join(__dirname, '..', 'sql');

/** 테스트/시드 데이터 — 프로덕션 DB에 실행하면 안 됨 */
const SKIP_FILES = new Set([
  '006_seed.sql',
  '011_actual_lessons_2026_march.sql',
]);

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('POSTGRES_URL or DATABASE_URL is not set.');
  process.exit(1);
}

if (!fs.existsSync(sqlDir)) {
  console.log('sql/ folder not found. Nothing to run.');
  process.exit(0);
}

const files = fs
  .readdirSync(sqlDir)
  .filter((f) => f.endsWith('.sql') && !SKIP_FILES.has(f))
  .sort();

if (files.length === 0) {
  console.log('No migration files to run.');
  process.exit(0);
}

const pool = new pg.Pool({ connectionString });

async function ensureMigrationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function isApplied(filename) {
  const result = await pool.query(
    'SELECT 1 FROM schema_migrations WHERE filename = $1',
    [filename]
  );
  return result.rowCount > 0;
}

async function markApplied(filename) {
  await pool.query(
    'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
    [filename]
  );
}

try {
  await ensureMigrationTable();

  let applied = 0;
  let skipped = 0;

  for (const file of files) {
    if (await isApplied(file)) {
      console.log(`Skip (already applied): ${file}`);
      skipped += 1;
      continue;
    }

    const filePath = path.join(sqlDir, file);
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) {
      console.log(`Skip (empty): ${file}`);
      continue;
    }

    await pool.query(content);
    await markApplied(file);
    console.log(`OK: ${file}`);
    applied += 1;
  }

  console.log(`Migration complete. applied=${applied}, skipped=${skipped}`);
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
