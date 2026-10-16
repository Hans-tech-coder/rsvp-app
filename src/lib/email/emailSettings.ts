// An event's email settings (`events/{eventId}/settings/email`, F13): the name
// guests see as the sender and the address their replies go to. Pure, so the
// Settings page, the server action and the RSVP email share one reading.

export type EmailSettings = {
  /** Shown as the sender ("Ana & Ben"); '' = the event's name. */
  senderName: string;
  /** Where a guest's reply goes; '' = back to the sending account. */
  replyTo: string;
};

export const SENDER_NAME_MAX = 60;

const EMAIL_PATTERN = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;

/** Saved doc (or nothing) -> settings, dropping anything malformed. */
export function readEmailSettings(raw: unknown): EmailSettings {
  const doc = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const senderName = typeof doc.senderName === 'string' ? cleanName(doc.senderName) : '';
  const replyTo = typeof doc.replyTo === 'string' && EMAIL_PATTERN.test(doc.replyTo.trim()) ? doc.replyTo.trim() : '';
  return { senderName: senderName.slice(0, SENDER_NAME_MAX), replyTo };
}

// Line breaks would end the From header; quotes and angle brackets would break out of the name.
const cleanName = (name: string) => name.replace(/[\r\n"<>]/g, ' ').replace(/\s+/g, ' ').trim();

/** Form input -> settings to save, or the message to show. */
export function checkEmailSettings(input: unknown): EmailSettings | { error: string } {
  const doc = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const senderName = cleanName(String(doc.senderName ?? ''));
  const replyTo = String(doc.replyTo ?? '').trim();
  if (senderName.length > SENDER_NAME_MAX) return { error: `Keep the sender name under ${SENDER_NAME_MAX} characters.` };
  if (replyTo && !EMAIL_PATTERN.test(replyTo)) return { error: 'The reply-to address does not look like an email address.' };
  return { senderName, replyTo };
}
