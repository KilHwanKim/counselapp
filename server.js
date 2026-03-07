import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/api/db-test', async (req, res) => {
  const { default: handler } = await import('./api/db-test.js');
  return handler(req, res);
});

app.get('/api/db-tables', async (req, res) => {
  const { default: handler } = await import('./api/db-tables.js');
  return handler(req, res);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`  Main:     http://localhost:${PORT}/`);
  console.log(`  DB Test:  http://localhost:${PORT}/tests/db-connection.html`);
});
