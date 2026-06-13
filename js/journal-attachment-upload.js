import { upload } from '@vercel/blob/client';

export async function uploadJournalAttachment(file, actualLessonId) {
    const pathname = 'journals/' + actualLessonId + '/' + file.name;
    return upload(pathname, file, {
        access: 'private',
        handleUploadUrl: '/api/journal-attachments/upload',
    });
}

export async function registerJournalAttachment({ journalId, actualLessonId, blob, file }) {
    const res = await fetch('/api/journal-attachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            journal_id: journalId,
            actual_lesson_id: actualLessonId,
            blob_url: blob.url,
            blob_pathname: blob.pathname,
            original_name: file.name,
            mime_type: file.type || '',
            size_bytes: file.size,
        }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
        throw new Error(data.error || '첨부파일 등록 실패');
    }
    return data.attachment;
}

export async function uploadAndRegisterJournalAttachments({ journalId, actualLessonId, files }) {
    const uploaded = [];
    for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const blob = await uploadJournalAttachment(file, actualLessonId);
        const attachment = await registerJournalAttachment({ journalId, actualLessonId, blob, file });
        uploaded.push(attachment);
    }
    return uploaded;
}
