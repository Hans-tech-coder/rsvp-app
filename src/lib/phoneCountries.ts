// Country dial codes and mobile-number lengths for the RSVP phone field.
// `pattern` has one `#` per digit of the longest valid national number (no
// trunk 0, no country code); `min`/`max` are the allowed digit counts.

export interface PhoneCountry {
  iso: string;
  name: string;
  dial: string; // digits only, '' for "Other" (guest types the code)
  min: number;
  max: number;
  pattern: string;
  example: string;
  trunkZero: boolean; // a leading 0 typed out of habit is dropped
  zones?: string[];
}

export const OTHER_COUNTRY: PhoneCountry = {
  iso: 'OTHER',
  name: 'Other country',
  dial: '',
  min: 8,
  max: 15,
  pattern: '###############', // no grouping: we can't know where the code ends
  example: 'Country code + number',
  trunkZero: false,
};

const c = (
  iso: string, name: string, dial: string, min: number, max: number,
  pattern: string, example: string, zones: string[], trunkZero = true,
): PhoneCountry => ({ iso, name, dial, min, max, pattern, example, trunkZero, zones });

// Philippines first (the wedding is there), then alphabetical, "Other" last.
export const PHONE_COUNTRIES: PhoneCountry[] = [
  c('PH', 'Philippines', '63', 10, 10, '### ### ####', '917 123 4567', ['Asia/Manila']),
  c('AU', 'Australia', '61', 9, 9, '### ### ###', '412 345 678', ['Australia/']),
  c('AT', 'Austria', '43', 10, 13, '### ##########', '664 1234567', ['Europe/Vienna']),
  c('BH', 'Bahrain', '973', 8, 8, '#### ####', '3600 1234', ['Asia/Bahrain'], false),
  c('BE', 'Belgium', '32', 9, 9, '### ## ## ##', '470 12 34 56', ['Europe/Brussels']),
  c('CA', 'Canada', '1', 10, 10, '### ### ####', '506 234 5678', ['America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Winnipeg', 'America/Halifax', 'America/Regina', 'America/St_Johns', 'America/Moncton'], false),
  c('CN', 'China', '86', 11, 11, '### #### ####', '131 2345 6789', ['Asia/Shanghai', 'Asia/Urumqi']),
  c('FR', 'France', '33', 9, 9, '# ## ## ## ##', '6 12 34 56 78', ['Europe/Paris']),
  c('DE', 'Germany', '49', 10, 11, '### ########', '151 23456789', ['Europe/Berlin']),
  c('HK', 'Hong Kong', '852', 8, 8, '#### ####', '5123 4567', ['Asia/Hong_Kong'], false),
  c('IN', 'India', '91', 10, 10, '##### #####', '81234 56789', ['Asia/Kolkata', 'Asia/Calcutta']),
  c('ID', 'Indonesia', '62', 9, 12, '### #### #####', '812 3456 7890', ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'Asia/Pontianak']),
  c('IE', 'Ireland', '353', 9, 9, '## ### ####', '85 012 3456', ['Europe/Dublin']),
  c('IL', 'Israel', '972', 9, 9, '## ### ####', '50 234 5678', ['Asia/Jerusalem', 'Asia/Tel_Aviv']),
  c('IT', 'Italy', '39', 9, 10, '### ### ####', '312 345 6789', ['Europe/Rome'], false),
  c('JP', 'Japan', '81', 10, 10, '## #### ####', '90 1234 5678', ['Asia/Tokyo']),
  c('KW', 'Kuwait', '965', 8, 8, '#### ####', '5001 2345', ['Asia/Kuwait'], false),
  c('MO', 'Macau', '853', 8, 8, '#### ####', '6612 3456', ['Asia/Macau', 'Asia/Macao'], false),
  c('MY', 'Malaysia', '60', 9, 10, '## #### ####', '12 345 6789', ['Asia/Kuala_Lumpur', 'Asia/Kuching']),
  c('NL', 'Netherlands', '31', 9, 9, '# ########', '6 12345678', ['Europe/Amsterdam']),
  c('NZ', 'New Zealand', '64', 8, 10, '## ### #####', '21 123 4567', ['Pacific/Auckland']),
  c('NO', 'Norway', '47', 8, 8, '### ## ###', '406 12 345', ['Europe/Oslo'], false),
  c('OM', 'Oman', '968', 8, 8, '#### ####', '9212 3456', ['Asia/Muscat'], false),
  c('QA', 'Qatar', '974', 8, 8, '#### ####', '3312 3456', ['Asia/Qatar'], false),
  c('SA', 'Saudi Arabia', '966', 9, 9, '## ### ####', '51 234 5678', ['Asia/Riyadh']),
  c('SG', 'Singapore', '65', 8, 8, '#### ####', '8123 4567', ['Asia/Singapore'], false),
  c('KR', 'South Korea', '82', 9, 10, '## #### ####', '10 1234 5678', ['Asia/Seoul']),
  c('ES', 'Spain', '34', 9, 9, '### ### ###', '612 345 678', ['Europe/Madrid', 'Atlantic/Canary'], false),
  c('SE', 'Sweden', '46', 9, 9, '## ### ## ##', '70 123 45 67', ['Europe/Stockholm']),
  c('CH', 'Switzerland', '41', 9, 9, '## ### ## ##', '78 123 45 67', ['Europe/Zurich']),
  c('TW', 'Taiwan', '886', 9, 9, '### ### ###', '912 345 678', ['Asia/Taipei']),
  c('TH', 'Thailand', '66', 9, 9, '## ### ####', '81 234 5678', ['Asia/Bangkok']),
  c('AE', 'United Arab Emirates', '971', 9, 9, '## ### ####', '50 123 4567', ['Asia/Dubai']),
  c('GB', 'United Kingdom', '44', 10, 10, '#### ######', '7400 123456', ['Europe/London']),
  c('US', 'United States', '1', 10, 10, '### ### ####', '201 555 0123', ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'America/Detroit', 'America/Boise', 'America/Indiana/', 'America/Kentucky/', 'Pacific/Honolulu'], false),
  c('VN', 'Vietnam', '84', 9, 9, '## ### ####', '91 234 5678', ['Asia/Ho_Chi_Minh', 'Asia/Saigon']),
  OTHER_COUNTRY,
];

