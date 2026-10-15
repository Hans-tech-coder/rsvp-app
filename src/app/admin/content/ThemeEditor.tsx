'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { Loader2, Check, RotateCcw, CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react';
import {
  CONTRAST_PAIRS, CUSTOM_PRESET_ID, DEFAULT_THEME, THEME_COLOR_INFO, THEME_COLOR_KEYS, THEME_PRESETS,
  contrastLevel, contrastRatio, deriveShades, isHexColor, mergeTheme,
  type Theme, type ThemeColorKey, type ThemeColors,
} from '@/lib/theme';
import { FONT_FAMILIES, FONT_PAIRINGS, FONT_ROLES, FONT_ROLE_INFO, FONT_ROLE_VARS, fontStack, getFontPairing, type FontPairing } from '@/lib/fonts';
import { EditorSaveBar } from './EditorSaveBar';
import { useContentDraft } from './contentDraft';
import type { DocumentData } from 'firebase/firestore';

const MAIN_KEYS = THEME_COLOR_KEYS.filter((key) => !THEME_COLOR_INFO[key].shadeOf);
const SHADE_KEYS = THEME_COLOR_KEYS.filter((key) => THEME_COLOR_INFO[key].shadeOf);

/** A pairing's font roles as CSS variables, so font-heading/-elegant/-body inside follow it. */
const fontVars = (pairing: FontPairing) =>
  Object.fromEntries(FONT_ROLES.map((role) => [FONT_ROLE_VARS[role], fontStack(pairing, role)])) as CSSProperties;

/** The colors and fonts as CSS variables, so guest-site classes (bg-surface, text-accent, font-heading…) inside follow them. */
const themeVars = (colors: ThemeColors, pairing: FontPairing) => ({
  ...Object.fromEntries(THEME_COLOR_KEYS.map((key) => [THEME_COLOR_INFO[key].cssVar, colors[key]])),
  ...fontVars(pairing),
}) as CSSProperties;

