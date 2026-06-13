/**
 * Smoke test for Next.js counselapp.
 * Usage: node scripts/verify-next-app.js [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3001';

const pages = [
    { path: '/', name: 'index', need: ['monthTitle', 'calendarGrid', 'detailBody'] },
    { path: '/students', name: 'students', need: ['gridBody', 'searchInput', 'modal'] },
    { path: '/lessons', name: 'lessons', need: ['timeLabels', 'lessonLayer', 'slotModal'] },
    { path: '/journals', name: 'journals', need: ['journalList', 'detailBody', 'monthFilter'] },
];

const apis = [
    '/api/students',
    '/api/lessons',
    '/api/actual-lessons?year=2026&month=6',
    '/api/holidays?year=2026',
];

let failed = 0;

async function check(label, fn) {
    try {
        const detail = await fn();
        console.log('OK  ', label, detail ? '- ' + detail : '');
    } catch (err) {
        failed += 1;
        console.error('FAIL', label, '-', err.message);
    }
}

console.log('Verifying Next.js counselapp at', base, '\n');

for (const page of pages) {
    await check(page.name + ' page HTML', async () => {
        const res = await fetch(base + page.path);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const html = await res.text();
        if (!html.includes('상담센터')) throw new Error('missing AppShell sidebar');
        if (!html.includes('카카오 계정 연결')) throw new Error('missing unified header');
        for (const id of page.need) {
            if (!html.includes('id="' + id + '"')) throw new Error('missing #' + id);
        }
        return page.path;
    });
}

for (const api of apis) {
    await check('API ' + api, async () => {
        const res = await fetch(base + api);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'not ok');
        return 'ok';
    });
}

console.log('');
if (failed) {
    console.error(failed + ' check(s) failed');
    process.exit(1);
}
console.log('All Next.js checks passed.');
