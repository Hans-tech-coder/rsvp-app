"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';

interface RsvpScreenProps {
  inviteCode: string;
  onContinue: () => void;
  onSubmitSuccess?: () => void;
}

import { getVisitorCountry, submitRsvp } from '@/app/actions/rsvp';
import { Loader2 } from 'lucide-react';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { useSiteText } from '@/contexts/SiteTextContext';
import { fillNodes, fillText, type SiteText } from '@/lib/siteText';
import { TextsReveal } from '@/components/ui/TextsReveal';
import { PhoneField } from '@/components/ui/PhoneField';
import {
  PHONE_COUNTRIES,
  PhoneCountry,
  detectCountryIso,
  digitRangeLabel,
  findCountry,
  toInternational,
} from '@/lib/phoneCountries';

type Field = 'fullName' | 'email' | 'phone' | 'attendance' | 'consent';
// Top-to-bottom order, so a failed submit focuses the first problem.
const FIELD_ORDER: Field[] = ['fullName', 'email', 'phone', 'attendance', 'consent'];
const FIELD_IDS: Record<Field, string> = {
  fullName: 'fullname',
  email: 'email',
  phone: 'phone',
  attendance: 'attend-yes',
  consent: 'consent',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MESSAGE_MAX = 500;
// "Fields marked * are required" card: shown once, shortly after the form
// comes into view, and kept until the guest's first input anywhere in the form
// (typing, a choice, the checkbox, the country code) or a submit attempt.
const REQUIRED_HINT_DELAY_MS = 700;

function validateRsvp(v: {
  fullName: string;
  email: string;
  phoneDigits: string;
  phoneCountry: PhoneCountry;
  attendance: 'Yes' | 'No' | null;
  consent: boolean;
}, t: SiteText['rsvp']['errors']): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};

  const name = v.fullName.trim();
  if (!name) errors.fullName = t.fullNameMissing;
  else if (name.split(/\s+/).length < 2) errors.fullName = t.fullNameIncomplete;

  const email = v.email.trim();
  if (!email) errors.email = t.emailMissing;
  else if (!EMAIL_RE.test(email)) errors.email = t.emailInvalid;

  const c = v.phoneCountry;
  if (!v.phoneDigits) errors.phone = t.phoneMissing;
  else if (v.phoneDigits.length < c.min) {
    errors.phone = c.dial
      ? fillText(t.phoneTooShort, { country: c.name, digits: digitRangeLabel(c), dial: c.dial })
      : fillText(t.phoneTooShortOther, { min: c.min });
  }

  if (!v.attendance) errors.attendance = t.attendanceMissing;
  if (!v.consent) errors.consent = t.consentMissing;

  return errors;
}

function inputClass(invalid: boolean) {
  return `w-full bg-transparent border-b py-2 text-base md:text-sm text-ink focus:outline-none placeholder:text-ink/40 transition-colors duration-300 ${
    invalid ? 'border-red-400/70 focus:border-red-400' : 'border-accent/30 focus:border-accent'
  }`;
}

function FieldLabel({ htmlFor, required, markAddon, children }: {
  htmlFor: string;
  required?: boolean;
  markAddon?: React.ReactNode; // floats from the asterisk (the required hint)
  children: React.ReactNode;
}) {
  const text = useSiteText();
  return (
    <label htmlFor={htmlFor} className="block text-xs uppercase tracking-widest text-accent font-semibold mb-2">
      {children}{' '}
      {required ? (
        <span className="relative inline-block">
          {/* Asterisks pulse three times when the required hint appears (data-hint on the form). */}
          <span className="text-red-400 group-data-[hint=on]/form:motion-safe:animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_3]" aria-hidden="true">*</span>
          {markAddon}
        </span>
      ) : (
        <span className="normal-case tracking-normal font-normal italic text-ink/50">{text.rsvp.optional}</span>
      )}
    </label>
  );
}

/** The line under a field: the hint in muted text, replaced by the error in red. */
function FieldMessage({ id, error, hint, aside }: { id: string; error?: string | null; hint?: string; aside?: React.ReactNode }) {
  return (
    <div id={id} aria-live="polite" className="mt-1.5 flex items-start justify-between gap-3 text-xs leading-snug min-h-[1.25rem]">
      <span className={error ? 'text-red-400' : 'text-ink/60'}>{error || hint}</span>
      {aside}
    </div>
  );
}

