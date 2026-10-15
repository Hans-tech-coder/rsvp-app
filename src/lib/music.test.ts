import { describe, expect, it } from 'vitest';
import { DEFAULT_MUSIC, DEFAULT_MUSIC_URL, MUSIC_MIN_VOLUME, mergeMusic, musicSrc } from './music';

describe('music', () => {
  it('defaults: on, default track, half volume', () => {
    expect(mergeMusic(undefined)).toEqual(DEFAULT_MUSIC);
    expect(musicSrc(mergeMusic(undefined))).toBe(DEFAULT_MUSIC_URL);
  });

  it('keeps an https upload and its name', () => {
    const music = mergeMusic({ enabled: false, url: 'https://x.public.blob.vercel-storage.com/music/a.mp3', fileName: 'a.mp3', volume: 0.8 });
    expect(music).toEqual({ enabled: false, url: 'https://x.public.blob.vercel-storage.com/music/a.mp3', fileName: 'a.mp3', volume: 0.8 });
    expect(musicSrc(music)).toBe(music.url);
  });

  it('drops a non-https url (and its name) and clamps the volume', () => {
    const music = mergeMusic({ url: 'javascript:alert(1)', fileName: 'x', volume: 5, enabled: 'yes' });
    expect(music.url).toBe('');
    expect(music.fileName).toBe('');
    expect(music.volume).toBe(1);
    expect(music.enabled).toBe(true);
    expect(mergeMusic({ volume: 0 }).volume).toBe(MUSIC_MIN_VOLUME);
  });
});
