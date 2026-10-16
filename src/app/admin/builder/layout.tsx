import { getAdmin } from '@/lib/requireAdmin';
import { CONTENT_DEFAULTS } from '@/lib/weddingContent';
import { ContentDefaultsProvider } from '../content/contentDefaults';

// Same as the content page's layout: the editors' defaults, for a signed-in admin only.
export default async function BuilderLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  return <ContentDefaultsProvider value={admin ? CONTENT_DEFAULTS : null}>{children}</ContentDefaultsProvider>;
}
