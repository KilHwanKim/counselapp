import { NextResponse } from 'next/server';
import {
  buildAttachmentContentDisposition,
  loadJournalAttachmentForDownload,
} from '@/server/handlers/journal-attachment-download.js';

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id');

  try {
    const result = await loadJournalAttachmentForDownload(id);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': buildAttachmentContentDisposition(result.originalName),
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err && err.message) || 'Download error' },
      { status: 503 },
    );
  }
}
