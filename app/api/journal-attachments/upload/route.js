import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import {
  JOURNAL_ATTACHMENT_MAX_BYTES,
  getFileExtension,
} from '@/server/lib/journal-attachment-policy.js';

const ALLOWED_EXTENSIONS = new Set(['pdf', 'hwp']);

export async function POST(request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const path = String(pathname || '').trim();
        if (!path.startsWith('journals/')) {
          throw new Error('유효하지 않은 업로드 경로입니다.');
        }

        const filename = path.split('/').pop() || '';
        const ext = getFileExtension(filename);
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          throw new Error('PDF 또는 HWP 파일만 업로드할 수 있습니다.');
        }

        return {
          maximumSizeInBytes: JOURNAL_ATTACHMENT_MAX_BYTES,
          addRandomSuffix: true,
          allowedContentTypes: [
            'application/pdf',
            'application/x-hwp',
            'application/haansofthwp',
            'application/vnd.hancom.hwp',
            'application/octet-stream',
          ],
        };
      },
      onUploadCompleted: async () => {
        // 메타데이터는 클라이언트가 업로드 완료 후 /api/journal-attachments 로 등록합니다.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error && error.message) || 'Upload failed' },
      { status: 400 },
    );
  }
}
