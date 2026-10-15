import { describe, expect, it } from 'vitest';
import { EMPTY_HISTORY, MAX_HISTORY, firstDifference, recordEdit, redoEntry, undoEntry } from './builderHistory';

describe('firstDifference', () => {
  it('finds the first differing field, deep', () => {
    expect(firstDifference({ a: 1, b: { c: 'x' } }, { a: 1, b: { c: 'y' } })).toBe('b.c');
    expect(firstDifference({ items: [{ q: 'a' }, { q: 'b' }] }, { items: [{ q: 'a' }, { q: 'c' }] })).toBe('items.1.q');
  });

  it('stops at a list that changed length, and is null for equal docs', () => {
    expect(firstDifference({ items: [1] }, { items: [1, 2] })).toBe('items');
    expect(firstDifference({ a: 1, b: 2 }, { b: 2, a: 1 })).toBeNull();
  });
});

describe('recordEdit', () => {
  it('merges typing in one field into one entry', () => {
    let h = recordEdit(EMPTY_HISTORY, 'welcomeScreen', { title: '' }, { title: 'H' });
    h = recordEdit(h, 'welcomeScreen', { title: 'H' }, { title: 'Hi' });
    expect(h.entries).toHaveLength(1);
    expect(h.entries[0]).toMatchObject({ before: { title: '' }, after: { title: 'Hi' }, field: 'title' });
  });

  it('starts a new entry for another field or doc, and ignores no-ops', () => {
    let h = recordEdit(EMPTY_HISTORY, 'welcomeScreen', { a: '', b: '' }, { a: 'x', b: '' });
    h = recordEdit(h, 'welcomeScreen', { a: 'x', b: '' }, { a: 'x', b: 'y' });
    h = recordEdit(h, 'theme', { primary: '#000000' }, { primary: '#111111' });
    expect(h.entries.map((e) => e.field)).toEqual(['a', 'b', 'primary']);
    expect(recordEdit(h, 'theme', { x: 1 }, { x: 1 })).toBe(h);
  });

  it('drops redo on a new edit after undo', () => {
    let h = recordEdit(EMPTY_HISTORY, 'faq', { a: 1 }, { a: 2 });
    h = recordEdit(h, 'faq', { a: 2, b: 1 }, { a: 2, b: 2 });
    h = { ...h, index: 1 };
    expect(redoEntry(h)?.field).toBe('b');
    h = recordEdit(h, 'music', { volume: 0.5 }, { volume: 0.7 });
    expect(h.entries.map((e) => e.docId)).toEqual(['faq', 'music']);
    expect(redoEntry(h)).toBeNull();
    expect(undoEntry(h)?.docId).toBe('music');
  });

  it('keeps at most MAX_HISTORY entries', () => {
    let h = EMPTY_HISTORY;
    for (let i = 0; i < MAX_HISTORY + 5; i++) h = recordEdit(h, 'faq', { [`k${i}`]: 0 }, { [`k${i}`]: 1 });
    expect(h.entries).toHaveLength(MAX_HISTORY);
    expect(h.index).toBe(MAX_HISTORY);
  });
});
