import { createElement, Fragment, type ReactNode } from 'react';
// Relative import: vitest has no '@/' alias (see siteText.test.ts)
import weddingContent from '../data/wedding-content.json';

// Guest-visible UI wording (buttons, labels, errors, hints), edited in the
// "Site Text" admin tab and stored in the event's content/siteText. Grouped by screen.
export type SiteText = typeof weddingContent.siteText;

export const DEFAULT_SITE_TEXT: SiteText = weddingContent.siteText;

/** Overlay a Firestore siteText doc on the defaults. Only keys that exist in
 *  the defaults are read; an empty or non-string value keeps the default, so
 *  a cleared field never leaves a blank button. */
export function mergeSiteText(defaults: SiteText, data: unknown): SiteText {
  return mergeGroup(defaults, data) as SiteText;
}

function mergeGroup(defaults: Record<string, unknown>, data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') return defaults;
  const source = data as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, fallback] of Object.entries(defaults)) {
    const value = source[key];
    if (typeof fallback === 'string') {
      out[key] = typeof value === 'string' && value.trim() !== '' ? value : fallback;
    } else {
      out[key] = mergeGroup(fallback as Record<string, unknown>, value);
    }
  }
  return out;
}

const PLACEHOLDER = /\{(\w+)\}/g;

/** "{count} more digits" + { count: 3 } -> "3 more digits". Unknown names stay as typed. */
export function fillText(template: string, values: Record<string, string | number>): string {
  return template.replace(PLACEHOLDER, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

/** Like fillText, but a value can be an element (a styled number, a red asterisk). */
export function fillNodes(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(PLACEHOLDER).map((part, i) =>
    // split() with a capture group puts the placeholder names at odd indexes
    createElement(Fragment, { key: i }, i % 2 === 1 ? (part in values ? values[part] : `{${part}}`) : part),
  );
}
