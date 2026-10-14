import type { Metadata } from 'next';
import { NotFoundScreen } from '@/components/screens/NotFoundScreen';

export const metadata: Metadata = {
  title: 'Page not found | Hans & Czay',
};

export default function NotFound() {
  return <NotFoundScreen />;
}
