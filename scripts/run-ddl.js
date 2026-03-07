import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.join(__dirname, '..', 'sql');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('POSTGRES_URL or DATABASE_URL is not set.');
  process.exit(1);
}

if (!fs.existsSync(sqlDir)) {
  console.log('sql/ folder not found. Nothing to run.');
  process.exit(0);
}

const files = fs.readdirSync(sqlDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.log('No .sql files in sql/. Nothing to run.');
  process.exit(0);
}

const pool = new pg.Pool({ connectionString });

try {
  for (const file of files) {
    const filePath = path.join(sqlDir, file);
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) {
      console.log(`Skip (empty): ${file}`);
      continue;
    }
    await pool.query(content);
    console.log(`OK: ${file}`);
  }
} catch (err) {
  console.error('DDL run failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
