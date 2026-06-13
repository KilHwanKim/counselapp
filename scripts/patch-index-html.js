import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
    /<style>[\s\S]*?<\/style>/,
    '    <link rel="stylesheet" href="/css/common.css">\n    <link rel="stylesheet" href="/css/calendar.css">'
);

const sidebarIdx = html.indexOf('<script src="/js/sidebar.js"></script>');
const bodyEnd = html.indexOf('</body>', sidebarIdx);
const replacement = [
    '<script src="/js/sidebar.js"></script>',
    '    <script type="module">',
    "        import { initIndexPage } from '/js/pages/index-page.js';",
    '        initIndexPage();',
    '    </script>',
    ''
].join('\n');

html = html.slice(0, sidebarIdx) + replacement + html.slice(bodyEnd);
fs.writeFileSync('index.html', html);
console.log('updated index.html');
