import type { Metadata } from 'next';
import { AudioPlayer } from '@/components/AudioPlayer';
import { ThemeStyle } from '@/components/ThemeStyle';
import { NotFoundScreen } from '@/components/screens/NotFoundScreen';
import { SiteTextProvider } from '@/contexts/SiteTextContext';
import { DEFAULT_EVENT_ID } from '@/lib/eventPaths';
import { getSiteContent } from '@/lib/siteContentServer';
import { fillText } from '@/lib/siteText';

// Any unknown URL, including an event that doesn't exist. Shows the default
// event's look and wording; "Back to the celebration" goes to `/`, which
// redirects there.

export async function generateMetadata(): Promise<Metadata> {
  const { global, siteText } = await getSiteContent(DEFAULT_EVENT_ID);
  return {
    title: fillText(siteText.notFound.pageTitle, { couple: global.coupleNameFormat }),
    icons: { icon: global.logo },
  };
}

export default async function NotFound() {
  const { global, siteText, theme } = await getSiteContent(DEFAULT_EVENT_ID);
  return (
    <SiteTextProvider value={siteText}>
      <ThemeStyle theme={theme} />
      <NotFoundScreen site={global} />
      <AudioPlayer />
    </SiteTextProvider>
  );
}
