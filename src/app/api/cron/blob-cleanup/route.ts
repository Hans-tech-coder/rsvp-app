import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { cleanUpUnusedFiles } from '@/lib/blob/eventStorage';

// Daily Vercel Cron (vercel.json): deletes the Blob files no event uses any
// more, a day after they stopped being used (src/lib/blob/eventStorage.ts).
// Vercel calls it with `Authorization: Bearer <CRON_SECRET>`; without the
// CRON_SECRET environment variable every call is refused.

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get('authorization') ?? '');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { files, bytes } = await cleanUpUnusedFiles(true);
    console.info(`Blob clean-up (cron): ${files} files, ${bytes} bytes deleted`);
    return NextResponse.json({ deletedFiles: files, deletedBytes: bytes });
  } catch (error) {
    console.error('Blob clean-up (cron) failed:', error);
    return NextResponse.json({ error: 'Clean-up failed' }, { status: 500 });
  }
}
