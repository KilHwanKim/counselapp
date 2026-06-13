import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

function printUrls(port) {
  const base = `http://localhost:${port}`;
  console.log('');
  console.log(`  counselapp — ${base}`);
  console.log(`  Main:              ${base}/`);
  console.log(`  Students:          ${base}/students.html`);
  console.log(`  Lessons:           ${base}/lessons.html`);
  console.log(`  Journals:          ${base}/journals.html`);
  console.log(`  File attach test:  ${base}/tests/file-attachment.html`);
  console.log(`  DB test:           ${base}/tests/db-connection.html`);
  console.log('');
}

console.log(`[counselapp] starting on port ${PORT}...`);

app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/db-test', async (req, res) => {
  const { default: handler } = await import('./server/handlers/db-test.js');
  return handler(req, res);
});

app.get('/api/db-tables', async (req, res) => {
  const { default: handler } = await import('./server/handlers/db-tables.js');
  return handler(req, res);
});

const studentsHandler = (await import('./server/handlers/students.js')).default;
app.get('/api/students', studentsHandler);
app.post('/api/students', studentsHandler);
app.put('/api/students', studentsHandler);
app.delete('/api/students', studentsHandler);

const lessonsHandler = (await import('./server/handlers/lessons.js')).default;
app.get('/api/lessons', lessonsHandler);
app.post('/api/lessons', lessonsHandler);
app.delete('/api/lessons', lessonsHandler);

const actualLessonsHandler = (await import('./server/handlers/actual-lessons.js')).default;
app.get('/api/actual-lessons', actualLessonsHandler);
app.post('/api/actual-lessons', actualLessonsHandler);
app.patch('/api/actual-lessons', actualLessonsHandler);

const cronSyncActualLessons = (await import('./server/handlers/cron/sync-actual-lessons.js')).default;
app.get('/api/cron/sync-actual-lessons', cronSyncActualLessons);

const lessonJournalsHandler = (await import('./server/handlers/lesson-journals.js')).default;
app.get('/api/lesson-journals', lessonJournalsHandler);
app.post('/api/lesson-journals', lessonJournalsHandler);
app.delete('/api/lesson-journals', lessonJournalsHandler);

const journalAttachmentsHandler = (await import('./server/handlers/journal-attachments.js')).default;
app.get('/api/journal-attachments', journalAttachmentsHandler);
app.post('/api/journal-attachments', journalAttachmentsHandler);
app.delete('/api/journal-attachments', journalAttachmentsHandler);

const holidaysHandler = (await import('./server/handlers/holidays.js')).default;
app.get('/api/holidays', holidaysHandler);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[counselapp] ready`);
  printUrls(PORT);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`[counselapp] port ${PORT} is already in use.`);
    console.error('Another process may already be serving — try these URLs:');
    printUrls(PORT);
  } else {
    console.error('[counselapp] failed to start:', err.message || err);
  }
  process.exit(1);
});
