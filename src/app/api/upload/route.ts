import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { paths } from '@/lib/eventPaths';
import { MUSIC_MAX_BYTES, MUSIC_UPLOAD_PREFIX } from '@/lib/music';

// Issues short-lived Vercel Blob client-upload tokens to signed-in event
// members and platform owners only (Blob paths are not per event).
// The browser then uploads straight to Blob (see src/lib/blob/uploadImage.ts,
// and uploadAudio.ts for paths under music/, which get the audio type and cap).
// Auth is the Firebase ID token sent as clientPayload, not the `session`
// cookie: the editors already act with the client SDK login (auto-refreshed),
// while the 5-day session cookie can expire with the admin page still open.
async function assertAdmin(idToken: string | null) {
  if (!idToken) throw new Error('Missing ID token');

  const { uid } = await getAdminAuth().verifyIdToken(idToken, true);
  const admin = await getAdminDb().doc(paths.admin(uid)).get();
  const eventIds = admin.get('eventIds');
  const isMember = Array.isArray(eventIds) && eventIds.length > 0;
  if (!admin.exists || !(admin.get('role') === 'super' || isMember)) throw new Error('Not an admin');
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await assertAdmin(clientPayload);
        const isMusic = pathname.startsWith(MUSIC_UPLOAD_PREFIX);
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
