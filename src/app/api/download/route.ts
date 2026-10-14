import { NextResponse } from 'next/server';
import { isAllowedImageUrl, sanitizeFilename } from '@/lib/downloadProxy';

const MAX_BYTES = 15 * 1024 * 1024;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const filename = sanitizeFilename(searchParams.get('filename'));

  if (!rawUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  const url = isAllowedImageUrl(rawUrl);
  if (!url) {
    return new NextResponse('URL not allowed', { status: 400 });
  }

  try {
    // redirect: 'error' so an allowed host cannot bounce us somewhere else
    const response = await fetch(url, { redirect: 'error' });

    if (!response.ok) {
      console.error('Download proxy upstream error:', response.status, response.statusText, url.href);
      response.body?.cancel().catch(() => {});
      return new NextResponse('Failed to fetch image', { status: 502 });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      console.error('Download proxy non-image content-type:', contentType, url.href);
      response.body?.cancel().catch(() => {});
      return new NextResponse('Not an image', { status: 415 });
    }

    const declaredLength = Number(response.headers.get('content-length'));
    if (declaredLength > MAX_BYTES) {
      response.body?.cancel().catch(() => {});
      return new NextResponse('File too large', { status: 413 });
    }

    // Read with a hard cap, in case content-length is missing or wrong
    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = response.body?.getReader();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_BYTES) {
          reader.cancel().catch(() => {});
          return new NextResponse('File too large', { status: 413 });
        }
        chunks.push(value);
      }
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('X-Content-Type-Options', 'nosniff');

    return new NextResponse(new Blob(chunks as BlobPart[]), { headers });
  } catch (error) {
    console.error('Error in download proxy:', error, url.href);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
