import fs from 'fs';

const pages = [
    { file: 'journals.html', init: 'initJournalsPage', module: 'journals-page.js' },
    { file: 'lessons.html', init: 'initLessonsPage', module: 'lessons-page.js' }
];

for (const { file, init, module } of pages) {
    let html = fs.readFileSync(file, 'utf8');
    const marker = '<script src="/js/sidebar.js"></script>';
    const idx = html.indexOf(marker);
    if (idx < 0) throw new Error('no sidebar in ' + file);
    const end = html.indexOf('</body>', idx);
    const replacement = [
        marker,
        '    <script src="/js/student-picker.js"></script>',
        '    <script type="module">',
        "        import { " + init + " } from '/js/pages/" + module + "';",
        '        ' + init + '();',
        '    </script>',
        ''
    ].join('\n');
    html = html.slice(0, idx) + replacement + html.slice(end);
    fs.writeFileSync(file, html);
    console.log('updated', file);
}
