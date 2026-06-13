export const LESSON_COLOR_PALETTE = ['#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6', '#EC4899', '#6366F1', '#84CC16', '#F97316'];

export function hashString(value) {
    const str = String(value || '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function normalizeHexColor(color) {
    const value = String(color || '').trim().toUpperCase();
    return /^#[0-9A-F]{6}$/.test(value) ? value : '';
}

export function hexToRgb(hex) {
    const normalized = normalizeHexColor(hex);
    if (!normalized) return null;
    return {
        r: parseInt(normalized.slice(1, 3), 16),
        g: parseInt(normalized.slice(3, 5), 16),
        b: parseInt(normalized.slice(5, 7), 16)
    };
}

export function colorWithAlpha(hex, alpha) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 'rgba(248,250,252,1)';
    return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')';
}

export function darkenColor(hex, ratio) {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#1F2937';
    const factor = 1 - (ratio || 0.22);
    const r = Math.max(0, Math.min(255, Math.round(rgb.r * factor)));
    const g = Math.max(0, Math.min(255, Math.round(rgb.g * factor)));
    const b = Math.max(0, Math.min(255, Math.round(rgb.b * factor)));
    return '#' + [r, g, b].map(function (v) { return v.toString(16).padStart(2, '0'); }).join('').toUpperCase();
}

export function getFallbackLessonColor(lesson) {
    const seed = lesson && lesson.student_id ? String(lesson.student_id) : String((lesson && lesson.student_name) || '');
    return LESSON_COLOR_PALETTE[hashString(seed) % LESSON_COLOR_PALETTE.length];
}

export function getLessonColor(lesson) {
    return normalizeHexColor(lesson && lesson.color) || getFallbackLessonColor(lesson);
}
