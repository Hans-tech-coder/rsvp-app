import { DEFAULT_EVENT_ID } from '@/lib/eventPaths';
import { getSiteContent } from '@/lib/siteContentServer';
import { DEFAULT_CONTENT } from '@/lib/weddingContent';

// The 404 page's content: the default event's global settings, site text,
// theme and music, and the JSON defaults' welcome photo (the 404 always showed
// that one). The 404 (src/app/not-found.tsx) fetches it in the browser
// when it shows, because Next puts the root not-found UI into every page's
// payload; with the data in it, each event's page would carry the default
// event's names, place and date. Cached like the guest pages; publishing the
// default event refreshes it (revalidatePath('/', 'layout')).
export const revalidate = 3600;

export async function GET() {
  const content = await getSiteContent(DEFAULT_EVENT_ID);
  return Response.json({ ...content, backgroundImage: DEFAULT_CONTENT.welcomeScreen.backgroundImage });
}
