import { describe, expect, it } from 'vitest';
import { SENDER_NAME_MAX, checkEmailSettings, readEmailSettings } from './emailSettings';

describe('email settings', () => {
  it('reads nothing as the defaults', () => {
    expect(readEmailSettings(undefined)).toEqual({ senderName: '', replyTo: '' });
  });

  it('drops a malformed reply-to and header-breaking characters', () => {
    expect(readEmailSettings({ senderName: 'Ana\r\nBcc: x@y.z "<a>"', replyTo: 'not an email' }))
      .toEqual({ senderName: 'Ana Bcc: x@y.z a', replyTo: '' });
  });

  it('checks form input', () => {
    expect(checkEmailSettings({ senderName: '  Ana & Ben ', replyTo: ' ana@example.com ' }))
      .toEqual({ senderName: 'Ana & Ben', replyTo: 'ana@example.com' });
    expect(checkEmailSettings({ senderName: '', replyTo: '' })).toEqual({ senderName: '', replyTo: '' });
    expect(checkEmailSettings({ senderName: 'x', replyTo: 'ana@' })).toHaveProperty('error');
    expect(checkEmailSettings({ senderName: 'x'.repeat(SENDER_NAME_MAX + 1), replyTo: '' })).toHaveProperty('error');
  });
});
