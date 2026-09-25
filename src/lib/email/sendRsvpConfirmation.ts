import nodemailer from 'nodemailer';
import { getAdminDb } from '@/lib/firebase/admin';
import weddingContent from '@/data/wedding-content.json';

// Server only. Sends the guest a confirmation of their RSVP through the
// couple's Gmail account (SMTP + App Password). Needs GMAIL_USER and
// GMAIL_APP_PASSWORD; when either is missing the email is skipped.

type RsvpEmailData = {
  fullName: string;
  email: string;
  phoneNumber: string;
  willAttend: 'Yes' | 'No';
  proxyName?: string;
  message?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Same precedence as WeddingContentContext: JSON defaults, then the `details`
// and `dressCode` docs, then the ceremony/reception fields in `globalSettings`.
async function loadEmailContent() {
  const global = { ...weddingContent.global };
  const ceremony = { ...weddingContent.details.ceremony };
  const reception = { ...weddingContent.details.reception };
  const dressCode = { ...weddingContent.dressCode };

  try {
    const [globalDoc, detailsDoc, dressCodeDoc] = await Promise.all(
      ['globalSettings', 'details', 'dressCode'].map((id) =>
        getAdminDb().collection('websiteContent').doc(id).get()
      )
    );

    const details = detailsDoc.data();
    if (details) {
      Object.assign(ceremony, details.ceremony || {});
      Object.assign(reception, details.reception || {});
    }

    const dress = dressCodeDoc.data();
    if (dress) {
      dressCode.title = dress.title ?? dressCode.title;
      dressCode.description = dress.description ?? dressCode.description;
    }

    const g = globalDoc.data();
    if (g) {
      global.coupleNameFormat = g.coupleNameFormat || global.coupleNameFormat;
      global.targetDate = g.targetDate || global.targetDate;
      ceremony.time = g.ceremonyTime || ceremony.time;
      ceremony.location = g.ceremonyLocation || ceremony.location;
      ceremony.address = g.ceremonyAddress || ceremony.address;
      reception.time = g.receptionTime || reception.time;
      reception.location = g.receptionLocation || reception.location;
      reception.address = g.receptionAddress || reception.address;
    }
  } catch (error) {
    console.error('RSVP email: using default content, Firestore read failed:', error);
  }

  const parsed = new Date(global.targetDate);
  const date = Number.isNaN(parsed.getTime())
    ? global.targetDate
    : parsed.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return { couple: global.coupleNameFormat, date, ceremony, reception, dressCode };
}

type Venue = { title: string; location: string; address: string; time: string; calendarLoc: string };

const venueBlock = (venue: Venue) => `
  <tr><td style="padding:12px 0;border-top:1px solid #e8dcc8;">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#BFA071;font-weight:bold;">${escapeHtml(venue.title)} &middot; ${escapeHtml(venue.time)}</div>
    <div style="font-size:16px;color:#4A1519;margin-top:4px;">${escapeHtml(venue.location)}</div>
    <div style="font-size:13px;color:#6b5a50;margin-top:2px;">${escapeHtml(venue.address)}</div>
    ${venue.calendarLoc ? `<a href="${escapeHtml(venue.calendarLoc)}" style="display:inline-block;margin-top:6px;font-size:13px;color:#841B2D;">Open in Google Maps &rarr;</a>` : ''}
  </td></tr>`;

function buildEmail(data: RsvpEmailData, content: Awaited<ReturnType<typeof loadEmailContent>>) {
  const attending = data.willAttend === 'Yes';
  const name = escapeHtml(data.fullName);
  const couple = escapeHtml(content.couple);

  const intro = attending
    ? `Thank you for joyfully accepting our invitation! We have received your RSVP and we can't wait to celebrate with you on <strong>${escapeHtml(content.date)}</strong>.`
    : `Thank you for letting us know. We have received your RSVP and, while we will miss you, we are grateful for your love and well wishes.`;

  const summaryRows: [string, string][] = [
    ['Name', data.fullName],
    ['Attendance', attending ? 'Joyfully Accepts' : 'Regretfully Declines'],
    ['Phone', data.phoneNumber],
  ];
  if (data.proxyName) summaryRows.push(['Proxy', data.proxyName]);
  if (data.message) summaryRows.push(['Your message', data.message]);

  const summary = summaryRows
    .map(([label, value]) => `
      <tr>
        <td style="padding:4px 12px 4px 0;font-size:13px;color:#8a7868;vertical-align:top;white-space:nowrap;">${label}</td>
        <td style="padding:4px 0;font-size:13px;color:#3a2a24;white-space:pre-line;">${escapeHtml(value)}</td>
      </tr>`)
    .join('');

  const eventDetails = attending
    ? `
      <h2 style="font-family:Georgia,serif;font-weight:normal;font-size:20px;color:#4A1519;margin:28px 0 4px;">Where &amp; When</h2>
      <div style="font-size:14px;color:#3a2a24;margin-bottom:8px;">${escapeHtml(content.date)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${venueBlock(content.ceremony)}
        ${venueBlock(content.reception)}
      </table>
      <h2 style="font-family:Georgia,serif;font-weight:normal;font-size:20px;color:#4A1519;margin:24px 0 4px;">Dress Code</h2>
      <div style="font-size:14px;color:#841B2D;font-weight:bold;">${escapeHtml(content.dressCode.title)}</div>
      <p style="font-size:13px;color:#6b5a50;line-height:1.6;margin:4px 0 0;">${escapeHtml(content.dressCode.description)}</p>`
    : '';

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F4F5EB;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5EB;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8dcc8;border-radius:8px;">
        <tr><td style="background:#4A1519;padding:28px 24px;text-align:center;border-radius:8px 8px 0 0;">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#BFA071;">R.S.V.P Received</div>
          <div style="font-family:Georgia,serif;font-size:28px;color:#F4F5EB;margin-top:6px;">${couple}</div>
        </td></tr>
        <tr><td style="padding:28px 24px;font-family:Arial,Helvetica,sans-serif;">
          <p style="font-size:15px;color:#3a2a24;margin:0 0 12px;">Dear ${name},</p>
          <p style="font-size:14px;color:#3a2a24;line-height:1.6;margin:0 0 20px;">${intro}</p>
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#BFA071;font-weight:bold;margin-bottom:6px;">Your Response</div>
          <table role="presentation" cellpadding="0" cellspacing="0">${summary}</table>
          ${eventDetails}
          <p style="font-size:13px;color:#6b5a50;line-height:1.6;margin:28px 0 0;">If any of these details need to change, simply reply to this email.</p>
          <p style="font-family:Georgia,serif;font-size:16px;color:#4A1519;margin:20px 0 0;">With love,<br>${couple}</p>
        </td></tr>
      </table>
      <div style="font-size:11px;color:#a09080;margin-top:12px;font-family:Arial,Helvetica,sans-serif;">https://hans-czay-wedding.vercel.app</div>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `Dear ${data.fullName},`,
    '',
    attending
      ? `Thank you for joyfully accepting our invitation! We have received your RSVP and can't wait to celebrate with you on ${content.date}.`
      : 'Thank you for letting us know. We have received your RSVP and are grateful for your love and well wishes.',
    '',
    'Your response:',
    ...summaryRows.map(([label, value]) => `- ${label}: ${value}`),
    ...(attending
      ? [
          '',
          `Where & When — ${content.date}`,
          `${content.ceremony.title} (${content.ceremony.time}): ${content.ceremony.location}, ${content.ceremony.address}`,
          `${content.reception.title} (${content.reception.time}): ${content.reception.location}, ${content.reception.address}`,
          '',
          `Dress code: ${content.dressCode.title}`,
        ]
      : []),
    '',
    'If any of these details need to change, simply reply to this email.',
    '',
    `With love,\n${content.couple}`,
  ].join('\n');

  const subject = attending
    ? `RSVP received — see you on ${content.date}!`
    : `RSVP received — thank you, ${data.fullName}`;

  return { subject, html, text };
}

export async function sendRsvpConfirmation(data: RsvpEmailData) {
  const user = process.env.GMAIL_USER?.trim();
  // Google shows the App Password in groups of four; the spaces are not part of it.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (!user || !pass) {
    console.warn('RSVP email skipped: GMAIL_USER or GMAIL_APP_PASSWORD is not set.');
    return;
  }

  const content = await loadEmailContent();
  const { subject, html, text } = buildEmail(data, content);

  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  await transporter.sendMail({
    from: { name: `${content.couple} Wedding`, address: user },
    to: data.email,
    subject,
    html,
    text,
  });
}
