import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AudioPlayer } from '@/components/AudioPlayer';
import { SiteTextProvider } from '@/contexts/SiteTextContext';
import { WeddingContentProvider } from '@/contexts/WeddingContentContext';
import { getEventContent, formatEventDate } from '@/lib/siteContentServer';
import { fillText } from '@/lib/siteText';
import { GuestSite } from './GuestSite';

// One event's guest site at /<eventId>. Built on the server on the first visit
// and cached (ISR); an admin save regenerates it via revalidateGuestSite(eventId).
// The hourly revalidate is only a safety net for a missed refresh.
export const revalidate = 3600;

/** No event is built at deploy time; each is built on its first visit. */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<'/[event]'>): Promise<Metadata> {
  const { event } = await params;
  const site = await getEventContent(event);
  // Here too, or the 404's title is replaced by the root one after hydration.
  if (!site) notFound();

  const { global } = site.content;
  const values = { couple: global.coupleNameFormat, date: formatEventDate(global.targetDate), venue: global.venueShort };
  const title = fillText(site.siteText.seo.title, values);
  const description = fillText(site.siteText.seo.description, values);

  return {
    title,
    description,
    icons: { icon: global.logo },
    openGraph: {
      title,
      description,
      url: `/${event}`,
      images: [{ url: global.ogImage, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [global.ogImage],
    },
  };
}

export default async function EventPage({ params }: PageProps<'/[event]'>) {
  const { event } = await params;
  const site = await getEventContent(event);
  if (!site) notFound();

  return (
    <SiteTextProvider value={site.siteText}>
      <WeddingContentProvider eventId={event} content={site.content}>
        <GuestSite />
      </WeddingContentProvider>
      <AudioPlayer />
    </SiteTextProvider>
  );
}
