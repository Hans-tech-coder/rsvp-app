import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { isValidEventId, paths } from '@/lib/eventPaths';
import { MUSIC_MAX_BYTES, MUSIC_UPLOAD_PREFIX } from '@/lib/music';
import { eventFolder } from '@/lib/blob/blobRefs';
import { getEventStorage } from '@/lib/blob/eventStorage';

// Issues short-lived Vercel Blob client-upload tokens to the event's members
// and platform owners only, for paths in that event's folder
// (`events/<eventId>/…`), while the event is under its storage cap.
// The browser then uploads straight to Blob (see src/lib/blob/uploadImage.ts,
// and uploadAudio.ts for paths under music/, which get the audio type and cap).
// Auth is the Firebase ID token sent in clientPayload, not the `session`
// cookie: the editors already act with the client SDK login (auto-refreshed),
// while the 5-day session cookie can expire with the admin page still open.
// A refusal reaches the browser only as "Failed to retrieve the client token";
// the editors then ask getUploadProblem (actions/settings.ts) for the reason.

function readPayload(clientPayload: string | null): { idToken: string; eventId: string } {
  const payload = JSON.parse(clientPayload ?? 'null') as { idToken?: unknown; eventId?: unknown } | null;
  if (typeof payload?.idToken !== 'string' || !isValidEventId(payload.eventId)) throw new Error('Missing ID token or event');
  return { idToken: payload.idToken, eventId: payload.eventId };
}

async function assertEventMember(idToken: string, eventId: string) {
  const { uid } = await getAdminAuth().verifyIdToken(idToken, true);
  const admin = await getAdminDb().doc(paths.admin(uid)).get();
  const eventIds = admin.get('eventIds');
  const isMember = Array.isArray(eventIds) && eventIds.includes(eventId);
  if (!admin.exists || !(admin.get('role') === 'super' || isMember)) throw new Error('Not a member of this event');
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const { idToken, eventId } = readPayload(clientPayload);
        await assertEventMember(idToken, eventId);

        const folder = eventFolder(eventId);
        if (!pathname.startsWith(folder)) throw new Error('Upload outside the event folder');
        const { usedBytes, capBytes } = await getEventStorage(eventId);
        if (usedBytes >= capBytes) throw new Error('Event storage is full');

        const isMusic = pathname.startsWith(folder + MUSIC_UPLOAD_PREFIX);
        return {
          allowedContentTypes: isMusic ? ['audio/*'] : ['image/*'],
          maximumSizeInBytes: isMusic ? MUSIC_MAX_BYTES : 20 * 1024 * 1024,
          addRandomSuffix: true,
          // Keep the ID token out of the signed client token.
          tokenPayload: null,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error issuing upload token:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
