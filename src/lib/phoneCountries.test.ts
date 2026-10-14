import { describe, expect, it } from 'vitest';
import { OTHER_COUNTRY, findCountry, formatPhoneDigits, normalizePhoneInput, toInternational } from './phoneCountries';

const PH = findCountry('PH');

describe('normalizePhoneInput', () => {
  it('drops the habitual trunk 0', () => {
    expect(normalizePhoneInput('0917 123 4567', PH).digits).toBe('9171234567');
  });

  it('strips a pasted +63 or 0063 prefix', () => {
    expect(normalizePhoneInput('+63 917 123 4567', PH).digits).toBe('9171234567');
    expect(normalizePhoneInput('0063 917 123 4567', PH).digits).toBe('9171234567');
    expect(normalizePhoneInput('639171234567', PH).digits).toBe('9171234567');
  });

  it('caps at the country max', () => {
    expect(normalizePhoneInput('91712345678999', PH).digits).toBe('9171234567');
  });

  it('switches country for a pasted foreign number', () => {
    const r = normalizePhoneInput('+971 50 123 4567', PH);
    expect(r.country.iso).toBe('AE');
    expect(r.digits).toBe('501234567');
    expect(normalizePhoneInput('+852 5123 4567', PH).country.iso).toBe('HK');
    expect(normalizePhoneInput('+1 201 555 0123', PH).country.iso).toBe('US');
  });

  it('keeps the code for "Other"', () => {
    expect(normalizePhoneInput('+44 7400 123456', OTHER_COUNTRY).digits).toBe('447400123456');
  });
});

describe('formatting', () => {
  it('lays digits over the pattern without trailing spaces', () => {
    expect(formatPhoneDigits('917', PH)).toBe('917');
    expect(formatPhoneDigits('9171', PH)).toBe('917 1');
    expect(toInternational('9171234567', PH)).toBe('+63 917 123 4567');
    expect(toInternational('447400123456', OTHER_COUNTRY)).toBe('+447400123456');
  });
});
