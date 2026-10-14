// Server-only. The site's public address, for links that leave the site
// (link previews, invite messages, emails). NEXT_PUBLIC_SITE_URL wins; on
// Vercel the production domain is set automatically; locally it is the dev
// server.

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return 'http://localhost:3000';
}

/** The event's guest site, e.g. https://example.com/hans-and-czay */
export function getEventUrl(eventId: string): string {
  return `${getSiteUrl()}/${eventId}`;
}
