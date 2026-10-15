import nodemailer from 'nodemailer';
import { getAdminDb } from '@/lib/firebase/admin';
import { mergeWeddingContent } from '@/lib/weddingContent';
import type { Venue } from '@/lib/genericContent';
import { paths } from '@/lib/eventPaths';
import { getEventUrl } from '@/lib/siteUrl';
import { mergeTheme, mixHex, type ThemeColors } from '@/lib/theme';

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

// Same merges as the guest site (mergeWeddingContent, mergeTheme), from the
// docs the email shows: names and date, the venues, the dress code, the colors.
async function loadEmailContent(eventId: string) {
  let content = mergeWeddingContent({});
  let theme = mergeTheme(undefined);
  try {
    const [globalSettings, details, dressCode, themeDoc] = await Promise.all(
      ['globalSettings', 'details', 'dressCode', 'theme'].map(async (id) =>
        (await getAdminDb().doc(paths.content(eventId, id)).get()).data()
      )
    );
    content = mergeWeddingContent({ globalSettings, details, dressCode });
    theme = mergeTheme(themeDoc);
  } catch (error) {
    console.error('RSVP email: using default content, Firestore read failed:', error);
  }
  const { global, details: { venues }, dressCode } = content;

  const parsed = new Date(global.targetDate);
  const date = Number.isNaN(parsed.getTime())
    ? global.targetDate
    : parsed.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return {
    couple: global.coupleNameFormat,
    date,
    venueShort: global.venueShort,
    heroImage: global.ogImage,
    venues,
    dressCode,
    colors: theme.colors,
  };
}

export type EmailContent = Awaited<ReturnType<typeof loadEmailContent>>;

// Email clients cannot read CSS variables, so the event's theme colors are
// inlined. `line` and `muted` are accent/30 and ink/70 blended over
// `surfaceSoft`, because many clients drop rgba() (0.699, not 0.7, keeps the
// default theme's muted at its original #B8B6B2: 0.7 lands on a rounding tie).
const emailColors = (theme: ThemeColors) => ({
  surface: theme.surface,
  surfaceSoft: theme.surfaceSoft,
  primaryDeep: theme.primaryDeep,
  primary: theme.primary,
  ink: theme.ink,
  accent: theme.accent,
  accentLight: theme.accentLight,
  line: mixHex(theme.surfaceSoft, theme.accent, 0.3),
  muted: mixHex(theme.surfaceSoft, theme.ink, 0.699),
});
type EmailColors = ReturnType<typeof emailColors>;

// The site's three fonts, loaded from Google Fonts. Clients that block web
// fonts (Gmail, Outlook) fall back to the closest system serif/sans.
const font = {
  cinzel: "'Cinzel','Trajan Pro',Georgia,'Times New Roman',serif",
  cormorant: "'Cormorant Garamond',Garamond,Georgia,'Times New Roman',serif",
  inter: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
};

const eyebrow = (c: EmailColors, text: string) =>
  `<div style="font-family:${font.inter};font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${c.accent};font-weight:600;">${text}</div>`;

const divider = (c: EmailColors, width = 80) =>
  `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:14px auto 0;"><tr>
    <td width="${width}" height="1" style="font-size:0;line-height:0;background:${c.accent};background-image:linear-gradient(90deg,${c.surfaceSoft},${c.accent},${c.surfaceSoft});">&nbsp;</td>
  </tr></table>`;

const sectionTitle = (c: EmailColors, subtitle: string, title: string) => `
  <div style="text-align:center;padding:40px 0 20px;">
    <div style="font-family:${font.cormorant};font-style:italic;font-size:16px;color:${c.accentLight};">${subtitle}</div>
    <div style="font-family:${font.cinzel};font-size:22px;letter-spacing:4px;color:${c.ink};margin-top:4px;">${title}</div>
    ${divider(c)}
  </div>`;

