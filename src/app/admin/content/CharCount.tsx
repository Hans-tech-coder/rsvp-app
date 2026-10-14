// Character limits for short display text. Long words break the layout on a
// phone, so inputs stop at the limit (`maxLength`) and show a counter.
export const TEXT_LIMITS = {
  button: 30, // button labels, menu names
  heading: 40, // screen titles, the small heading above them, modal titles
  cardTitle: 50, // card and chapter titles, welcome lines, footer tagline
  sentence: 90, // one-line sentences, e.g. the welcome date line
} as const;

// Counter under an input: grey, amber near the limit, red when a saved value
// is already longer (maxLength stops typing but keeps old text).
export function CharCount({ value, max }: { value: string | undefined; max: number }) {
  const length = value?.length ?? 0;
  const tone =
    length > max
      ? 'text-red-600 dark:text-red-400'
      : length >= max * 0.9
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-gray-400 dark:text-zinc-500';
  return (
    <p className={`text-xs text-right tabular-nums ${tone}`}>
      {length}/{max}
      {length > max && ' (too long for phones)'}
    </p>
  );
}
