import { redirect } from 'next/navigation';
import { DEFAULT_EVENT_ID } from '@/lib/eventPaths';

// The bare domain opens the default event (old links to `/` keep working).
export default function Home() {
  redirect(`/${DEFAULT_EVENT_ID}`);
}
