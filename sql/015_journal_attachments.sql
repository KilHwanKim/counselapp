-- 일지 첨부파일 메타데이터 (파일 본문은 Vercel Blob)

CREATE TABLE IF NOT EXISTS journal_attachments (
  id SERIAL PRIMARY KEY,
  journal_id INTEGER REFERENCES lesson_journals(id) ON DELETE SET NULL,
  actual_lesson_id INTEGER NOT NULL REFERENCES actual_lessons(id) ON DELETE CASCADE,
  blob_url TEXT NOT NULL,
  blob_pathname TEXT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_journal_attachments_journal_id ON journal_attachments(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_attachments_actual_lesson_id ON journal_attachments(actual_lesson_id);
CREATE INDEX IF NOT EXISTS idx_journal_attachments_active ON journal_attachments(actual_lesson_id, status);
