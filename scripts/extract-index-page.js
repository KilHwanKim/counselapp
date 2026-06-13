/**
 * One-time helper: extracts index.html inline script into js/pages/index-page.js
 * Run: node scripts/extract-index-page.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const scriptStart = html.indexOf('const monthTitle = document.getElementById');
const scriptEndMarker = 'loadMonthLessons();';
const scriptEnd = html.lastIndexOf(scriptEndMarker, html.indexOf('</body>'));
if (scriptStart < 0 || scriptEnd < 0) throw new Error('Could not find index inline script');

let body = html.slice(scriptStart, scriptEnd + scriptEndMarker.length);

const stripFunctions = [
    /        function canUseLocalStorage\(\) \{[\s\S]*?        \}\n\n/g,
    /        function getJournalStorageKey\(lessonId\) \{[\s\S]*?        \}\n\n/g,
    /        function loadJournalForLesson\(lessonId\) \{[\s\S]*?        \}\n\n/g,
    /        function removeJournalForLesson\(lessonId\) \{[\s\S]*?        \}\n\n/g,
    /        function saveJournalForLesson\(lessonId, payload\) \{[\s\S]*?        \}\n\n/g,
    /        const JOURNAL_STORAGE_PREFIX = 'lesson_journals:';\n\n/g,
    /        \/\/ lesson\.id 별로[\s\S]*?        const JOURNAL_STORAGE_PREFIX = 'lesson_journals:';\n\n/g,
    /        const LESSON_COLOR_PALETTE = \[[^\]]+\];\n/,
    /        const JOURNAL_AMOUNT_OPTIONS = \[[\s\S]*?        \];\n\n/,
    /        function formatDate\(date\) \{[\s\S]*?        \}\n\n/,
    /        function formatDisplayDate\(dateStr\) \{[\s\S]*?        \}\n\n/,
    /        function getLessonTimeText\(lesson\) \{[\s\S]*?        \}\n\n/,
    /        function calculateMonthAge\(birthDateStr, referenceDateStr\) \{[\s\S]*?        \}\n\n/,
    /        function formatLifeAge\(birthDateStr, referenceDateStr\) \{[\s\S]*?        \}\n\n/,
    /        function escapeHtml\(value\) \{[\s\S]*?        \}\n\n/,
    /        function compareLessons\(a, b\) \{[\s\S]*?        \}\n\n/,
    /        function hashString\(value\) \{[\s\S]*?        \}\n\n/,
    /        function normalizeHexColor\(color\) \{[\s\S]*?        \}\n\n/,
    /        function hexToRgb\(hex\) \{[\s\S]*?        \}\n\n/,
    /        function colorWithAlpha\(hex, alpha\) \{[\s\S]*?        \}\n\n/,
    /        function darkenColor\(hex, ratio\) \{[\s\S]*?        \}\n\n/,
    /        function getFallbackLessonColor\(lesson\) \{[\s\S]*?        \}\n\n/,
    /        function getLessonColor\(lesson\) \{[\s\S]*?        \}\n\n/,
    /        function getScheduledLessons\(items\) \{[\s\S]*?        \}\n\n/,
    /        function getCancelledLessons\(items\) \{[\s\S]*?        \}\n\n/,
    /        function isSunday\(dateStr\) \{[\s\S]*?        \}\n\n/,
    /        function isSaturday\(dateStr\) \{[\s\S]*?        \}\n\n/,
];

for (const re of stripFunctions) {
    body = body.replace(re, '');
}

body = body.replace(/compareLessons/g, 'compareLessonsByTime');
body = body.replace(/^        /gm, '    ');

const header = `import { escapeHtml } from '../utils/dom.js';
import { formatDate, formatDisplayDate, formatLifeAge, isSunday, isSaturday } from '../utils/date.js';
import { getLessonColor, colorWithAlpha, darkenColor } from '../utils/color.js';
import { getLessonTimeText, compareLessonsByTime, getScheduledLessons, getCancelledLessons } from '../utils/lesson.js';
import { JOURNAL_AMOUNT_OPTIONS } from '../constants/journal.js';

export function initIndexPage() {
    Sidebar.render(document.getElementById('sidebar-container'), {
        activeMenu: null,
        togglePlaceholder: document.getElementById('sidebar-toggle')
    });

`;

const footer = '\n}\n';

const out = header + body + footer;
fs.writeFileSync(path.join(root, 'js', 'pages', 'index-page.js'), out, 'utf8');
console.log('Wrote js/pages/index-page.js (' + out.split('\n').length + ' lines)');
