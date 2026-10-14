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
      dressCode.colors = dress.colors ?? dressCode.colors;
    }

    const g = globalDoc.data();
    if (g) {
      global.coupleNameFormat = g.coupleNameFormat || global.coupleNameFormat;
      global.targetDate = g.targetDate || global.targetDate;
      global.ogImage = g.ogImage || global.ogImage;
      global.venueShort = g.venueShort || global.venueShort;
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

  return {
    couple: global.coupleNameFormat,
    date,
    venueShort: global.venueShort,
    heroImage: global.ogImage,
    ceremony,
    reception,
    dressCode,
  };
}

// Email clients cannot read the CSS variables in globals.css, so the @theme
// tokens are copied here. `line` and `muted` are gold/30 and cream/70 blended
// over `softdark`, because many clients drop rgba().
const c = {
  dark: '#12100E',
  softdark: '#1A1715',
  deepburgundy: '#2E000B',
  burgundy: '#800020',
  cream: '#FCFAF6',
  gold: '#C5A059',
  goldlight: '#E0C79B',
  line: '#4D4029',
  muted: '#B8B6B2',
};

// The site's three fonts, loaded from Google Fonts. Clients that block web
// fonts (Gmail, Outlook) fall back to the closest system serif/sans.
const font = {
  cinzel: "'Cinzel','Trajan Pro',Georgia,'Times New Roman',serif",
  cormorant: "'Cormorant Garamond',Garamond,Georgia,'Times New Roman',serif",
  inter: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
};

const SITE_URL = 'https://hans-czay-wedding.vercel.app';

const eyebrow = (text: string) =>
  `<div style="font-family:${font.inter};font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${c.gold};font-weight:600;">${text}</div>`;

const divider = (width = 80) =>
  `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:14px auto 0;"><tr>
    <td width="${width}" height="1" style="font-size:0;line-height:0;background:${c.gold};background-image:linear-gradient(90deg,${c.softdark},${c.gold},${c.softdark});">&nbsp;</td>
  </tr></table>`;

const sectionTitle = (subtitle: string, title: string) => `
  <div style="text-align:center;padding:40px 0 20px;">
    <div style="font-family:${font.cormorant};font-style:italic;font-size:16px;color:${c.goldlight};">${subtitle}</div>
    <div style="font-family:${font.cinzel};font-size:22px;letter-spacing:4px;color:${c.cream};margin-top:4px;">${title}</div>
    ${divider()}
  </div>`;

type Venue = { title: string; subtitle?: string; location: string; address: string; time: string; calendarLoc: string };

const venueBlock = (venue: Venue) => `
  <tr><td style="padding:0 0 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.dark};border:1px solid ${c.line};border-radius:6px;">
      <tr><td style="padding:22px 22px 24px;text-align:center;">
        ${venue.subtitle ? `<div style="font-family:${font.cormorant};font-style:italic;font-size:15px;color:${c.goldlight};">${escapeHtml(venue.subtitle)}</div>` : ''}
        <div style="font-family:${font.cinzel};font-size:17px;letter-spacing:3px;color:${c.cream};margin-top:2px;">${escapeHtml(venue.title)}</div>
        <div style="margin-top:10px;">${eyebrow(escapeHtml(venue.time))}</div>
        <div style="font-family:${font.cormorant};font-size:19px;line-height:1.35;color:${c.cream};margin-top:12px;">${escapeHtml(venue.location)}</div>
        <div style="font-family:${font.inter};font-size:12px;line-height:1.6;color:${c.muted};margin-top:4px;">${escapeHtml(venue.address)}</div>
        ${venue.calendarLoc ? `<a href="${escapeHtml(venue.calendarLoc)}" style="display:inline-block;margin-top:16px;padding:9px 20px;border:1px solid ${c.gold};border-radius:2px;font-family:${font.inter};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${c.gold};text-decoration:none;">View Map</a>` : ''}
      </td></tr>
    </table>
  </td></tr>`;

