import {
  Bodoni_Moda, Cinzel, Cormorant_Garamond, DM_Sans, EB_Garamond, Inter, Italiana, Jost,
  Lora, Marcellus, Montserrat, Nunito_Sans, Playfair_Display, Raleway, Source_Serif_4,
} from 'next/font/google';

// Every font of every pairing in src/lib/fonts.ts, self-hosted by next/font.
// Each sets a CSS variable on <html> (the `variable:` names must match
// FONT_FAMILIES there); an event's pairing points its font roles at them. Only
// the default pairing (Classic) is preloaded; the others' files are fetched by
// the browser only when an event actually uses them. next/font needs literal
// options, hence one call per family.

const cinzel = Cinzel({ variable: '--font-cinzel', subsets: ['latin'] });
const cormorantGaramond = Cormorant_Garamond({
  variable: '--font-cormorant-garamond',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
});
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

const playfairDisplay = Playfair_Display({ variable: '--font-playfair-display', subsets: ['latin'], style: ['normal', 'italic'], preload: false });
const ebGaramond = EB_Garamond({ variable: '--font-eb-garamond', subsets: ['latin'], style: ['normal', 'italic'], preload: false });
const raleway = Raleway({ variable: '--font-raleway', subsets: ['latin'], preload: false });

const marcellus = Marcellus({ variable: '--font-marcellus', subsets: ['latin'], weight: '400', preload: false });
const lora = Lora({ variable: '--font-lora', subsets: ['latin'], style: ['normal', 'italic'], preload: false });
const nunitoSans = Nunito_Sans({ variable: '--font-nunito-sans', subsets: ['latin'], preload: false });

const montserrat = Montserrat({ variable: '--font-montserrat', subsets: ['latin'], preload: false });
const sourceSerif = Source_Serif_4({ variable: '--font-source-serif', subsets: ['latin'], style: ['normal', 'italic'], preload: false });
const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'], preload: false });

const italiana = Italiana({ variable: '--font-italiana', subsets: ['latin'], weight: '400', preload: false });
const bodoniModa = Bodoni_Moda({ variable: '--font-bodoni-moda', subsets: ['latin'], style: ['normal', 'italic'], preload: false });
const jost = Jost({ variable: '--font-jost', subsets: ['latin'], preload: false });

/** Class names for <html> that define every font variable. */
export const fontVariables = [
  cinzel, cormorantGaramond, inter,
  playfairDisplay, ebGaramond, raleway,
  marcellus, lora, nunitoSans,
  montserrat, sourceSerif, dmSans,
  italiana, bodoniModa, jost,
].map((font) => font.variable).join(' ');
