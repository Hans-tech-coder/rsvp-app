import { NextResponse } from 'next/server';
import { releaseEditLock } from '@/app/actions/editLock';

// Frees the visual builder's edit lock when its tab closes or leaves the
// site: the builder sends `navigator.sendBeacon` here on `pagehide`, which the
// browser delivers even while unloading (a server action call would be
// cancelled). Same checks as releaseEditLock: the session cookie (sent with
// the beacon) must have access to the event, and only the holder's own lock
// is deleted.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await releaseEditLock(String(body?.eventId ?? ''), String(body?.holder ?? ''));
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
