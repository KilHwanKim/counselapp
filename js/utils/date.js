export function formatDate(input) {
    if (input instanceof Date) {
        return input.getFullYear() + '-' + String(input.getMonth() + 1).padStart(2, '0') + '-' + String(input.getDate()).padStart(2, '0');
    }
    if (!input) return '';
    const d = new Date(input);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const s = String(dateStr).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return String(dateStr);
    const parts = s.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return parts[0] + '년 ' + parts[1] + '월 ' + parts[2] + '일 (' + weekdays[date.getDay()] + ')';
}

export function calculateMonthAge(birthDateStr, referenceDateStr) {
    const birth = String(birthDateStr || '').slice(0, 10);
    const reference = String(referenceDateStr || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth) || !/^\d{4}-\d{2}-\d{2}$/.test(reference)) return null;
    const birthParts = birth.split('-').map(Number);
    const refParts = reference.split('-').map(Number);
    let months = (refParts[0] - birthParts[0]) * 12 + (refParts[1] - birthParts[1]);
    if (refParts[2] < birthParts[2]) months -= 1;
    return months >= 0 ? months : null;
}

export function formatLifeAge(birthDateStr, referenceDateStr) {
    const months = calculateMonthAge(birthDateStr, referenceDateStr);
    if (months == null) return '-';
    const years = Math.floor(months / 12);
    const monthsPart = months % 12;
    return years + '년 ' + monthsPart + '개월';
}

export function ageFromBirthDate(birthDateStr) {
    const s = String(birthDateStr || '').slice(0, 10);
    if (s.length < 10) return '';
    const parts = s.split('-').map(Number);
    const by = parts[0], bm = parts[1], bd = parts[2];
    if (!by || isNaN(by)) return '';
    const today = new Date();
    const ty = today.getFullYear(), tm = today.getMonth() + 1, td = today.getDate();
    let months = (ty - by) * 12 + (tm - (bm || 1));
    if (td < (bd || 1)) months -= 1;
    if (months < 0) return '';
    const years = Math.floor(months / 12);
    const monthsPart = months % 12;
    return years + '년 ' + monthsPart + '개월';
}

export function isSunday(dateStr) {
    const parts = dateStr.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]).getDay() === 0;
}

export function isSaturday(dateStr) {
    const parts = dateStr.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]).getDay() === 6;
}
