import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getEventAccess } from '@/lib/requireAdmin';
import { isValidEventId } from '@/lib/eventPaths';
import { getEventDraftDocs } from '@/lib/siteContentServer';
import { CONTENT_DEFAULTS } from '@/lib/weddingContent';
import { PreviewSite } from './PreviewSite';

// Admin preview of an event with its unpublished drafts: `/<eventId>?preview=<token>`
// is rewritten here (next.config.ts). The token is any value (the content
// manager sends a fresh one per reload); access comes from the admin session
// of a member of this event (or a platform owner). Anyone else is sent to
// the live site. Rendered per request, never cached. The JSON defaults go to
// PreviewSite as a prop (in this page's payload), not as an import, so no
// public /_next/static chunk carries them.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Draft preview',
  robots: { index: false, follow: false },
};

export default async function PreviewPage({ params }: PageProps<'/[event]/preview'>) {
  const { event } = await params;
  if (!isValidEventId(event)) notFound();
  if (!(await getEventAccess(event))) redirect(`/${event}`);

  const docs = await getEventDraftDocs(event);
  if (!docs) notFound();

  return <PreviewSite eventId={event} docs={docs} defaults={CONTENT_DEFAULTS} />;
}
