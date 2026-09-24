import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

// Issues short-lived Vercel Blob client-upload tokens to signed-in admins only.
// The browser then uploads straight to Blob (see src/lib/blob/uploadImage.ts).
// Auth is the Firebase ID token sent as clientPayload, not the `session`
// cookie: the editors already act with the client SDK login (auto-refreshed),
// while the 5-day session cookie can expire with the admin page still open.
async function assertAdmin(idToken: string | null) {
  if (!idToken) throw new Error('Missing ID token');

  const { uid } = await getAdminAuth().verifyIdToken(idToken, true);
  const admin = await getAdminDb().collection('admins').doc(uid).get();
  if (!admin.exists) throw new Error('Not an admin');
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        await assertAdmin(clientPayload);
        return {
          allowedContentTypes: ['image/*'],
          maximumSizeInBytes: 20 * 1024 * 1024,
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
