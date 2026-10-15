// Which guest screens an event shows, in what order, and their names in the
// menu: the `content/screens` doc. Pure: read by the event page
// (siteContentServer.ts) for GuestSite.tsx, and by the Screens editor.

/** Every guest screen, in the Wedding template's order. Each is also its `siteText.menu` key. */
export const SCREEN_TYPES = [
  'welcome', 'ourStory', 'entourage', 'details', 'dressCode',
  'gallery', 'faqs', 'registry', 'rsvpCta', 'rsvp',
] as const;

export type ScreenType = (typeof SCREEN_TYPES)[number];

/** What admins call each screen (matches the content tab names; admin and the builder preview). */
export const SCREEN_NAMES: Record<ScreenType, string> = {
  welcome: 'Welcome Screen',
  ourStory: 'Timeline (Our Story)',
  entourage: 'People (Entourage)',
  details: 'Venues (Event Details)',
  dressCode: 'Dress Code',
  gallery: 'Gallery',
  faqs: 'FAQs',
  registry: 'Registry',
  rsvpCta: 'RSVP Call to Action',
  rsvp: 'RSVP Form',
};

export type ScreenConfig = {
  type: ScreenType;
  /** Off leaves the screen out of the flow and the menu */
  enabled: boolean;
  /** Name in the menu; '' uses the site text default (`siteText.menu[type]`) */
  label: string;
};

/** The `content/screens` doc. Array order is the step order. */
export type ScreensDoc = { screens: ScreenConfig[] };

/** Always first and always shown: the cover, where the music starts. */
export const PINNED_SCREEN: ScreenType = 'welcome';

/** The RSVP form: behind the invite-code lock. */
export const LOCKED_SCREEN: ScreenType = 'rsvp';

export const SCREEN_LABEL_MAX = 30;

export const DEFAULT_SCREENS: ScreenConfig[] = SCREEN_TYPES.map((type) => ({ type, enabled: true, label: '' }));

const isScreenType = (value: unknown): value is ScreenType =>
  typeof value === 'string' && (SCREEN_TYPES as readonly string[]).includes(value);

/**
 * A saved doc over the defaults: unknown or repeated screens are dropped, a
 * screen the doc lacks (added to the app later) goes back after the screen it
 * follows by default, and Welcome is kept first and on.
 */
export function mergeScreens(doc: unknown): ScreenConfig[] {
  const saved = doc && typeof doc === 'object' ? (doc as Record<string, unknown>).screens : undefined;
  const list: ScreenConfig[] = [];

  if (Array.isArray(saved)) {
    for (const item of saved) {
      if (!item || typeof item !== 'object') continue;
      const { type, enabled, label } = item as Record<string, unknown>;
      if (!isScreenType(type) || list.some((s) => s.type === type)) continue;
      list.push({
        type,
        enabled: typeof enabled === 'boolean' ? enabled : true,
        label: typeof label === 'string' ? label.trim().slice(0, SCREEN_LABEL_MAX) : '',
      });
    }
  }

  SCREEN_TYPES.forEach((type, i) => {
    if (list.some((s) => s.type === type)) return;
    const after = i === 0 ? -1 : list.findIndex((s) => s.type === SCREEN_TYPES[i - 1]);
    list.splice(after + 1, 0, { type, enabled: true, label: '' });
  });

  const pinned = list.findIndex((s) => s.type === PINNED_SCREEN);
  const [welcome] = list.splice(pinned, 1);
  return [{ ...welcome, enabled: true }, ...list];
}

/** The steps guests walk through: the shown screens, in order. */
export const visibleScreens = (screens: ScreenConfig[]) => screens.filter((s) => s.enabled);

/** The screen's name in the menu. */
export const screenLabel = (screen: ScreenConfig, menuText: Record<ScreenType, string>) =>
  screen.label || menuText[screen.type];
