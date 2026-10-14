import type { Metadata } from 'next';
import { NotFoundScreen } from '@/components/screens/NotFoundScreen';
import { getSiteContent } from '@/lib/siteContentServer';
import { fillText } from '@/lib/siteText';

export async function generateMetadata(): Promise<Metadata> {
  const { global, siteText } = await getSiteContent();
  return { title: fillText(siteText.notFound.pageTitle, { couple: global.coupleNameFormat }) };
}

export default async function NotFound() {
  const { global } = await getSiteContent();
  return <NotFoundScreen site={global} />;
}
