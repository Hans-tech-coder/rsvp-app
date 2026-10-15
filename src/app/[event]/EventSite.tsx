import { AudioPlayer } from '@/components/AudioPlayer';
import { ThemeStyle } from '@/components/ThemeStyle';
import { SiteTextProvider } from '@/contexts/SiteTextContext';
import { WeddingContentProvider } from '@/contexts/WeddingContentContext';
import type { getEventContent } from '@/lib/siteContentServer';
import { GuestSite } from './GuestSite';

type Site = NonNullable<Awaited<ReturnType<typeof getEventContent>>>;

/**
 * One event's guest site from its server-read content. Rendered by the cached
 * live page (src/app/[event]/page.tsx) and, with the drafts applied, by the
 * admin preview (src/app/[event]/preview/page.tsx), so the preview is the real site.
 */
export function EventSite({ eventId, site, preview = false }: { eventId: string; site: Site; preview?: boolean }) {
  return (
    <SiteTextProvider value={site.siteText}>
      <ThemeStyle theme={site.theme} />
      <WeddingContentProvider eventId={eventId} content={site.content}>
        <GuestSite screens={site.screens} preview={preview} />
      </WeddingContentProvider>
      <AudioPlayer music={site.music} />
      {preview && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none rounded-full bg-black/70 px-3 py-1 font-body text-[11px] font-medium tracking-wide text-white">
          Draft preview
        </div>
      )}
    </SiteTextProvider>
  );
}
