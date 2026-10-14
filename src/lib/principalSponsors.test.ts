import { describe, expect, it } from 'vitest';
import { normalizePrincipalSponsors } from './principalSponsors';

const s = (title: string, name: string) => ({ title, name });
const none = s('', '');

describe('normalizePrincipalSponsors', () => {
  it('returns null for a missing value so callers can fall back', () => {
    expect(normalizePrincipalSponsors(undefined)).toBeNull();
  });

  it('splits a legacy couple field into one couple', () => {
    expect(normalizePrincipalSponsors(['Mr. Larry Adams & Mrs. Angelina Adams'])).toEqual([
      { ninang: s('Mrs.', 'Angelina Adams'), ninong: s('Mr.', 'Larry Adams'), couple: true },
    ]);
  });

  it('keeps different surnames in a couple', () => {
    expect(normalizePrincipalSponsors(['Mrs. Ana Cruz & Mr. Ben Reyes'])).toEqual([
      { ninang: s('Mrs.', 'Ana Cruz'), ninong: s('Mr.', 'Ben Reyes'), couple: true },
    ]);
  });

  it('fills a bare "Mr. & Mrs." title with the shared name', () => {
    expect(normalizePrincipalSponsors(['Mr. & Mrs. Larry Adams'])).toEqual([
      { ninang: s('Mrs.', 'Larry Adams'), ninong: s('Mr.', 'Larry Adams'), couple: true },
    ]);
  });

  it('pairs adjacent legacy solos of opposite titles, either order', () => {
    expect(normalizePrincipalSponsors(['Mrs. A One', 'Mr. B Two', 'Mr. C Three', 'Ms. D Four'])).toEqual([
      { ninang: s('Mrs.', 'A One'), ninong: s('Mr.', 'B Two'), couple: false },
      { ninang: s('Ms.', 'D Four'), ninong: s('Mr.', 'C Three'), couple: false },
    ]);
  });

  it('leaves an unmatched solo on its own side', () => {
    expect(normalizePrincipalSponsors(['Mrs. A', 'Mrs. B', 'Mr. C Couple & Mrs. D Couple', 'Mr. E'])).toEqual([
      { ninang: s('Mrs.', 'A'), ninong: none, couple: false },
      { ninang: s('Mrs.', 'B'), ninong: none, couple: false },
      { ninang: s('Mrs.', 'D Couple'), ninong: s('Mr.', 'C Couple'), couple: true },
      { ninang: none, ninong: s('Mr.', 'E'), couple: false },
    ]);
  });

  it('keeps an unknown title inside the name', () => {
    expect(normalizePrincipalSponsors(['Kap. Jose Rizal'])).toEqual([
      { ninang: s('', 'Kap. Jose Rizal'), ninong: none, couple: false },
    ]);
  });

  it('reads the early `married` flag as `couple`', () => {
    expect(normalizePrincipalSponsors([{ ninang: s('Mrs.', 'A'), ninong: s('Mr.', 'B'), married: true }])).toEqual([
      { ninang: s('Mrs.', 'A'), ninong: s('Mr.', 'B'), couple: true },
    ]);
  });

  it('passes the new shape through and is idempotent', () => {
    const pairs = [{ ninang: s('Dra.', 'Ana'), ninong: s('Engr.', 'Ben'), couple: true }];
    expect(normalizePrincipalSponsors(pairs)).toEqual(pairs);
    const legacy = normalizePrincipalSponsors(['Mrs. A', 'Mr. B']);
    expect(normalizePrincipalSponsors(legacy)).toEqual(legacy);
  });
});

