// Each event's background music, the `content/music` doc. Pure: read by the
// server pages (siteContentServer.ts) for <AudioPlayer/>, and by the Music editor.

/** The `content/music` doc. An empty `url` plays the default track. */
export type Music = {
  /** Off hides the player and plays nothing */
  enabled: boolean;
  /** Uploaded track on Vercel Blob, or '' for DEFAULT_MUSIC_URL */
  url: string;
  /** Original file name of the upload, shown in the editor only */
  fileName: string;
  /** Volume when the music starts, 0.1 to 1 (guests can change it) */
  volume: number;
};

/** Ships with the site (public/), used when no track is uploaded. */
export const DEFAULT_MUSIC_URL = '/bg-music.mp3';

export const MUSIC_MIN_VOLUME = 0.1;

export const DEFAULT_MUSIC: Music = { enabled: true, url: '', fileName: '', volume: 0.5 };

/** Upload cap, also enforced by the Blob token in src/app/api/upload/route.ts. ~10 min of 128 kbps MP3. */
export const MUSIC_MAX_BYTES = 10 * 1024 * 1024;

/** Blob path prefix that gets the audio rules in the upload route. */
export const MUSIC_UPLOAD_PREFIX = 'music/';

const isHttpsUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

/** A saved doc over the default: a bad URL plays the default track, the volume is clamped. */
export function mergeMusic(doc: unknown): Music {
  const music = { ...DEFAULT_MUSIC };
  if (!doc || typeof doc !== 'object') return music;
  const { enabled, url, fileName, volume } = doc as Record<string, unknown>;
  if (typeof enabled === 'boolean') music.enabled = enabled;
  if (isHttpsUrl(url)) {
    music.url = url;
    if (typeof fileName === 'string') music.fileName = fileName;
  }
  if (typeof volume === 'number' && Number.isFinite(volume)) {
    music.volume = Math.round(Math.min(1, Math.max(MUSIC_MIN_VOLUME, volume)) * 100) / 100;
  }
  return music;
}

/** What the <audio> plays. */
export const musicSrc = (music: Music) => music.url || DEFAULT_MUSIC_URL;
