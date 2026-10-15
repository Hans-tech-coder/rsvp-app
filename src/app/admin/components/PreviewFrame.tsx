'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, RotateCw } from 'lucide-react';

// The guest site with its drafts, in a phone and/or desktop frame (F9). Each
// frame is an iframe of `/<eventId>?preview=<token>` drawn at the device's
// real size and scaled down to fit, so the site lays out exactly as on that
// device. Built to be the visual builder's canvas (F9a): `onFrameLoad` hands
// out each iframe once loaded (same origin, for postMessage).

export const DEVICES = {
  phone: { label: 'Phone', width: 390, height: 844 },
  desktop: { label: 'Desktop', width: 1440, height: 900 },
} as const;
export type Device = keyof typeof DEVICES;
type Mode = Device | 'both';

const GAP = 16;
/** In "both", the phone takes at most this share of the width. */
const PHONE_SHARE = 0.4;

interface PreviewFrameProps {
  eventId: string;
  /** Change it to reload the frames (e.g. after a draft save). */
  reloadKey: number;
  /** Starting mode; the admin can switch. */
  initialMode?: Mode;
  onFrameLoad?: (frame: HTMLIFrameElement, device: Device) => void;
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Scale of each shown device so they fit side by side in the area. */
function scales(mode: Mode, width: number, height: number): Partial<Record<Device, number>> {
  if (width <= 0 || height <= 0) return {};
  const fit = (d: Device, w: number) => Math.min(w / DEVICES[d].width, height / DEVICES[d].height);
  if (mode !== 'both') return { [mode]: fit(mode, width) };
  const phone = fit('phone', width * PHONE_SHARE);
  const desktop = fit('desktop', width - GAP - DEVICES.phone.width * phone);
  return { phone, desktop };
}

export function PreviewFrame({ eventId, reloadKey, initialMode = 'both', onFrameLoad }: PreviewFrameProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [areaRef, area] = useSize<HTMLDivElement>();
  const [manualReload, setManualReload] = useState(0);
  const token = `${reloadKey}-${manualReload}`;
  const src = `/${eventId}?preview=${token}`;
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const scale = scales(mode, area.width, area.height);

  const modes: { id: Mode; label: string }[] = [
    { id: 'phone', label: 'Phone' },
    { id: 'desktop', label: 'Desktop' },
    { id: 'both', label: 'Both' },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex items-center justify-between gap-2">
        <div role="radiogroup" aria-label="Preview size" className="inline-flex rounded-lg bg-gray-100 dark:bg-zinc-800 p-1">
          {modes.map((m) => (
            <button
              key={m.id}
              role="radio"
              aria-checked={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`min-h-9 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === m.id
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100'
                  : 'text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setManualReload((n) => n + 1)}
            aria-label="Reload preview"
            title="Reload preview"
            className="p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <RotateCw className="w-4 h-4" aria-hidden="true" />
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener"
            aria-label="Open preview in a new tab"
            title="Open preview in a new tab"
            className="p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div ref={areaRef} className="flex-1 min-h-0 flex items-start justify-center gap-4 overflow-hidden">
        {(Object.keys(DEVICES) as Device[]).map((device) => {
          const s = scale[device];
          if (s === undefined) return null;
          const { width, height, label } = DEVICES[device];
          const key = `${device}:${token}`;
          return (
            <div
              key={device}
              className="relative shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 shadow-sm"
              style={{ width: width * s, height: height * s }}
            >
              <iframe
                src={src}
                title={`${label} preview of the draft site`}
                onLoad={(e) => {
                  setLoaded((prev) => ({ ...prev, [key]: true }));
                  onFrameLoad?.(e.currentTarget, device);
                }}
                className="absolute top-0 left-0 border-0 origin-top-left"
                style={{ width, height, transform: `scale(${s})` }}
              />
              {!loaded[key] && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 dark:bg-zinc-950/80">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" aria-label="Loading preview" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
