/**
 * Smoke test: static pages, ES modules, and core APIs on local dev server.
 * Usage: node scripts/verify-modular-pages.js [baseUrl]
 */
const base = process.argv[2] || 'http://localhost:3000';

const pages = [
    { path: '/', name: 'index', module: '/js/pages/index-page.js', api: '/api/actual-lessons?year=2026&month=6' },
    { path: '/students.html', name: 'students', module: '/js/pages/students-page.js', api: '/api/students' },
    { path: '/lessons.html', name: 'lessons', module: '/js/pages/lessons-page.js', api: '/api/lessons' },
    { path: '/journals.html', name: 'journals', module: '/js/pages/journals-page.js', api: '/api/actual-lessons?year=2026&month=6' }
];

const utils = [
    '/js/app-header.js',
    '/js/utils/dom.js',
    '/js/utils/date.js',
    '/js/utils/color.js',
    '/js/utils/lesson.js',
    '/css/common.css',
    '/css/calendar.css'
];

let failed = 0;

async function check(label, url, test) {
    try {
        const res = await fetch(base + url);
        const detail = await test(res);
        console.log('OK  ', label, detail ? '- ' + detail : '');
    } catch (err) {
        failed += 1;
        console.error('FAIL', label, '-', err.message);
    }
}

console.log('Verifying counselapp modular pages at', base, '\n');

for (const page of pages) {
    await check(page.name + ' HTML', page.path, async (res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const html = await res.text();
        if (!html.includes('id="app-header-container"')) throw new Error('missing app-header-container');
        if (!html.includes('type="module"')) throw new Error('missing type=module script');
        if (!html.includes(page.module)) throw new Error('missing module ref ' + page.module);
        return page.module;
    });

    await check(page.name + ' module', page.module, async (res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const js = await res.text();
        if (!js.includes('export function init')) throw new Error('missing init export');
        return String(js.split('\n').length) + ' lines';
    });

    await check(page.name + ' API', page.api, async (res) => {
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'api not ok');
        return 'ok';
    });
}

for (const url of utils) {
    await check('asset ' + url, url, async (res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        if (url === '/js/app-header.js') {
            const js = await res.text();
            if (!js.includes('카카오 계정 연결')) throw new Error('missing unified kakao header');
        }
        return res.headers.get('content-type') || '';
    });
}

console.log('');
if (failed) {
    console.error(failed + ' check(s) failed');
    process.exit(1);
}
console.log('All checks passed.');
