import { revalidateGuestSite } from '@/app/actions/admin';

/**
 * Call after writing the event's content: the guest page is cached on the
 * server, so it shows the change only once rebuilt. The write already
 * succeeded, so a failure is only logged (the page also refreshes itself
 * within the hour, see src/app/[event]/page.tsx).
 */
export async function refreshGuestSite(eventId: string) {
  const result = await revalidateGuestSite(eventId);
  if (!result.success) console.error('Guest site refresh failed:', result.error);
}
