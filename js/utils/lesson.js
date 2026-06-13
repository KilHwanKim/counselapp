export function getLessonTimeText(lesson) {
    return (lesson.start_time || '') && (lesson.end_time || '')
        ? lesson.start_time + ' - ' + lesson.end_time
        : (lesson.start_time || '-');
}

export function compareLessons(a, b) {
    const dateCompare = String(a.lesson_date || '').localeCompare(String(b.lesson_date || ''));
    if (dateCompare !== 0) return dateCompare;
    return String(a.start_time || '').localeCompare(String(b.start_time || ''));
}

export function compareLessonsByTime(a, b) {
    return String(a.start_time || '').localeCompare(String(b.start_time || ''));
}

export function getScheduledLessons(items) {
    return (items || []).filter((item) => (item.status || 'scheduled') !== 'cancelled');
}

export function getCancelledLessons(items) {
    return (items || []).filter((item) => (item.status || 'scheduled') === 'cancelled');
}
