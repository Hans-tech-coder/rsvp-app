'use client';

import { useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { createEvent } from '@/app/actions/events';
import { toEventId } from '@/lib/eventPaths';
import { joinNames } from '@/lib/genericContent';
import { getFontPairing } from '@/lib/fonts';
import { THEME_PRESETS, themeVars } from '@/lib/theme';
import { visibleScreens, type ScreenType } from '@/lib/screens';
import { EVENT_TYPES, TEMPLATES, type EventType, type TemplateInfo } from '@/lib/templates/catalog';

// The New Event wizard (F12): 1 template, 2 names / date / venue, 3 palette.
// The preview beside steps 2 and 3 is a small cover of the guest site in the
// template's fonts and the picked colors. Create opens the new event in the
// visual builder (/admin/open/<id>?to=builder).

const STEPS = ['Template', 'Details', 'Colors'] as const;

/** Short names of the screens for the template cards. */
const SECTION_NAMES: Record<ScreenType, string> = {
  welcome: 'Welcome', ourStory: 'Story', entourage: 'People', details: 'Venue', dressCode: 'Dress Code',
  gallery: 'Gallery', faqs: 'FAQs', registry: 'Registry', rsvpCta: 'RSVP', rsvp: 'RSVP Form',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2027-02-14" -> "February 14, 2027" (no time zone shift). */
function longDate(date: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}` : '';
}

/** The event name the wizard suggests until it is typed over. */
function suggestedName(type: EventType, hosts: string[]) {
  const [a, b] = hosts.map((h) => h.trim());
  if (!a) return '';
  switch (type) {
    case 'wedding': return b ? `${a} & ${b} Wedding` : '';
    case 'debut': return `${a}’s Debut`;
    case 'birthday': return b ? `${a} & ${b}’s Anniversary` : `${a}’s Birthday`;
    default: return '';
  }
}

const inputClass =
  'w-full min-h-11 px-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-zinc-100';
const primaryButton =
  'min-h-11 px-5 rounded-xl text-sm font-semibold bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity inline-flex items-center gap-2 disabled:opacity-50';
const secondaryButton =
  'min-h-11 px-4 rounded-xl text-sm font-medium text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-2';

export function NewEventWizard() {
  const ids = useId();
  const top = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [type, setType] = useState<EventType>('wedding');
  const [hosts, setHosts] = useState<string[]>(['', '']);
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [link, setLink] = useState('');
  const [linkEdited, setLinkEdited] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('15:00');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [palette, setPalette] = useState(TEMPLATES.wedding.palettes[0]);
  const [busy, setBusy] = useState(false);
  /** The server's answer to Create. */
  const [error, setError] = useState<string | null>(null);
  /** Next was pressed on Details: its problems show (and clear) as the fields change. */
  const [tried, setTried] = useState(false);

  const template = TEMPLATES[type];

  const applyName = (value: string) => {
    setName(value);
    // "Ana’s Debut" -> ana-debut, not anas-debut
    if (!linkEdited) setLink(toEventId(value.replace(/['’]s/g, '')));
  };

  const pickType = (next: EventType) => {
    setType(next);
    setPalette(TEMPLATES[next].palettes[0]);
    const nextHosts = TEMPLATES[next].hostFields.map((_, i) => hosts[i] ?? '');
    setHosts(nextHosts);
    if (!nameEdited) applyName(suggestedName(next, nextHosts));
  };

  const setHost = (index: number, value: string) => {
    const next = hosts.map((h, i) => (i === index ? value : h));
    setHosts(next);
    if (!nameEdited) applyName(suggestedName(type, next));
  };

  /** What blocks the Details step, in words, or null. */
  const detailsProblem = (): string | null => {
    const missing = template.hostFields.find((f, i) => !f.optional && !hosts[i]?.trim());
    if (missing) return `Fill in the ${missing.label.toLowerCase()}.`;
    if (!name.trim()) return 'Give the event a name.';
    if (!link.trim()) return 'Give the event a link.';
    if (!date || !time) return 'Pick the date and start time.';
    if (!venue.trim()) return 'Fill in the venue.';
    if (!city.trim()) return 'Fill in the town or city.';
    return null;
  };

  /** A new step starts at its top (on a phone the buttons are far down). */
  const goTo = (index: number) => {
    setStep(index);
    top.current?.scrollIntoView({ block: 'start' });
  };

  const next = () => {
    setError(null);
    if (step === 1) {
      setTried(true);
      if (detailsProblem()) return;
    }
    goTo(Math.min(step + 1, STEPS.length - 1));
  };

  const back = () => {
    setError(null);
    goTo(Math.max(step - 1, 0));
  };

  const create = async () => {
    if (busy) return;
    if (detailsProblem()) {
      setTried(true);
      goTo(1);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await createEvent({ type, name, hosts, start: `${date}T${time}`, venue, address, city, palette }, link);
    if (!result.success) {
      setError(result.error);
      setBusy(false);
      return;
    }
    // Makes the new event the current one and opens it in the builder.
    window.location.assign(`/admin/open/${result.eventId}?to=builder`);
  };

  const shownError = (step === 1 && tried ? detailsProblem() : null) ?? error;
  const shownNames = template.hostFields.length ? joinNames(hosts.map((h) => h.trim()).filter(Boolean)) : name.trim();

  return (
    <div ref={top} className="space-y-6 max-w-6xl scroll-mt-6">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 min-h-11">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> All Events
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">New event</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">Pick a template, fill in the basics, choose the colors. You can change everything later in the builder.</p>
      </div>

      <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? 'step' : undefined} className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full grid place-items-center text-xs font-semibold ${
                i < step
                  ? 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : i === step
                    ? 'ring-2 ring-gray-900 dark:ring-zinc-100 text-gray-900 dark:text-zinc-100'
                    : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {i < step ? <Check className="w-4 h-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className={i === step ? 'font-semibold text-gray-900 dark:text-zinc-100' : 'text-gray-500 dark:text-zinc-400'}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <fieldset>
          <legend className="sr-only">Template</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {EVENT_TYPES.map((t) => (
              <TemplateCard key={t} template={TEMPLATES[t]} selected={t === type} name={`${ids}-type`} onSelect={() => pickType(t)} />
            ))}
          </div>
        </fieldset>
      )}

      {step > 0 && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
          <div className="space-y-5 min-w-0">
            {step === 1 && (
              <>
                {template.hostFields.map((field, i) => (
                  <Field key={i} id={`${ids}-host-${i}`} label={field.label} optional={field.optional}>
                    <input id={`${ids}-host-${i}`} value={hosts[i] ?? ''} onChange={(e) => setHost(i, e.target.value)} maxLength={60} placeholder={field.placeholder} className={inputClass} />
                  </Field>
                ))}
                <Field id={`${ids}-name`} label="Event name" help={template.hostFields.length ? 'Shown in the admin, the link preview and emails.' : 'The title on the cover of the site.'}>
                  <input
                    id={`${ids}-name`}
                    value={name}
                    onChange={(e) => {
                      setNameEdited(true);
                      applyName(e.target.value);
                    }}
                    maxLength={80}
                    placeholder={template.namePlaceholder}
                    className={inputClass}
                  />
                </Field>
                <Field id={`${ids}-link`} label="Link" help="The guest page’s address. Lowercase letters, numbers and hyphens.">
                  <div className="flex items-center rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus-within:ring-2 focus-within:ring-gray-900 dark:focus-within:ring-zinc-100">
                    <span className="pl-3 text-sm text-gray-500 dark:text-zinc-500 select-none">site/</span>
                    <input
                      id={`${ids}-link`}
                      value={link}
                      onChange={(e) => {
                        setLink(e.target.value.toLowerCase());
                        setLinkEdited(true);
                      }}
                      maxLength={64}
                      autoCapitalize="none"
                      spellCheck={false}
                      className="flex-1 min-w-0 min-h-11 pr-3 bg-transparent text-sm text-gray-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id={`${ids}-date`} label="Date">
                    <input id={`${ids}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
                  </Field>
                  <Field id={`${ids}-time`} label="Start time">
                    <input id={`${ids}-time`} type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
                  </Field>
                </div>
                <Field id={`${ids}-venue`} label="Venue">
                  <input id={`${ids}-venue`} value={venue} onChange={(e) => setVenue(e.target.value)} maxLength={120} placeholder="e.g. The Grand Ballroom" className={inputClass} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id={`${ids}-address`} label="Address" optional>
                    <input id={`${ids}-address`} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} placeholder="Street and barangay" className={inputClass} />
                  </Field>
                  <Field id={`${ids}-city`} label="Town or city">
                    <input id={`${ids}-city`} value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} placeholder="e.g. Quezon City" className={inputClass} />
                  </Field>
                </div>
              </>
            )}

            {step === 2 && (
              <fieldset>
                <legend className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Color palette</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {template.palettes.map((id, i) => {
                    const preset = THEME_PRESETS.find((p) => p.id === id)!;
                    const selected = id === palette;
                    return (
                      <label
                        key={id}
                        className={`flex items-center gap-3 min-h-14 px-3 py-2 rounded-xl border cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 ${
                          selected
                            ? 'border-gray-900 dark:border-zinc-100 ring-1 ring-gray-900 dark:ring-zinc-100'
                            : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                        }`}
                      >
                        <input type="radio" name={`${ids}-palette`} value={id} checked={selected} onChange={() => setPalette(id)} className="sr-only" />
                        <span className="flex h-8 w-16 overflow-hidden rounded-md border border-black/10 shrink-0" aria-hidden="true">
                          {(['primaryDeep', 'primary', 'accent', 'ink'] as const).map((key) => (
                            <span key={key} className="flex-1" style={{ backgroundColor: preset.colors[key] }} />
                          ))}
                        </span>
                        <span className="flex-1 text-sm text-gray-900 dark:text-zinc-100">
                          {preset.name}
                          {i === 0 && <span className="block text-xs text-gray-500 dark:text-zinc-400">Suggested for {template.name}</span>}
                        </span>
                        {selected && <Check className="w-4 h-4 text-gray-900 dark:text-zinc-100" aria-hidden="true" />}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-zinc-500">
                  Fonts: {getFontPairing(template.fontPairing).name}. Colors, fonts and every text can be changed later in Colors & Fonts.
                </p>
              </fieldset>
            )}
          </div>

          <div className="lg:sticky lg:top-6">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-2">Preview</p>
            <CoverPreview template={template} palette={palette} names={shownNames || (template.hostFields.length ? 'Your names here' : 'Your event name')} date={longDate(date)} city={city.trim()} />
          </div>
        </div>
      )}

      {shownError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {shownError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 dark:border-zinc-800 pt-5">
        {step > 0 ? (
          <button type="button" onClick={back} disabled={busy} className={secondaryButton}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className={primaryButton}>
            Next <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          <button type="button" onClick={create} disabled={busy} className={primaryButton}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Check className="w-4 h-4" aria-hidden="true" />}
            {busy ? 'Creating…' : 'Create and open the builder'}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ id, label, help, optional, children }: { id: string; label: string; help?: string; optional?: boolean; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
        {label}
        {optional && <span className="font-normal text-gray-500 dark:text-zinc-500"> (optional)</span>}
      </label>
      {children}
      {help && <p className="mt-1.5 text-xs text-gray-500 dark:text-zinc-500">{help}</p>}
    </div>
  );
}

function TemplateCard({ template, selected, name, onSelect }: { template: TemplateInfo; selected: boolean; name: string; onSelect: () => void }) {
  const sections = visibleScreens(template.screens).filter((s) => s.type !== 'welcome' && s.type !== 'rsvpCta');
  return (
    <label
      className={`block rounded-2xl overflow-hidden border cursor-pointer transition-shadow bg-white dark:bg-zinc-900 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 ${
        selected ? 'border-gray-900 dark:border-zinc-100 ring-1 ring-gray-900 dark:ring-zinc-100 shadow-md' : 'border-gray-200 dark:border-zinc-800 hover:shadow-md'
      }`}
    >
      <input type="radio" name={name} checked={selected} onChange={onSelect} className="sr-only" />
      <CoverPreview template={template} palette={template.palettes[0]} names={template.namePlaceholder.replace(/^e\.g\.\s*/, '')} compact />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-gray-900 dark:text-zinc-100">{template.name}</span>
          {selected && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-900 dark:text-zinc-100">
              <Check className="w-4 h-4" aria-hidden="true" /> Selected
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">{template.summary}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Sections">
          {sections.map((s) => (
            <li key={s.type} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
              {s.label || SECTION_NAMES[s.type]}
            </li>
          ))}
        </ul>
      </div>
    </label>
  );
}

/** A small cover of the guest site: the template's photo, fonts and the palette's colors. */
function CoverPreview({
  template, palette, names, date, city, compact,
}: { template: TemplateInfo; palette: string; names: string; date?: string; city?: string; compact?: boolean }) {
  const preset = THEME_PRESETS.find((p) => p.id === palette) ?? THEME_PRESETS[0];
  const style = themeVars(preset.colors, getFontPairing(template.fontPairing)) as CSSProperties;
  return (
    <div style={style} className={`relative overflow-hidden bg-surface font-body ${compact ? 'h-44' : 'aspect-[4/5] rounded-2xl border border-gray-200 dark:border-zinc-800'}`} aria-hidden="true">
      <Image src={template.cover} alt="" fill sizes={compact ? '(min-width: 640px) 50vw, 100vw' : '340px'} className="object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary-deep/70 via-surface/60 to-surface/90" />
      <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent-light">You are invited</p>
        <p className={`mt-3 font-heading text-accent leading-tight [text-shadow:0_1px_8px_rgb(0_0_0/0.6)] ${compact ? 'text-xl' : 'text-2xl'}`}>{names}</p>
        <div className="w-12 h-px bg-accent/60 my-3" />
        {!compact && (
          <>
            <p className="font-elegant italic text-lg text-ink/90">{date || 'Your date'}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink/70">{city || 'Your city'}</p>
            <span className="mt-6 px-5 py-2.5 bg-primary border border-accent/30 text-accent text-[11px] tracking-[0.2em] uppercase rounded-sm">RSVP</span>
          </>
        )}
        {compact && <p className="font-elegant italic text-ink/90">{template.name}</p>}
      </div>
    </div>
  );
}
