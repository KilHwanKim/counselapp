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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`  Main:     http://localhost:${PORT}/`);
  console.log(`  Students: http://localhost:${PORT}/students.html`);
  console.log(`  DB Test:  http://localhost:${PORT}/tests/db-connection.html`);
});
