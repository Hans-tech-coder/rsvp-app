import { NextResponse } from 'next/server';

// Clears the `session` cookie and sends the browser to the login page.
// Used by requireEventPage() when the cookie is invalid, expired, revoked,
// or belongs to an account with no access to the event.
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/admin/login', request.url));
  response.cookies.delete('session');
  return response;
}