// Colors and fonts of the guest site (`content/theme`). Written as CSS
// variables on the event page's :root at render (src/components/ThemeStyle.tsx),
// so a save is live after the page refresh, with no rebuild.
export function ThemeEditor({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const draft = useContentDraft(eventId, 'theme');
  const loadDraft = draft.load;

  const [formData, setFormData] = useState<Theme>(DEFAULT_THEME);
  const [originalData, setOriginalData] = useState<Theme>(DEFAULT_THEME);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
  const isDefault = JSON.stringify(formData) === JSON.stringify(DEFAULT_THEME);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadDraft();
        if (data) {
          const fetchedData = mergeTheme(data);
          setFormData(fetchedData);
          setOriginalData(fetchedData);
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [loadDraft]);

  const applyPreset = (id: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setFormData((prev) => ({ ...prev, preset: preset.id, colors: { ...preset.colors } }));
    setSaved(false);
  };

  const setFontPairing = (id: string) => {
    setFormData((prev) => ({ ...prev, fontPairing: id }));
    setSaved(false);
  };

  // Picking a main color also moves its shades; a shade can still be fine-tuned after.
  const setColor = (key: ThemeColorKey, value: string) => {
    setFormData((prev) => {
      const colors = { ...prev.colors, [key]: value.toUpperCase() };
      return { ...prev, preset: CUSTOM_PRESET_ID, colors: THEME_COLOR_INFO[key].shadeOf ? colors : deriveShades(colors, key) };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!(await draft.save(formData, { merge: false }))) return false;

      setOriginalData(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return true;
    } catch (error) {
      console.error('Error saving theme:', error);
      alert(`Failed to save changes: ${error instanceof Error ? error.message : error}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = (data: DocumentData) => {
    setFormData(mergeTheme(data));
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const { colors } = formData;
  const pairing = getFontPairing(formData.fontPairing);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-8 min-w-0">
          {/* Presets */}
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Color Palette</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                Start from a palette, then adjust any color below.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEME_PRESETS.map((preset) => {
                const active = formData.preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    aria-pressed={active}
                    className={`text-left p-3 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-zinc-100 ${
                      active
                        ? 'border-gray-900 dark:border-zinc-100 bg-gray-50 dark:bg-zinc-800'
                        : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex h-8 rounded-md overflow-hidden border border-black/10" aria-hidden="true">
                      {MAIN_KEYS.map((key) => (
                        <span key={key} className="flex-1" style={{ backgroundColor: preset.colors[key] }} />
                      ))}
                    </div>
                    <span className="mt-2 flex items-center justify-between gap-2 text-sm font-medium text-gray-900 dark:text-zinc-100">
                      {preset.name}
                      {active && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {formData.preset === CUSTOM_PRESET_ID && (
              <p className="text-sm text-gray-500 dark:text-zinc-400">Custom colors (changed from a palette).</p>
            )}
          </section>

          {/* Colors */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Colors</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {MAIN_KEYS.map((key) => (
                <ColorField key={key} colorKey={key} value={colors[key]} onChange={(v) => setColor(key, v)} />
              ))}
            </div>
            <details className="group rounded-xl border border-gray-200 dark:border-zinc-800">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-gray-700 dark:text-zinc-300">
                Fine-tune shades
                <span className="ml-2 font-normal text-gray-500 dark:text-zinc-400">(they follow their main color when you pick it)</span>
              </summary>
              <div className="grid sm:grid-cols-2 gap-4 p-4 pt-1">
                {SHADE_KEYS.map((key) => (
                  <ColorField key={key} colorKey={key} value={colors[key]} onChange={(v) => setColor(key, v)} />
                ))}
              </div>
            </details>
          </section>

          {/* Fonts */}
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Fonts</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                Three fonts chosen to go together: {FONT_ROLES.map((role) => FONT_ROLE_INFO[role].label.toLowerCase()).join(', ')}.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {FONT_PAIRINGS.map((option) => {
                const active = formData.fontPairing === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFontPairing(option.id)}
                    aria-pressed={active}
                    className={`text-left p-4 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-zinc-100 ${
                      active
                        ? 'border-gray-900 dark:border-zinc-100 bg-gray-50 dark:bg-zinc-800'
                        : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span style={fontVars(option)} className="block text-gray-900 dark:text-zinc-100" aria-hidden="true">
                      <span className="block font-heading text-xl uppercase tracking-[0.12em] truncate">Ana &amp; Ben</span>
                      <span className="block font-elegant italic text-lg leading-snug">together with their families</span>
                      <span className="block font-body text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-400 mt-1">RSVP · 3:00 PM</span>
                    </span>
                    <span className="mt-3 flex items-center justify-between gap-2 text-sm font-medium text-gray-900 dark:text-zinc-100">
                      {option.name}
                      {active && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-zinc-400">{option.mood}</span>
                    <span className="block text-xs text-gray-400 dark:text-zinc-500 mt-1">
                      {FONT_ROLES.map((role) => FONT_FAMILIES[option.fonts[role]].name).join(' · ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Contrast */}
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Readability</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                How easy text is to read on its background (WCAG contrast). Aim for 4.5 or more.
              </p>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-800">
              {CONTRAST_PAIRS.map((pair) => {
                const ratio = contrastRatio(colors[pair.text], colors[pair.background]);
                return (
                  <li key={pair.label} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className="w-10 h-10 shrink-0 rounded-md border border-black/10 flex items-center justify-center font-semibold"
                      style={{ color: colors[pair.text], backgroundColor: colors[pair.background] }}
                      aria-hidden="true"
                    >
                      Aa
                    </span>
                    <span className="flex-1 min-w-0 text-sm text-gray-900 dark:text-zinc-100">{pair.label}</span>
                    <span className="text-sm tabular-nums text-gray-500 dark:text-zinc-400">{ratio.toFixed(1)}:1</span>
                    <ContrastBadge ratio={ratio} />
                  </li>
                );
              })}
            </ul>
          </section>

          <button
            type="button"
            onClick={() => { setFormData(DEFAULT_THEME); setSaved(false); }}
            disabled={isDefault}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Reset to template default
          </button>
        </div>

        {/* Live preview with the guest site's own classes */}
        <div className="lg:sticky lg:top-0 self-start w-full">
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Preview</p>
          <ThemePreview colors={colors} pairing={pairing} />
        </div>
      </div>

      <EditorSaveBar draft={draft} hasChanges={hasChanges} saving={saving} saved={saved} onUndo={() => { setFormData(originalData); setSaved(false); }} onRestore={handleRestore} onSave={handleSave} />
    </div>
  );
}

function ColorField({ colorKey, value, onChange }: { colorKey: ThemeColorKey; value: string; onChange: (value: string) => void }) {
  const info = THEME_COLOR_INFO[colorKey];
  const id = `theme-${colorKey}`;
  // The hex box may hold half-typed text; only a full #RRGGBB is applied.
  const [draft, setDraft] = useState(value);
  // A new value from outside (preset, picker, reset) replaces the draft
  const [shown, setShown] = useState(value);
  if (value !== shown) {
    setShown(value);
    setDraft(value);
  }
  const invalid = !isHexColor(draft);

  return (
    <div className="flex items-start gap-3">
      <input
        type="color"
        value={value.toLowerCase()}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${info.label} color picker`}
        className="w-12 h-12 shrink-0 cursor-pointer rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent p-1"
      />
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="block text-sm font-medium text-gray-900 dark:text-zinc-100">{info.label}</label>
        <p className="text-xs text-gray-500 dark:text-zinc-400">{info.hint}</p>
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            const next = e.target.value.trim();
            setDraft(next);
            if (isHexColor(next)) onChange(next);
          }}
          onBlur={() => setDraft(value)}
          maxLength={7}
          spellCheck={false}
          aria-invalid={invalid}
          className={`mt-1 w-28 px-2 py-1 font-mono text-sm uppercase rounded-md border bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100 ${
            invalid ? 'border-red-500' : 'border-gray-300 dark:border-zinc-700'
          }`}
        />
      </div>
    </div>
  );
}

function ContrastBadge({ ratio }: { ratio: number }) {
  const level = contrastLevel(ratio);
  if (level === 'good') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 w-28 justify-end">
        <CircleCheck className="w-4 h-4" aria-hidden="true" /> Easy to read
      </span>
    );
  }
  if (level === 'large-only') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 w-28 justify-end">
        <TriangleAlert className="w-4 h-4" aria-hidden="true" /> Large text only
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 w-28 justify-end">
      <CircleAlert className="w-4 h-4" aria-hidden="true" /> Hard to read
    </span>
  );
}

/** A small mock of a guest screen, drawn with the guest site's classes under the edited variables. */
function ThemePreview({ colors, pairing }: { colors: ThemeColors; pairing: FontPairing }) {
  return (
    <div style={themeVars(colors, pairing)} className="font-body rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm" aria-hidden="true">
      <div className="relative bg-surface px-6 pt-8 pb-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-deep/80 to-transparent" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent-light">You are invited</p>
          <p className="mt-3 font-heading text-2xl text-accent">Event Title</p>
          <div className="w-12 h-px bg-accent/50 mx-auto my-3" />
          <p className="font-elegant italic text-lg text-ink/90">to a celebration</p>
        </div>
      </div>
      <div className="bg-surface px-6 pb-6 space-y-4">
        <div className="bg-surface-soft border border-accent-dark/40 rounded-lg p-4">
          <p className="font-heading text-sm text-accent">The Venue</p>
          <p className="mt-1 text-xs text-ink/80">3:00 PM · Venue address</p>
        </div>
        <div className="flex gap-4 justify-center text-[10px] uppercase tracking-[0.2em]">
          <span className="text-ink/60">Story</span>
          <span className="text-primary-light">Details</span>
          <span className="text-ink/60">Gallery</span>
        </div>
        <div className="w-full py-3 bg-primary border border-accent/30 text-accent text-xs tracking-[0.2em] font-medium uppercase rounded-sm text-center">
          RSVP Now
        </div>
      </div>
    </div>
  );
}
