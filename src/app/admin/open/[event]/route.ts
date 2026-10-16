import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_EVENT_COOKIE, ADMIN_EVENT_COOKIE_OPTIONS, canOpenEvent } from '@/lib/requireAdmin';

// The event switcher (sidebar, events list): /admin/open/<eventId> makes that
// event the one every admin page shows, then opens its dashboard. A plain link,
// so the content editors' leave guard asks about unsaved edits first. An event
// the account cannot open goes back to the events list. Only picks which
// event is shown: every page and action still checks the role in it.
// `?to=builder` opens the visual builder instead (after the New Event wizard).
const TARGETS: Record<string, string> = { builder: '/admin/builder' };

export async function GET(request: NextRequest, ctx: RouteContext<'/admin/open/[event]'>) {
  const { event } = await ctx.params;
  if (!(await canOpenEvent(event))) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  const target = TARGETS[request.nextUrl.searchParams.get('to') ?? ''] ?? '/admin/dashboard';
  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(ADMIN_EVENT_COOKIE, event, ADMIN_EVENT_COOKIE_OPTIONS);
  return response;
}