const venueBlock = (c: EmailColors, venue: Venue) => `
  <tr><td style="padding:0 0 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.surface};border:1px solid ${c.line};border-radius:6px;">
      <tr><td style="padding:22px 22px 24px;text-align:center;">
        ${venue.subtitle ? `<div style="font-family:${font.cormorant};font-style:italic;font-size:15px;color:${c.accentLight};">${escapeHtml(venue.subtitle)}</div>` : ''}
        <div style="font-family:${font.cinzel};font-size:17px;letter-spacing:3px;color:${c.ink};margin-top:2px;">${escapeHtml(venue.title)}</div>
        ${venue.time ? `<div style="margin-top:10px;">${eyebrow(c, escapeHtml(venue.time))}</div>` : ''}
        <div style="font-family:${font.cormorant};font-size:19px;line-height:1.35;color:${c.ink};margin-top:12px;">${escapeHtml(venue.location)}</div>
        <div style="font-family:${font.inter};font-size:12px;line-height:1.6;color:${c.muted};margin-top:4px;">${escapeHtml(venue.address)}</div>
        ${venue.calendarLoc ? `<a href="${escapeHtml(venue.calendarLoc)}" style="display:inline-block;margin-top:16px;padding:9px 20px;border:1px solid ${c.accent};border-radius:2px;font-family:${font.inter};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${c.accent};text-decoration:none;">View Map</a>` : ''}
      </td></tr>
    </table>
  </td></tr>`;

const swatches = (c: EmailColors, colors: { hex: string; name: string }[]) =>
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

