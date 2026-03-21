import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/db-test', async (req, res) => {
  const { default: handler } = await import('./api/db-test.js');
  return handler(req, res);
});

app.get('/api/db-tables', async (req, res) => {
  const { default: handler } = await import('./api/db-tables.js');
  return handler(req, res);
});

const studentsHandler = (await import('./api/students.js')).default;
app.get('/api/students', studentsHandler);
app.post('/api/students', studentsHandler);
app.put('/api/students', studentsHandler);
app.delete('/api/students', studentsHandler);

const lessonsHandler = (await import('./api/lessons.js')).default;
app.get('/api/lessons', lessonsHandler);
app.post('/api/lessons', lessonsHandler);
app.delete('/api/lessons', lessonsHandler);

const actualLessonsHandler = (await import('./api/actual-lessons.js')).default;
app.get('/api/actual-lessons', actualLessonsHandler);
app.post('/api/actual-lessons', actualLessonsHandler);
app.patch('/api/actual-lessons', actualLessonsHandler);

const cronSyncActualLessons = (await import('./api/cron/sync-actual-lessons.js')).default;
app.get('/api/cron/sync-actual-lessons', cronSyncActualLessons);

const lessonJournalsHandler = (await import('./api/lesson-journals.js')).default;
app.get('/api/lesson-journals', lessonJournalsHandler);
app.post('/api/lesson-journals', lessonJournalsHandler);
app.delete('/api/lesson-journals', lessonJournalsHandler);

const holidaysHandler = (await import('./api/holidays.js')).default;
app.get('/api/holidays', holidaysHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`  Main:     http://localhost:${PORT}/`);
  console.log(`  Students: http://localhost:${PORT}/students.html`);
  console.log(`  Lessons:  http://localhost:${PORT}/lessons.html`);
  console.log(`  Journals: http://localhost:${PORT}/journals.html`);
  console.log(`  DB Test:  http://localhost:${PORT}/tests/db-connection.html`);
});
