import { getAdmin } from '@/lib/requireAdmin';
import { CONTENT_DEFAULTS } from '@/lib/weddingContent';
import { ContentDefaultsProvider } from './contentDefaults';

// Hands the editors their defaults (contentDefaults.tsx) in this page's
// payload, and only to a signed-in admin; without a session the page shows
// no editor.
export default async function ContentLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  return <ContentDefaultsProvider value={admin ? CONTENT_DEFAULTS : null}>{children}</ContentDefaultsProvider>;
}
