import { AudioPlayer } from '@/components/AudioPlayer';
import { ThemeStyle } from '@/components/ThemeStyle';
import { SiteTextProvider } from '@/contexts/SiteTextContext';
import { WeddingContentProvider } from '@/contexts/WeddingContentContext';
import type { EventSiteData } from '@/lib/eventSite';
import { GuestSite, type PreviewControl } from './GuestSite';

/**
 * One event's guest site from its content. Rendered by the cached live page
 * (src/app/[event]/page.tsx) and, with the drafts applied, by the admin
 * preview (src/app/[event]/preview/PreviewSite.tsx), so the preview is the real site.
 */
export function EventSite({ eventId, site, preview }: { eventId: string; site: EventSiteData; preview?: PreviewControl }) {
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
