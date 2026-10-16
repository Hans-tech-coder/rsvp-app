import { describe, expect, it } from 'vitest';
import { UNUSED_GRACE_MS, blobPathsIn, eventFolder, formatBytes, pickUnused, type StoredBlob } from './blobRefs';

const HOST = 'https://abc123.public.blob.vercel-storage.com';

describe('blobPathsIn', () => {
  it('finds Blob URLs anywhere in nested data, without query strings', () => {
    const doc = {
      backgroundImage: `${HOST}/images/welcome-bg-x1.webp`,
      groups: [{ people: [{ photo: `${HOST}/events/a/images/people-y2.webp?download=1` }] }],
      note: `see ${HOST}/gallery/photo-z3.webp and more`,
      items: [{ data: { url: `${HOST}/events/a/music/background-q.mp3` } }],
      other: 'https://example.com/images/welcome-bg-x1.webp',
      count: 3,
    };
    expect([...blobPathsIn(doc)].sort()).toEqual([
      'events/a/images/people-y2.webp',
      'events/a/music/background-q.mp3',
      'gallery/photo-z3.webp',
      'images/welcome-bg-x1.webp',
    ]);
  });

  it('decodes escaped characters so they match Blob pathnames', () => {
    expect([...blobPathsIn(`${HOST}/images/our%20story-a.webp`)]).toEqual(['images/our story-a.webp']);
  });

  it('adds to an existing set', () => {
    const set = new Set(['x']);
    blobPathsIn([`${HOST}/images/a.png`], set);
    expect(set).toEqual(new Set(['x', 'images/a.png']));
  });
});

describe('pickUnused', () => {
  const now = Date.UTC(2026, 9, 16);
  const old = new Date(now - UNUSED_GRACE_MS - 1);
  const blob = (pathname: string, uploadedAt = old): StoredBlob => ({ pathname, url: `${HOST}/${pathname}`, size: 10, uploadedAt });

  it('keeps used files, new files and files outside the app folders', () => {
    const blobs = [
      blob('events/a/images/used.webp'),
      blob('events/a/images/replaced.webp'),
      blob('images/old-replaced.webp'),
      blob('events/a/images/just-uploaded.webp', new Date(now - 1000)),
      blob('other-project/file.webp'),
    ];
    const used = new Set(['events/a/images/used.webp']);
    expect(pickUnused(blobs, used, now).map((b) => b.pathname)).toEqual([
      'events/a/images/replaced.webp',
      'images/old-replaced.webp',
    ]);
  });
});

describe('helpers', () => {
  it('names the event folder', () => {
    expect(eventFolder('ana-18th')).toBe('events/ana-18th/');
  });

  it('formats sizes', () => {
    expect(formatBytes(512 * 1024)).toBe('512 KB');
    expect(formatBytes(200 * 1024 * 1024)).toBe('200.0 MB');
  });
});
