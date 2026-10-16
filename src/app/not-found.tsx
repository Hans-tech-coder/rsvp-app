import type { Metadata } from 'next';
import { NotFoundPage } from '@/components/screens/NotFoundScreen';
import { DEFAULT_EVENT_ID } from '@/lib/eventPaths';
import { getSiteContent } from '@/lib/siteContentServer';
import { fillText } from '@/lib/siteText';

// Any unknown URL, including an event that doesn't exist. Shows the default
// event's look and wording; "Back to the celebration" goes to `/`, which
// redirects there. Next sends this UI with every page (for a notFound() in
// the browser), so it carries no data: NotFoundPage fetches the default
// event's content when it shows. The metadata is only built for a real 404.

export async function generateMetadata(): Promise<Metadata> {
  const { global, siteText } = await getSiteContent(DEFAULT_EVENT_ID);
  return {
    title: fillText(siteText.notFound.pageTitle, { couple: global.coupleNameFormat }),
    icons: { icon: global.logo },
  };
}

export default function NotFound() {
  return <NotFoundPage />;
}
