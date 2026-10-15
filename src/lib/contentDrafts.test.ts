import { describe, expect, it } from 'vitest';
import {
  addVersion, isEditableDocId, isSameDraft, MAX_VERSIONS, mergeDoc, nextDraftData,
  seedVersions, stableStringify, versionInfo, type StoredVersion,
} from './contentDrafts';

const version = (id: string, data: Record<string, unknown> = { id }): StoredVersion =>
  ({ id, publishedAt: 1, publishedBy: null, data });

describe('mergeDoc', () => {
  it('merges maps key by key and replaces arrays and values, like set(…, { merge: true })', () => {
    const base = { header: { title: 'A', subtitle: 'B' }, items: [1, 2], keep: 'x' };
    expect(mergeDoc(base, { header: { title: 'C' }, items: [3] })).toEqual({
      header: { title: 'C', subtitle: 'B' }, items: [3], keep: 'x',
    });
    expect(base.header.title).toBe('A');
  });
});

describe('nextDraftData', () => {
  it('replaces the doc for editors that save without merge', () => {
    expect(nextDraftData({ a: 1 }, false, { data: { b: 2 }, updatedAt: 1, updatedBy: null }, { c: 3 })).toEqual({ a: 1 });
  });
  it('merges over the draft, else over the live doc', () => {
    expect(nextDraftData({ a: 1 }, true, { data: { b: 2 }, updatedAt: 1, updatedBy: null }, { c: 3 })).toEqual({ a: 1, b: 2 });
    expect(nextDraftData({ a: 1 }, true, null, { c: 3 })).toEqual({ a: 1, c: 3 });
    expect(nextDraftData({ a: 1 }, true, null, null)).toEqual({ a: 1 });
  });
});

describe('isSameDraft', () => {
  it('allows the save only when the draft is the one the editor loaded', () => {
    expect(isSameDraft(null, null)).toBe(true);
    expect(isSameDraft({ updatedAt: 5 }, 5)).toBe(true);
    expect(isSameDraft({ updatedAt: 6 }, 5)).toBe(false); // saved elsewhere
    expect(isSameDraft(null, 5)).toBe(false); // published or discarded elsewhere
    expect(isSameDraft({ updatedAt: 5 }, null)).toBe(false); // a draft appeared
  });
});

describe('versions', () => {
  it('seeds the list from the live doc and the old backup', () => {
    expect(seedVersions({ a: 1 }, { a: 0 }).map((v) => v.id)).toEqual(['before-drafts', 'old-backup']);
    expect(seedVersions(null, null)).toEqual([]);
  });

  it('puts the new version first and keeps the newest MAX_VERSIONS', () => {
    let items: StoredVersion[] = [];
    for (let i = 0; i < MAX_VERSIONS + 3; i++) items = addVersion(items, version(`v${i}`));
    expect(items).toHaveLength(MAX_VERSIONS);
    expect(items[0].id).toBe(`v${MAX_VERSIONS + 2}`);
  });

  it('drops the oldest versions to stay under the doc size limit', () => {
    const big = { text: 'x'.repeat(400_000) };
    const items = addVersion(addVersion(addVersion([], version('a', big)), version('b', big)), version('c', big));
    expect(items.map((v) => v.id)).toEqual(['c', 'b']);
  });

  it('marks the newest version live when it matches the live doc, whatever the key order', () => {
    const items = [version('b', { x: 1, y: 2 }), version('a', { x: 0 })];
    expect(versionInfo(items, { y: 2, x: 1 }).map((v) => v.live)).toEqual([true, false]);
    expect(versionInfo(items, { x: 9 }).map((v) => v.live)).toEqual([false, false]);
    expect(versionInfo(items, null)[0]).not.toHaveProperty('data');
  });
});

it('stableStringify sorts keys at every level', () => {
  expect(stableStringify({ b: [{ d: 1, c: 2 }], a: null })).toBe('{"a":null,"b":[{"c":2,"d":1}]}');
});

it('isEditableDocId accepts only content docs editors save', () => {
  expect(isEditableDocId('theme')).toBe(true);
  expect(isEditableDocId('welcomeScreen')).toBe(true);
  expect(isEditableDocId('theme_backup')).toBe(false);
  expect(isEditableDocId('../guests')).toBe(false);
});
