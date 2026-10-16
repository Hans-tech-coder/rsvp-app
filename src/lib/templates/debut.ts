import type { TemplateDocs } from './index';
import {
  EMBLEM, RSVP_LABELS, SAMPLE_BANKS, faq, group, guideline, person, photo, privacyText, venue,
} from './shared';

// The Debut template's starting content (placeholders: ./index.ts).

const names = (...list: string[]) => list.map((name) => person(name));

export const debutDocs: TemplateDocs = {
  globalSettings: {
    logo: EMBLEM,
    ogImage: photo('debut-roses-bouquet'),
    footerTagline: 'Eighteen and ever so grateful',
  },
  welcomeScreen: {
    backgroundImage: photo('debut-roses-bouquet'),
    subtitle: 'You are invited to the debut of',
    topText: 'An evening of roses and candlelight',
    bottomText1: 'as she celebrates her eighteenth birthday',
    bottomText2: '{eventDay}',
  },
  entranceScreen: { backgroundImage: photo('debut-chandelier') },
  ourStory: {
    subtitle: 'Her Story',
    title: 'Eighteen Years of Grace',
    description: 'A look back at the moments that shaped {host1}.',
    items: [
      {
        date: 'THE BEGINNING',
        title: 'A Little Blessing',
        description: 'The day she arrived and filled her family’s home with joy. Add a baby photo here.',
        image: photo('debut-roses'),
      },
      {
        date: 'GROWING UP',
        title: 'School Days',
        description: 'Friends, recitals, medals and every milestone along the way. Add or remove chapters as you like.',
        image: photo('debut-pink-roses'),
      },
      {
        date: '{eventDate}',
        title: 'Turning Eighteen',
        description: 'Surrounded by family and friends, {host1} steps into a new chapter of her life in {eventCity}.',
        image: photo('debut-ballroom'),
      },
    ],
  },
  entourage: {
    subtitle: 'Her treasured circle',
    title: 'The Debut Court',
    groups: [
      group('parents', 'Parents of the Debutante', 'featured', names('Mr. Jose Santos', 'Mrs. Rosa Santos')),
      group('escort', 'Escort', 'featured', names('Miguel Torres')),
      group('roses', '18 Roses', 'list', names('Mr. Jose Santos', 'Miguel Torres', 'Paolo Navarro', 'Rico Bautista', 'Enzo Flores', 'Carlo Reyes')),
      group('candles', '18 Candles', 'list', names('Mrs. Rosa Santos', 'Sofia Ramos', 'Bea Villanueva', 'Carla Aquino', 'Dana Castillo', 'Mia Garcia')),
      group('treasures', '18 Treasures', 'list', names('Lola Elena Reyes', 'Tita Teresa Garcia', 'Tito Ramon Reyes', 'Ate Lourdes Mendoza')),
    ],
  },
  details: {
    header: { subtitle: 'The Celebration', title: 'Where & When', description: 'Join us for a night to remember in {eventCity}.' },
    venues: [
      venue('debut', 'The Debut', 'Dinner & Grand Ball',
        'An evening of dinner, the 18 Roses dance, the candle and treasure ceremonies, and dancing until late.',
        '{eventName}'),
    ],
    orderOfEventsImage: '',
  },
  dressCode: {
    header: { subtitle: 'The Style Guideline', title: 'Dress Code' },
    title: 'Formal Attire',
    description: 'Help us paint the night in the debut’s colors.',
    guidelines: [
      guideline('ladies', 'For Ladies', 'Long gowns or elegant cocktail dresses in the colors below.'),
      guideline('gentlemen', 'For Gentlemen', 'A suit, tuxedo or barong. A tie or pocket square in the debut’s colors is a lovely touch.'),
    ],
    inspirationImages: [
      { type: 'Ladies', url: photo('attire-gold-gown') },
      { type: 'Gentlemen', url: photo('attire-tuxedo') },
      { type: 'Ladies', url: photo('attire-teal-gown') },
      { type: 'Gentlemen', url: photo('attire-red-tuxedo') },
      { type: 'Ladies', url: photo('attire-violet-gown') },
      { type: 'Ladies', url: photo('attire-evening-gown') },
    ],
  },
  gallery: {
    header: { subtitle: 'Her Moments', title: 'The Gallery' },
    images: [
      photo('debut-roses-bouquet'), photo('debut-chandelier'), photo('debut-roses'), photo('debut-ballroom'),
      photo('debut-pink-roses'), photo('debut-crystal-lights'), photo('debut-rose-bed'), photo('debut-salon'),
    ],
  },
  faq: {
    header: { subtitle: 'Guest Information', title: 'Good to Know', description: 'Quick answers for our guests' },
    items: [
      faq('Can I bring a plus one?', 'We have reserved a seat for each guest named on your invitation. Thank you for understanding.'),
      faq('What time should I arrive?', 'The program starts at {eventTime}. Please arrive 30 minutes early.'),
      faq('Is there a dress code?', 'Yes: formal attire. See the Dress Code page for the colors.'),
      faq('I am one of the 18s. What should I prepare?', 'The organizers will message you with your cue, your rose, candle or treasure, and the rehearsal time.'),
      faq('Can I give gifts?', 'Your presence is the best gift. If you wish to give, the options are on the Gifts page.'),
      faq('What if I cannot attend?', 'Please still send your RSVP and choose “Regretfully Declines”.'),
      faq('Who can I contact for questions?', 'Message the debutante’s family. Add a phone number here.'),
    ],
  },
  registry: {
    header: {
      subtitle: 'Gifts & Wishes',
      title: 'For the Debutante',
      description: 'Your presence is the best gift, but should you wish to give, here are a few options.',
    },
    bankTransfer: {
      title: 'Monetary Gift',
      description: 'A contribution towards her studies and dreams, by bank transfer or e-wallet.',
      banks: SAMPLE_BANKS,
    },
    curatedRegistry: {
      title: 'Wish List',
      description1: 'A few things she has been wishing for.',
      description2: 'Pick one below and we will mark it as yours.',
    },
  },
  rsvpCta: {
    subtitle: 'Join the Night',
    title: 'Kindly RSVP',
    description: 'It would mean so much to have you there. Please send your response before {rsvpDate}.',
    buttonText: 'Confirm Your Attendance',
    backgroundImage: photo('debut-ballroom'),
  },
  rsvpForm: {
    header: {
      subtitle: 'R.S.V.P',
      title: 'The Response',
      description: 'It would mean so much to have you there. Please send your response before {rsvpDate}.',
    },
    labels: RSVP_LABELS,
    attendanceOptions: { yes: 'Joyfully Accepts', no: 'Regretfully Declines' },
    actions: {
      privacyText: privacyText('organizing and managing this debut'),
      submitButton: 'Confirm Attendance',
      submittingButton: 'Confirming...',
    },
    successModal: {
      title: 'Thank You!',
      description: 'Your response has been recorded. We cannot wait to celebrate with you.',
      buttonText: 'View Gifts',
    },
  },
  siteText: {
    entrance: { eyebrow: 'Your Invitation', preparing: 'Preparing your invitation...' },
    registry: { visitRegistry: 'Visit Wish List' },
    giftModal: {
      intro: 'Please provide your details below to confirm you are giving this item to the debutante.',
      messagePlaceholder: 'Happy eighteenth birthday...',
    },
    notFound: {
      heading: 'Lost on the way to the ball?',
      daysLeftOne: '{days} day until {couple} in {venue}',
      daysLeftMany: '{days} days until {couple} in {venue}',
    },
    seo: {
      title: '{couple} | You Are Invited',
      description: 'Join us as we celebrate an evening of roses and candlelight on {date}.',
    },
  },
};
