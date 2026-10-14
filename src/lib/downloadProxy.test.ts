import { describe, expect, it } from 'vitest';
import { isAllowedImageUrl, sanitizeFilename } from './downloadProxy';

const BUCKET = 'our-wedding.firebasestorage.app';
const allowed = (url: string) => isAllowedImageUrl(url, BUCKET) !== null;

describe('isAllowedImageUrl', () => {
  it('allows a Vercel Blob public URL', () => {
    expect(allowed('https://abc123.public.blob.vercel-storage.com/details/order.jpg')).toBe(true);
  });

  it('allows a legacy Firebase Storage URL for our bucket', () => {
    expect(
      allowed(`https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/details%2Forder.jpg?alt=media`),
    ).toBe(true);
  });

  it('rejects a Firebase Storage URL for another bucket', () => {
    expect(
      allowed('https://firebasestorage.googleapis.com/v0/b/someone-else.appspot.com/o/x.jpg?alt=media'),
    ).toBe(false);
  });

  it('rejects Firebase URLs when no bucket is configured', () => {
    expect(
      isAllowedImageUrl(`https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/x.jpg`, undefined),
    ).toBeNull();
  });

  it('rejects http:', () => {
    expect(allowed('http://abc123.public.blob.vercel-storage.com/order.jpg')).toBe(false);
  });

  it('rejects localhost', () => {
    expect(allowed('https://localhost/order.jpg')).toBe(false);
    expect(allowed('http://localhost:3000/api/download')).toBe(false);
  });

  it('rejects the cloud metadata address', () => {
    expect(allowed('http://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(allowed('https://169.254.169.254/latest/meta-data/')).toBe(false);
  });

  it('rejects a look-alike host', () => {
    expect(allowed('https://public.blob.vercel-storage.com.evil.com/order.jpg')).toBe(false);
    expect(allowed('https://evilpublic.blob.vercel-storage.com/order.jpg')).toBe(false);
  });

  it('rejects garbage and non-default ports', () => {
    expect(allowed('not a url')).toBe(false);
    expect(allowed('https://abc.public.blob.vercel-storage.com:8443/order.jpg')).toBe(false);
  });
});

describe('sanitizeFilename', () => {
  it('keeps a normal filename', () => {
    expect(sanitizeFilename('Order_of_Events.jpg')).toBe('Order_of_Events.jpg');
  });

  it('strips quotes and CR/LF', () => {
    expect(sanitizeFilename('a"b\r\nSet-Cookie: x.jpg')).toBe('abSet-Cookiex.jpg');
  });

  it('caps length and falls back', () => {
    expect(sanitizeFilename('a'.repeat(300))).toHaveLength(100);
    expect(sanitizeFilename('""')).toBe('download.jpg');
    expect(sanitizeFilename(null)).toBe('download.jpg');
  });
});
