import nodemailer from 'nodemailer';

// Server only. The one place email leaves the app. Today: one Gmail account
// over SMTP (GMAIL_USER + GMAIL_APP_PASSWORD), the same sender for every
// event; each event picks the name shown and the reply-to (settings/email).
// Moving to a transactional provider at upgrade time = a new branch in
// sendEmail with its API call, chosen by its own environment variables;
// callers stay as they are.

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Display name of the sender; the address is the sending account's. */
  fromName: string;
  replyTo?: string;
};

function gmailAccount() {
  const user = process.env.GMAIL_USER?.trim();
  // Google shows the App Password in groups of four; the spaces are not part of it.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  return user && pass ? { user, pass } : null;
}

/** The address emails are sent from, or null when sending is not set up. */
export function senderAddress(): string | null {
  return gmailAccount()?.user ?? null;
}

/** Sends the email; false (and a warning) when no sender is set up. */
export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  const gmail = gmailAccount();
  if (!gmail) {
    console.warn('Email skipped: GMAIL_USER or GMAIL_APP_PASSWORD is not set.');
    return false;
  }
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: gmail });
  await transporter.sendMail({
    from: { name: email.fromName, address: gmail.user },
    to: email.to,
    replyTo: email.replyTo || undefined,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  return true;
}
