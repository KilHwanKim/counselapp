// 일지 임시저장 (브라우저 localStorage, 수업별). 캘린더 모달과 일지 조회 페이지가 같은 키를 공유합니다.
const KEY_PREFIX = 'counselapp:journalDraft:';

export function readJournalDraft(lessonId) {
    try {
        const raw = localStorage.getItem(KEY_PREFIX + lessonId);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export function writeJournalDraft(lessonId, values) {
    try {
        localStorage.setItem(KEY_PREFIX + lessonId, JSON.stringify({ values, savedAt: Date.now() }));
    } catch (e) {}
}

export function removeJournalDraft(lessonId) {
    try { localStorage.removeItem(KEY_PREFIX + lessonId); } catch (e) {}
}

/**
 * 임시저장본이 있고 현재 값(initialSnapshot)과 다르면 불러올지 물어봅니다.
 * 불러오기를 선택하면 저장된 values를, 아니면 null을 반환합니다 (거절 시 임시저장본 삭제).
 */
export function promptRestoreJournalDraft(lessonId, initialSnapshot) {
    if (!lessonId) return null;
    const draft = readJournalDraft(lessonId);
    if (!draft || !draft.values) return null;
    if (JSON.stringify(draft.values) === initialSnapshot) {
        removeJournalDraft(lessonId);
        return null;
    }
    const savedAt = draft.savedAt ? new Date(draft.savedAt).toLocaleString('ko-KR') : '';
    if (!confirm('저장하지 않은 임시저장 내용이 있습니다' + (savedAt ? ' (' + savedAt + ')' : '') + '.\n불러올까요?')) {
        removeJournalDraft(lessonId);
        return null;
    }
    return draft.values;
}