const swatches = (colors: { hex: string; name: string }[]) =>
  colors.length
    ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:22px auto 0;"><tr>
        ${colors
          .map(
            (color) => `<td align="center" valign="top" style="padding:0 6px;width:62px;">
              <div style="width:34px;height:34px;border-radius:50%;background:${escapeHtml(color.hex)};border:1px solid ${c.line};margin:0 auto;"></div>
              <div style="font-family:${font.inter};font-size:9px;line-height:1.4;letter-spacing:1px;text-transform:uppercase;color:${c.muted};margin-top:8px;">${escapeHtml(color.name)}</div>
            </td>`
          )
          .join('')}
      </tr></table>`
    : '';

function buildEmail(data: RsvpEmailData, content: Awaited<ReturnType<typeof loadEmailContent>>) {
  const attending = data.willAttend === 'Yes';
  // A guest who declines but sends a proxy still gets the venue details to pass on.
  const showDetails = attending || Boolean(data.proxyName);
  const name = escapeHtml(data.fullName);
  const proxy = escapeHtml(data.proxyName || '');
  const couple = escapeHtml(content.couple);
  const date = escapeHtml(content.date);

  const intro = attending
    ? `Thank you for joyfully accepting our invitation! We have received your RSVP and we can't wait to celebrate with you on <span style="color:${c.goldlight};">${date}</span>.`
    : `Thank you for letting us know. We have received your RSVP and, while we will miss you, we are grateful for your love and well wishes.${
        proxy ? ` We look forward to welcoming <span style="color:${c.goldlight};">${proxy}</span> on your behalf. The details below are for them.` : ''
      }`;

  const summaryRows: [string, string][] = [
    ['Name', data.fullName],
    ['Attendance', attending ? 'Joyfully Accepts' : 'Regretfully Declines'],
    ['Phone', data.phoneNumber],
  ];
  if (data.proxyName) summaryRows.push(['Proxy', data.proxyName]);
  if (data.message) summaryRows.push(['Your message', data.message]);

  const summary = summaryRows
    .map(([label, value], i) => `
      <tr><td style="padding:14px 22px;${i ? `border-top:1px solid ${c.line};` : ''}">
        ${eyebrow(label)}
        <div style="font-family:${font.cormorant};font-size:18px;line-height:1.45;color:${c.cream};margin-top:4px;white-space:pre-line;">${escapeHtml(value)}</div>
      </td></tr>`)
    .join('');

  const eventDetails = showDetails
    ? `
      ${sectionTitle('Mark your calendar', 'Where &amp; When')}
      <div style="text-align:center;font-family:${font.cormorant};font-style:italic;font-size:18px;color:${c.goldlight};margin:-4px 0 20px;">${date}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${venueBlock(content.ceremony)}
        ${venueBlock(content.reception)}
      </table>
      ${sectionTitle('The style guideline', 'Dress Code')}
      <div style="text-align:center;">
        <div style="font-family:${font.cormorant};font-style:italic;font-size:22px;color:${c.goldlight};">${escapeHtml(content.dressCode.title)}</div>
        <p style="font-family:${font.cormorant};font-size:17px;line-height:1.6;color:${c.muted};margin:10px 0 0;">${escapeHtml(content.dressCode.description)}</p>
        ${swatches(content.dressCode.colors || [])}
      </div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${couple}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
    body { margin:0; padding:0; }
    a { color:${c.gold}; }
    @media (max-width:480px) {
      .px { padding-left:22px !important; padding-right:22px !important; }
      .couple { font-size:30px !important; letter-spacing:4px !important; }
      .sep { display:none !important; }
      .venue { display:block !important; margin-top:6px; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${c.dark};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${c.dark}" style="background:${c.dark};">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${c.softdark};border:1px solid ${c.line};border-radius:10px;overflow:hidden;">
        ${content.heroImage ? `<tr><td style="font-size:0;line-height:0;"><img src="${escapeHtml(content.heroImage)}" width="600" alt="${couple}" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>` : ''}
        <tr><td class="px" bgcolor="${c.deepburgundy}" style="background:${c.deepburgundy};background-image:linear-gradient(180deg,${c.deepburgundy} 0%,${c.softdark} 100%);padding:40px 40px 36px;text-align:center;">
          <div style="font-family:${font.cormorant};font-style:italic;font-size:17px;color:${c.goldlight};">Your RSVP has been received</div>
          <div class="couple" style="font-family:${font.cinzel};font-size:38px;line-height:1.2;letter-spacing:6px;color:${c.cream};margin-top:8px;">${couple}</div>
          ${divider(96)}
          <div style="margin-top:16px;">${eyebrow(`${date}${content.venueShort ? `<span class="sep"> &nbsp;&middot;&nbsp; </span><span class="venue">${escapeHtml(content.venueShort)}</span>` : ''}`)}</div>
        </td></tr>
        <tr><td class="px" style="padding:8px 40px 44px;">
          <p style="font-family:${font.cormorant};font-style:italic;font-size:22px;color:${c.goldlight};margin:24px 0 10px;">Dear ${name},</p>
          <p style="font-family:${font.cormorant};font-size:18px;line-height:1.65;color:${c.cream};margin:0;">${intro}</p>
          ${sectionTitle('A copy for your records', 'Your Response')}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.dark};border:1px solid ${c.line};border-radius:6px;">${summary}</table>
          ${eventDetails}
          <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:40px auto 0;"><tr>
            <td bgcolor="${c.burgundy}" style="background:${c.burgundy};border:1px solid ${c.gold};border-radius:2px;">
              <a href="${SITE_URL}" style="display:inline-block;padding:15px 30px;font-family:${font.inter};font-size:11px;font-weight:500;letter-spacing:4px;text-transform:uppercase;color:${c.gold};text-decoration:none;">Visit Our Website</a>
            </td>
          </tr></table>
          <div style="text-align:center;margin-top:40px;">
            <div style="font-family:${font.cormorant};font-style:italic;font-size:18px;color:${c.goldlight};">With love,</div>
            <div style="font-family:${font.cinzel};font-size:22px;letter-spacing:4px;color:${c.cream};margin-top:6px;">${couple}</div>
          </div>
        </td></tr>
      </table>
      <div style="max-width:600px;font-family:${font.inter};font-size:11px;line-height:1.7;color:${c.muted};text-align:center;margin-top:20px;">
        If any of these details need to change, simply reply to this email.<br>
        <a href="${SITE_URL}" style="color:${c.gold};text-decoration:none;">hans-czay-wedding.vercel.app</a>
      </div>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Dear ${data.fullName},`,
    '',
    attending
      ? `Thank you for joyfully accepting our invitation! We have received your RSVP and can't wait to celebrate with you on ${content.date}.`
      : `Thank you for letting us know. We have received your RSVP and are grateful for your love and well wishes.${
          data.proxyName ? ` We look forward to welcoming ${data.proxyName} on your behalf. The details below are for them.` : ''
        }`,
    '',
    'Your response:',
    ...summaryRows.map(([label, value]) => `- ${label}: ${value}`),
    ...(showDetails
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
