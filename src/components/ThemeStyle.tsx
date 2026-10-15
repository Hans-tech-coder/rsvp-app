import { themeCss, type Theme } from '@/lib/theme';

// The event's colors as a :root style (server rendered, so the first paint has
// them). Unlayered, so it beats the defaults in Tailwind's `@layer theme`;
// on :root, so portals and the body background follow too. `mergeTheme`
// leaves only #RRGGBB values, which is what makes the raw HTML safe.
export function ThemeStyle({ theme }: { theme: Theme }) {
  return <style id="event-theme" dangerouslySetInnerHTML={{ __html: themeCss(theme.colors) }} />;
}
