import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getAdmin } from '@/lib/requireAdmin';
import { isValidEventId } from '@/lib/eventPaths';
import { getEventDraftDocs } from '@/lib/siteContentServer';
import { PreviewSite } from './PreviewSite';

// Admin preview of an event with its unpublished drafts: `/<eventId>?preview=<token>`
// is rewritten here (next.config.ts). The token is any value (the content
// manager sends a fresh one per reload); access comes from the admin session.
// Anyone else is sent to the live site. Rendered per request, never cached.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Draft preview',
  robots: { index: false, follow: false },
};

export default async function PreviewPage({ params }: PageProps<'/[event]/preview'>) {
  const { event } = await params;
  if (!isValidEventId(event)) notFound();
  if (!(await getAdmin())) redirect(`/${event}`);

  const docs = await getEventDraftDocs(event);
  if (!docs) notFound();

  return <PreviewSite eventId={event} docs={docs} />;
}