export function RsvpScreen({ inviteCode, onContinue, onSubmitSuccess }: RsvpScreenProps) {
  const { content, eventId } = useWeddingContent();
  const formContent = content.rsvpForm;
  const text = useSiteText();

  const [showModal, setShowModal] = useState(false);
  const [attendance, setAttendance] = useState<'Yes' | 'No' | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  // Country code: first guess from the device time zone / language, then the
  // IP country (Vercel header, more reliable on PCs set to a generic UTC+8
  // zone). The guest can always change it; once they touch the field we stop guessing.
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>(() =>
    typeof window === 'undefined' ? PHONE_COUNTRIES[0] : findCountry(detectCountryIso()),
  );
  const phoneTouchedByGuest = useRef(false);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [proxyName, setProxyName] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Errors show once a field is left (blur) or after a submit attempt, and clear as soon as the value is fixed.
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const reduceMotion = useReducedMotion();
  const hintAnchorRef = useRef<HTMLDivElement>(null);
  const [requiredHint, setRequiredHint] = useState(false);
  const requiredHintShown = useRef(false);

  useEffect(() => {
    const el = hintAnchorRef.current;
    if (!el) return;
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || requiredHintShown.current || showTimer) return;
        io.disconnect();
        showTimer = setTimeout(() => {
          requiredHintShown.current = true;
          setRequiredHint(true);
        }, REQUIRED_HINT_DELAY_MS);
      },
      { threshold: 1 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(showTimer);
    };
  }, []);
  const touch = (field: Field) => setTouched((t) => (t[field] ? t : { ...t, [field]: true }));

  const errors = validateRsvp({ fullName, email, phoneDigits, phoneCountry, attendance, consent }, text.rsvp.errors);
  const errorFor = (field: Field) => (touched[field] || submitAttempted ? errors[field] ?? null : null);
  const errorCount = FIELD_ORDER.filter((f) => errors[f]).length;

  useEffect(() => {
    let cancelled = false;
    getVisitorCountry()
      .then((iso) => {
        const match = iso && PHONE_COUNTRIES.find((x) => x.iso === iso);
        if (match && !cancelled && !phoneTouchedByGuest.current) setPhoneCountry(match);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequiredHint(false);
    setError(null);

    const firstInvalid = FIELD_ORDER.find((f) => errors[f]);
    if (firstInvalid) {
      setSubmitAttempted(true);
      const el = document.getElementById(FIELD_IDS[firstInvalid]);
      el?.focus({ preventScroll: true });
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const formData = {
      fullName: fullName.trim().replace(/\s+/g, ' '),
      email: email.trim(),
      phoneNumber: toInternational(phoneDigits, phoneCountry),
      willAttend: attendance as 'Yes' | 'No',
      proxyName: attendance === 'No' ? proxyName.trim() : undefined,
      message: message.trim(),
    };

    const result = await submitRsvp(eventId, inviteCode, formData);

    setIsSubmitting(false);

    if (result.success) {
      setShowModal(true);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } else {
      setError(result.code === 'invalid' ? text.rsvp.errors.codeInvalid : result.code === 'used' ? text.rsvp.errors.codeUsed : text.rsvp.errors.submitFailed);
    }
  };

  const nameError = errorFor('fullName');
  const emailError = errorFor('email');
  const attendanceError = errorFor('attendance');
  const consentError = errorFor('consent');

  return (
    <section className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-surface via-primary-deep to-surface pointer-events-none"></div>

      {/* Only the heading reveals (TextsReveal); form fields never animate on scroll. */}
      <div className="max-w-4xl mx-auto w-full relative z-10">
        <div className="bg-surface/40 p-6 sm:p-8 md:p-12 rounded-xl border border-primary-light/30 shadow-lg">
          <TextsReveal className="text-center mb-12 flex flex-col items-center">
            <span className="text-sm font-cormorant italic text-accent-light/80 tracking-widest block mb-1">{formContent.header.subtitle}</span>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-cinzel text-ink font-light tracking-widest drop-shadow-md">{formContent.header.title}</h2>
            <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent mx-auto mt-5"></div>
            <p className="text-base font-cormorant italic text-accent-light/90 mt-6 leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
              {formContent.header.description}
            </p>
          </TextsReveal>

          {/* Interactive RSVP Form. noValidate: our own messages replace the browser bubbles. */}
          <form
            onSubmit={handleSubmit}
            onInput={() => setRequiredHint(false)}
            noValidate
            data-hint={requiredHint ? 'on' : undefined}
            className="group/form space-y-8 font-inter"
          >

            {/* Full Name (its asterisk carries the form-wide "required" hint) */}
            <div ref={hintAnchorRef}>
              <FieldLabel
                htmlFor="fullname"
                required
                markAddon={
                  <AnimatePresence>
                    {requiredHint && (
                      <motion.span
                        key="required-hint"
                        aria-hidden="true" // inside the label; inputs already say aria-required
                        // Sits right of the asterisk, bottom-aligned with the label, so it fills
                        // the empty space above the field instead of covering the intro text.
                        className="absolute left-full bottom-[-4px] ml-4 block w-max max-w-[13rem] pointer-events-none z-20 normal-case tracking-normal font-normal"
                        style={{ transformOrigin: '0% 100%' }}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -4, scale: 0.98, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
                        transition={{ duration: reduceMotion ? 0.2 : 0.5, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {/* Same card as the music hint in AudioPlayer.tsx */}
                        <span className="relative flex flex-col gap-0.5 pl-4 pr-5 py-2.5 border border-accent/50 bg-surface/85 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                          <span aria-hidden="true" className="absolute inset-[3px] border border-accent/20 pointer-events-none"></span>
                          <span className="font-cinzel text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-accent-light">{text.rsvp.requiredHintTitle}</span>
                          <span className="font-cormorant italic text-sm text-ink/85 tracking-wide">
                            {fillNodes(text.rsvp.requiredHintText, { star: <span className="not-italic text-red-400">*</span> })}
                          </span>
                          {/* Caret pointing left at the asterisk */}
                          <span aria-hidden="true" className="absolute -left-[6px] bottom-[6px] h-2.5 w-2.5 rotate-45 border-l border-b border-accent/50 bg-surface"></span>
                        </span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                }
              >
                {formContent.labels.fullName}
              </FieldLabel>
              <input
                type="text"
                id="fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => touch('fullName')}
                placeholder={text.rsvp.placeholders.fullName}
                autoComplete="name"
                autoCapitalize="words"
                maxLength={80}
                aria-required="true"
                aria-invalid={nameError ? true : undefined}
                aria-describedby="fullname-message"
                className={inputClass(!!nameError)}
              />
              <FieldMessage id="fullname-message" error={nameError} hint={text.rsvp.hints.fullName} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Email Address */}
              <div>
                <FieldLabel htmlFor="email" required>{formContent.labels.email}</FieldLabel>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => touch('email')}
                  placeholder={text.rsvp.placeholders.email}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={120}
                  aria-required="true"
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby="email-message"
                  className={inputClass(!!emailError)}
                />
                <FieldMessage id="email-message" error={emailError} hint={text.rsvp.hints.email} />
              </div>

              {/* Phone */}
              <PhoneField
                id="phone"
                label={formContent.labels.phone}
                country={phoneCountry}
                digits={phoneDigits}
                error={errorFor('phone')}
                onChange={({ country, digits }) => {
                  phoneTouchedByGuest.current = true;
                  setPhoneCountry(country);
                  setPhoneDigits(digits);
                }}
                onBlur={() => touch('phone')}
              />
            </div>

            {/* Attendance Choice */}
            <fieldset aria-describedby="attendance-message">
              <legend className="block text-xs uppercase tracking-widest text-accent font-semibold mb-3">
                {formContent.labels.attendance} <span className="text-red-400 group-data-[hint=on]/form:motion-safe:animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_3]" aria-hidden="true">*</span>
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['Yes', 'No'] as const).map((option) => {
                  const selected = attendance === option;
                  return (
                    <label
                      key={option}
                      className={`relative flex items-center gap-3 min-h-[52px] px-4 py-3 rounded-md border cursor-pointer transition-colors duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
                        selected
                          ? 'border-accent bg-accent/10'
                          : attendanceError
                            ? 'border-red-400/60 hover:border-red-400'
                            : 'border-accent/25 hover:border-accent/60'
                      }`}
                    >
                      <input
                        type="radio"
                        id={option === 'Yes' ? 'attend-yes' : 'attend-no'}
                        name="attendance"
                        value={option}
                        checked={selected}
                        onChange={() => setAttendance(option)}
                        className="sr-only"
                      />
                      <span aria-hidden="true" className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-300 ${selected ? 'border-accent' : 'border-accent/60'}`}>
                        <span className={`w-2.5 h-2.5 rounded-full bg-accent transition-transform duration-200 ${selected ? 'scale-100' : 'scale-0'}`} />
                      </span>
                      <span className="text-base font-cormorant italic text-ink">
                        {option === 'Yes' ? formContent.attendanceOptions.yes : formContent.attendanceOptions.no}
                      </span>
                    </label>
                  );
                })}
              </div>
              <FieldMessage id="attendance-message" error={attendanceError} hint={text.rsvp.hints.attendance} />
            </fieldset>

            {/* Conditional Proxy Field (optional, as its label says "If Any") */}
            <AnimatePresence initial={false}>
              {attendance === 'No' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative">
                    <FieldLabel htmlFor="proxy">{formContent.labels.proxy}</FieldLabel>
                    <input
                      type="text"
                      id="proxy"
                      value={proxyName}
                      onChange={(e) => setProxyName(e.target.value)}
                      placeholder={formContent.labels.proxyPlaceholder}
                      autoComplete="off"
                      autoCapitalize="words"
                      maxLength={80}
                      aria-describedby="proxy-message"
                      className={inputClass(false)}
                    />
                    <FieldMessage id="proxy-message" hint={text.rsvp.hints.proxy} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Special Message */}
            <div>
              <FieldLabel htmlFor="message">{formContent.labels.message}</FieldLabel>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={MESSAGE_MAX}
                placeholder={formContent.labels.messagePlaceholder}
                aria-describedby="message-message"
                className={`${inputClass(false)} resize-none`}
              ></textarea>
              <FieldMessage
                id="message-message"
                hint={text.rsvp.hints.message}
                aside={
                  <span className={`shrink-0 tabular-nums ${message.length >= MESSAGE_MAX ? 'text-accent-light' : 'text-ink/45'}`}>
                    {message.length}/{MESSAGE_MAX}
                  </span>
                }
              />
            </div>

            {/* Data Privacy Consent */}
            <div className="pt-2">
              <label className="flex items-start cursor-pointer group">
                <div className="relative flex items-center justify-center mt-1 mr-3 shrink-0">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    aria-required="true"
                    aria-invalid={consentError ? true : undefined}
                    aria-describedby="consent-message"
                    className="peer sr-only"
                  />
                  <div className={`w-5 h-5 border rounded-sm bg-transparent peer-checked:bg-accent peer-checked:border-accent peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface transition-all duration-300 flex items-center justify-center ${consentError ? 'border-red-400' : 'border-accent/50'}`}>
                    <svg className="w-3.5 h-3.5 text-surface opacity-0 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-inter text-ink/70 group-hover:text-ink/90 transition-colors leading-relaxed">
                  {formContent.actions.privacyText} <span className="text-red-400 group-data-[hint=on]/form:motion-safe:animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_3]" aria-hidden="true">*</span>
                </span>
              </label>
              <div className="pl-8">
                <FieldMessage id="consent-message" error={consentError} />
              </div>
            </div>

            <div className="text-center pt-2 space-y-4">
              {submitAttempted && errorCount > 0 && (
                <p role="alert" className="text-sm text-red-400">
                  {errorCount === 1 ? text.rsvp.errors.checkOne : fillText(text.rsvp.errors.checkMany, { count: errorCount })}
                </p>
              )}
              {error && (
                <div role="alert" className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <button disabled={isSubmitting} type="submit" className="px-8 py-4 bg-primary border border-accent/30 text-accent hover:bg-primary/80 hover:border-accent hover:text-accent-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-xs tracking-[0.25em] font-medium uppercase transition-all duration-300 rounded-sm shadow-lg w-full md:w-auto flex items-center justify-center gap-2 mx-auto disabled:opacity-70 disabled:cursor-not-allowed">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? formContent.actions.submittingButton : formContent.actions.submitButton}
              </button>
            </div>
          </form>


        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-surface/95 border border-accent/30 p-8 md:p-12 rounded-xl shadow-2xl max-w-md w-full text-center relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>

              <h3 className="text-3xl font-cinzel text-accent-light mb-4 tracking-wide">{formContent.successModal.title}</h3>
              <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent mx-auto mb-6"></div>

              <p className="text-lg font-cormorant italic text-ink/90 mb-8 leading-relaxed whitespace-pre-line">
                {formContent.successModal.description}
              </p>

              <button
                onClick={onContinue}
                className="px-8 py-3 bg-primary/80 border border-accent/40 text-accent hover:bg-primary hover:border-accent hover:text-accent-light text-xs tracking-[0.25em] font-medium uppercase transition-all duration-300 rounded-sm w-full"
              >
                {formContent.successModal.buttonText}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EmbeddedFooter />
    </section>
  );
}
