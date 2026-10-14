"use client";

import React, { useLayoutEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  PHONE_COUNTRIES,
  PhoneCountry,
  digitRangeLabel,
  formatPhoneDigits,
  normalizePhoneInput,
} from '@/lib/phoneCountries';
import { useSiteText } from '@/contexts/SiteTextContext';
import { fillText } from '@/lib/siteText';

interface PhoneFieldProps {
  id: string;
  label: string;
  country: PhoneCountry;
  digits: string;
  error?: string | null;
  onChange: (next: { country: PhoneCountry; digits: string }) => void;
  onBlur: () => void;
}

/** Phone input with a country-code picker, live formatting, a digit cap per
 *  country and a "N more digits" guide. Errors replace the guide line. */
export function PhoneField({ id, label, country, digits, error, onChange, onBlur }: PhoneFieldProps) {
  const text = useSiteText().phone;
  const inputRef = useRef<HTMLInputElement>(null);
  const caretDigits = useRef<number | null>(null);
  const formatted = formatPhoneDigits(digits, country);
  const messageId = `${id}-message`;

  // Keep the caret next to the same digit after spaces are re-inserted.
  useLayoutEffect(() => {
    const el = inputRef.current;
    const n = caretDigits.current;
    if (!el || n === null || document.activeElement !== el) return;
    caretDigits.current = null;
    let pos = 0;
    for (let seen = 0; pos < formatted.length && seen < n; pos++) {
      if (/\d/.test(formatted[pos])) seen++;
    }
    el.setSelectionRange(pos, pos);
  }, [formatted]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    const atEnd = caret >= el.value.length;
    let before = el.value.slice(0, caret).replace(/\D/g, '').length;
    let next = normalizePhoneInput(el.value, country);

    // Backspace over a space: delete the digit before it instead of nothing.
    const inputType = (e.nativeEvent as InputEvent).inputType;
    if (inputType === 'deleteContentBackward' && next.digits === digits && before > 0) {
      next = { ...next, digits: digits.slice(0, before - 1) + digits.slice(before) };
      before -= 1;
    }

    caretDigits.current = atEnd ? next.digits.length : Math.min(before, next.digits.length);
    onChange(next);
  };

  const handleCountry = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const picked = PHONE_COUNTRIES.find((x) => x.iso === e.target.value) ?? country;
    onChange({ country: picked, digits: digits.slice(0, picked.max) });
    inputRef.current?.focus();
  };

  const isOther = country.dial === '';
  const count = digits.length;
  const remaining = country.min - count;
  const complete = count >= country.min;

  let guide: React.ReactNode;
  if (count === 0) {
    guide = isOther
      ? text.guideOther
      : fillText(text.guide, { digits: digitRangeLabel(country), dial: country.dial });
  } else if (!complete) {
    guide = remaining === 1 ? text.remainingOne : fillText(text.remainingMany, { count: remaining });
  } else {
    guide = (
      <span className="inline-flex items-center gap-1 text-wedding-goldlight">
        <Check className="w-3.5 h-3.5" aria-hidden="true" />
        {count === country.max ? text.complete : text.looksGood}
      </span>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="block text-xs uppercase tracking-widest text-wedding-gold font-semibold mb-2">
        {label} <span className="text-red-400 group-data-[hint=on]/form:motion-safe:animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_3]" aria-hidden="true">*</span>
      </label>

      <div
        className={`flex items-stretch border-b transition-colors duration-300 ${
          error ? 'border-red-400/70 focus-within:border-red-400' : 'border-wedding-gold/30 focus-within:border-wedding-gold'
        }`}
      >
        {/* Native select on top of the visible chip: real picker on phones, keyboard accessible. */}
        <div className="relative shrink-0 flex items-center pr-3 mr-3 border-r border-wedding-gold/20 has-[select:focus-visible]:ring-2 has-[select:focus-visible]:ring-wedding-gold">
          <span aria-hidden="true" className="flex items-center gap-1.5 py-2 text-sm text-wedding-cream">
            <span className="text-[11px] tracking-wider text-wedding-cream/60">{isOther ? text.otherChip : country.iso}</span>
            <span className="text-wedding-goldlight">+{country.dial}</span>
            <ChevronDown className="w-3.5 h-3.5 text-wedding-gold/70" />
          </span>
          <select
            aria-label="Country code"
            value={country.iso}
            onChange={handleCountry}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [color-scheme:dark]"
          >
            {PHONE_COUNTRIES.map((x) => (
              <option key={x.iso} value={x.iso} className="bg-wedding-dark text-wedding-cream">
                {x.dial ? `${x.name} (+${x.dial})` : text.otherOption}
              </option>
            ))}
          </select>
        </div>

        <input
          ref={inputRef}
          type="tel"
          id={id}
          inputMode="tel"
          autoComplete={isOther ? 'tel' : 'tel-national'}
          value={formatted}
          onChange={handleInput}
          onBlur={onBlur}
          placeholder={isOther ? text.otherPlaceholder : country.example}
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className="min-w-0 flex-1 bg-transparent py-2 text-base md:text-sm text-wedding-cream tracking-wide focus:outline-none placeholder:text-wedding-cream/35"
        />
      </div>

      <div id={messageId} aria-live="polite" className="mt-1.5 flex items-start justify-between gap-3 text-xs leading-snug min-h-[1.25rem]">
        <span className={error ? 'text-red-400' : 'text-wedding-cream/60'}>{error || guide}</span>
        <span className={`shrink-0 tabular-nums ${complete ? 'text-wedding-goldlight' : 'text-wedding-cream/45'}`} aria-hidden="true">
          {count}/{country.max}
        </span>
      </div>
    </div>
  );
}