/** Pure: the email for one RSVP. Exported so it can be rendered without sending. */
export function buildEmail(data: RsvpEmailData, content: EmailContent, siteUrl: string) {
  const c = emailColors(content.colors);
  const attending = data.willAttend === 'Yes';
  // A guest who declines but sends a proxy still gets the venue details to pass on.
  const showDetails = attending || Boolean(data.proxyName);
  const name = escapeHtml(data.fullName);
  const proxy = escapeHtml(data.proxyName || '');
  const couple = escapeHtml(content.couple);
  const date = escapeHtml(content.date);

  const intro = attending
    ? `Thank you for joyfully accepting our invitation! We have received your RSVP and we can't wait to celebrate with you on <span style="color:${c.accentLight};">${date}</span>.`
    : `Thank you for letting us know. We have received your RSVP and, while we will miss you, we are grateful for your love and well wishes.${
        proxy ? ` We look forward to welcoming <span style="color:${c.accentLight};">${proxy}</span> on your behalf. The details below are for them.` : ''
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
        ${eyebrow(c, label)}
        <div style="font-family:${font.cormorant};font-size:18px;line-height:1.45;color:${c.ink};margin-top:4px;white-space:pre-line;">${escapeHtml(value)}</div>
      </td></tr>`)
    .join('');

  const eventDetails = showDetails
    ? `
      ${sectionTitle(c, 'Mark your calendar', 'Where &amp; When')}
      <div style="text-align:center;font-family:${font.cormorant};font-style:italic;font-size:18px;color:${c.accentLight};margin:-4px 0 20px;">${date}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${content.venues.map((venue) => venueBlock(c, venue)).join('')}
      </table>
      ${sectionTitle(c, 'The style guideline', 'Dress Code')}
      <div style="text-align:center;">
        <div style="font-family:${font.cormorant};font-style:italic;font-size:22px;color:${c.accentLight};">${escapeHtml(content.dressCode.title)}</div>
        <p style="font-family:${font.cormorant};font-size:17px;line-height:1.6;color:${c.muted};margin:10px 0 0;">${escapeHtml(content.dressCode.description)}</p>
        ${swatches(c, content.dressCode.colors || [])}
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
    a { color:${c.accent}; }
    @media (max-width:480px) {
      .px { padding-left:22px !important; padding-right:22px !important; }
      .couple { font-size:30px !important; letter-spacing:4px !important; }
      .sep { display:none !important; }
      .venue { display:block !important; margin-top:6px; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${c.surface};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${c.surface}" style="background:${c.surface};">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${c.surfaceSoft};border:1px solid ${c.line};border-radius:10px;overflow:hidden;">
        ${content.heroImage ? `<tr><td style="font-size:0;line-height:0;"><img src="${escapeHtml(content.heroImage)}" width="600" alt="${couple}" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>` : ''}
        <tr><td class="px" bgcolor="${c.primaryDeep}" style="background:${c.primaryDeep};background-image:linear-gradient(180deg,${c.primaryDeep} 0%,${c.surfaceSoft} 100%);padding:40px 40px 36px;text-align:center;">
          <div style="font-family:${font.cormorant};font-style:italic;font-size:17px;color:${c.accentLight};">Your RSVP has been received</div>
          <div class="couple" style="font-family:${font.cinzel};font-size:38px;line-height:1.2;letter-spacing:6px;color:${c.ink};margin-top:8px;">${couple}</div>
          ${divider(c, 96)}
          <div style="margin-top:16px;">${eyebrow(c, `${date}${content.venueShort ? `<span class="sep"> &nbsp;&middot;&nbsp; </span><span class="venue">${escapeHtml(content.venueShort)}</span>` : ''}`)}</div>
        </td></tr>
        <tr><td class="px" style="padding:8px 40px 44px;">
          <p style="font-family:${font.cormorant};font-style:italic;font-size:22px;color:${c.accentLight};margin:24px 0 10px;">Dear ${name},</p>
          <p style="font-family:${font.cormorant};font-size:18px;line-height:1.65;color:${c.ink};margin:0;">${intro}</p>
          ${sectionTitle(c, 'A copy for your records', 'Your Response')}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.surface};border:1px solid ${c.line};border-radius:6px;">${summary}</table>
          ${eventDetails}
          <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:40px auto 0;"><tr>
            <td bgcolor="${c.primary}" style="background:${c.primary};border:1px solid ${c.accent};border-radius:2px;">
              <a href="${escapeHtml(siteUrl)}" style="display:inline-block;padding:15px 30px;font-family:${font.inter};font-size:11px;font-weight:500;letter-spacing:4px;text-transform:uppercase;color:${c.accent};text-decoration:none;">Visit Our Website</a>
            </td>
          </tr></table>
          <div style="text-align:center;margin-top:40px;">
            <div style="font-family:${font.cormorant};font-style:italic;font-size:18px;color:${c.accentLight};">With love,</div>
            <div style="font-family:${font.cinzel};font-size:22px;letter-spacing:4px;color:${c.ink};margin-top:6px;">${couple}</div>
          </div>
        </td></tr>
      </table>
      <div style="max-width:600px;font-family:${font.inter};font-size:11px;line-height:1.7;color:${c.muted};text-align:center;margin-top:20px;">
        If any of these details need to change, simply reply to this email.<br>
        <a href="${escapeHtml(siteUrl)}" style="color:${c.accent};text-decoration:none;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ''))}</a>
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
          ...content.venues.map((v) => `${v.title}${v.time ? ` (${v.time})` : ''}: ${[v.location, v.address].filter(Boolean).join(', ')}`),
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

export async function sendRsvpConfirmation(eventId: string, data: RsvpEmailData) {
  const user = process.env.GMAIL_USER?.trim();
  // Google shows the App Password in groups of four; the spaces are not part of it.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (!user || !pass) {
    console.warn('RSVP email skipped: GMAIL_USER or GMAIL_APP_PASSWORD is not set.');
    return;
  }

  const content = await loadEmailContent(eventId);
  const { subject, html, text } = buildEmail(data, content, getEventUrl(eventId));

  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  await transporter.sendMail({
    from: { name: `${content.couple} Wedding`, address: user },
    to: data.email,
    subject,
    html,
    text,
  });
}