const DEFAULT_ISO = 'PH';

export function findCountry(iso: string): PhoneCountry {
  return PHONE_COUNTRIES.find((x) => x.iso === iso) ?? PHONE_COUNTRIES[0];
}

// Windows has no Manila time zone, so PCs in the Philippines report another
// UTC+8 zone ("China Standard Time" → Asia/Shanghai, "Singapore Standard Time"
// → Asia/Singapore, …). On Windows these mean nothing, so read them as PH.
const WINDOWS_UTC8_ZONES = [
  'Asia/Shanghai', 'Asia/Urumqi', 'Asia/Hong_Kong', 'Asia/Singapore', 'Asia/Kuala_Lumpur',
  'Asia/Taipei', 'Asia/Irkutsk', 'Asia/Ulaanbaatar', 'Australia/Perth',
];

/** First guess at the guest's country from the device time zone, then the
 *  browser language region, falling back to the Philippines. The IP lookup
 *  (`getVisitorCountry`) replaces it when it answers. Browser only. */
export function detectCountryIso(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (/Windows/i.test(navigator.userAgent) && WINDOWS_UTC8_ZONES.includes(zone)) return DEFAULT_ISO;

    const byZone = PHONE_COUNTRIES.find((x) =>
      x.zones?.some((z) => (z.endsWith('/') ? zone.startsWith(z) : zone === z)),
    );
    if (byZone) return byZone.iso;

    for (const lang of navigator.languages ?? [navigator.language]) {
      const region = lang.split('-')[1]?.toUpperCase();
      if (region && PHONE_COUNTRIES.some((x) => x.iso === region && x.dial)) return region;
    }
  } catch {
    // ignore and use the default
  }
  return DEFAULT_ISO;
}

/** Turn whatever the guest typed or pasted into national digits for
 *  `country`. A pasted "+<code>…" number for another listed country switches
 *  to that country. */
export function normalizePhoneInput(
  raw: string,
  country: PhoneCountry,
): { digits: string; country: PhoneCountry } {
  let digits = raw.replace(/\D/g, '');
  const international = /^\s*(\+|00)/.test(raw);
  if (raw.trim().startsWith('00')) digits = digits.slice(2);

  if (country.dial === '') return { digits: digits.slice(0, country.max), country };

  let target = country;
  if (international && !digits.startsWith(country.dial)) {
    // Longest dial code first so "+852" is not read as "+85…"; "+1" means US.
    const match = PHONE_COUNTRIES
      .filter((x) => x.dial && digits.startsWith(x.dial))
      .sort((a, b) => b.dial.length - a.dial.length || Number(b.iso === 'US') - Number(a.iso === 'US'))[0];
    if (match) target = match;
  }

  if ((international || digits.length > target.max) && digits.startsWith(target.dial)) {
    digits = digits.slice(target.dial.length);
  }
  if (target.trunkZero && digits.startsWith('0')) digits = digits.slice(1);

  return { digits: digits.slice(0, target.max), country: target };
}

/** Lay the digits over the country pattern ("9171234567" → "917 123 4567"). */
export function formatPhoneDigits(digits: string, country: PhoneCountry): string {
  let out = '';
  let i = 0;
  for (const ch of country.pattern) {
    if (i >= digits.length) break;
    if (ch === '#') out += digits[i++];
    else out += ch;
  }
  return out + digits.slice(i);
}

/** The value saved with the RSVP, e.g. "+63 917 123 4567". */
export function toInternational(digits: string, country: PhoneCountry): string {
  const formatted = formatPhoneDigits(digits, country);
  return country.dial ? `+${country.dial} ${formatted}` : `+${formatted}`;
}

export function digitRangeLabel(country: PhoneCountry): string {
  return country.min === country.max ? `${country.max}` : `${country.min}–${country.max}`;
}
