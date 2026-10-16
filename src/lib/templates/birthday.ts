import type { TemplateDocs } from './index';
import {
  EMBLEM, RSVP_LABELS, SAMPLE_BANKS, faq, group, guideline, person, photo, privacyText, venue,
} from './shared';

// The Birthday / Anniversary template's starting content (placeholders: ./index.ts).
// People and Registry start hidden (catalog.ts); their texts are here for when they are switched on.

export const birthdayDocs: TemplateDocs = {
  globalSettings: {
    logo: EMBLEM,
    ogImage: photo('birthday-candles'),
    footerTagline: 'Thank you for celebrating with us',
  },
  welcomeScreen: {
    backgroundImage: photo('birthday-candles'),
    subtitle: 'You are invited to celebrate',
    topText: 'Join us for a milestone celebration',
    bottomText1: 'An evening of love, laughter and good food',
    bottomText2: '{eventDay}',
  },
  entranceScreen: { backgroundImage: photo('birthday-lights') },
  ourStory: {
    subtitle: 'Through the Years',
    title: 'A Life Well Celebrated',
    description: 'A few of the moments we treasure most.',
    items: [
      {
        date: 'THE EARLY YEARS',
        title: 'Where It All Began',
        description: 'Share an old photo and a story from the early days. Add or remove chapters as you like.',
        image: photo('birthday-cake'),
      },
      {
        date: 'THE MILESTONES',
        title: 'Moments to Remember',
        description: 'Family, friends, work and adventures: the years that made the memories.',
        image: photo('birthday-toast'),
      },
      {
        date: '{eventDate}',
        title: 'Today We Celebrate',
        description: 'We gather in {eventCity} to say thank you, raise a glass and celebrate {hostNames}.',
        image: photo('birthday-candle-letters'),
      },
    ],
  },
  entourage: {
    subtitle: 'With love',
    title: 'The Family',
    groups: [
      group('hosts', 'Our Hosts', 'featured', [person('The Santos Family')]),
      group('family', 'Family', 'list', [person('Jose Santos'), person('Rosa Santos'), person('Ana Santos')]),
    ],
  },
  details: {
    header: { subtitle: 'The Celebration', title: 'Where & When', description: 'Celebrate with us in {eventCity}.' },
    venues: [
      venue('party', 'The Party', 'Dinner & Celebration',
        'An evening of good food, music, stories and a toast to many more years.',
        '{eventName}'),
    ],
    orderOfEventsImage: '',
  },
  dressCode: {
    header: { subtitle: 'What to Wear', title: 'Dress Code' },
    title: 'Smart Casual',
    description: 'Come comfortable and festive. Bonus points for wearing the party colors!',
    guidelines: [
      guideline('ladies', 'For Ladies', 'A dress, or a blouse with slacks or a skirt, in the colors below.'),
      guideline('gentlemen', 'For Gentlemen', 'A polo or long-sleeved shirt with slacks. No tie needed.'),
    ],
    inspirationImages: [
      { type: 'Ladies', url: photo('attire-black-dress') },
      { type: 'Gentlemen', url: photo('attire-dark-suit') },
      { type: 'Ladies', url: photo('attire-blue-dress') },
      { type: 'Gentlemen', url: photo('attire-bowtie') },
    ],
  },
  gallery: {
    header: { subtitle: 'Our Memories', title: 'The Gallery' },
    images: [
      photo('birthday-candles'), photo('birthday-toast'), photo('birthday-lights'), photo('birthday-cake'),
      photo('birthday-glasses'), photo('birthday-chocolate-cake'), photo('birthday-bulb'), photo('birthday-cake-slices'),
      photo('birthday-balloons'), photo('birthday-confetti'),
    ],
  },
  faq: {
    header: { subtitle: 'Guest Information', title: 'Good to Know', description: 'Quick answers for our guests' },
    items: [
      faq('Can I bring a plus one?', 'We have reserved a seat for each guest named on your invitation. Thank you for understanding.'),
      faq('What time should I arrive?', 'The celebration starts at {eventTime}. Please come a little early so we can start together.'),
      faq('Is there a dress code?', 'Smart casual. See the Dress Code page for the party colors.'),
      faq('Can I bring kids?', 'Tell us here whether children are welcome.'),
      faq('What if I cannot attend?', 'Please still send your RSVP and choose “Regretfully Declines” so we can plan the food.'),
      faq('Who can I contact for questions?', 'Message the family. Add a phone number here.'),
    ],
  },
  registry: {
    header: {
      subtitle: 'Gifts',
      title: 'Gifts & Wishes',
      description: 'Your presence is the best gift, but should you wish to give, here are a few options.',
    },
    bankTransfer: {
      title: 'Monetary Gift',
      description: 'A contribution by bank transfer or e-wallet.',
      banks: SAMPLE_BANKS,
    },
    curatedRegistry: {
      title: 'Wish List',
      description1: 'A few things on the wish list.',
      description2: 'Pick one below and we will mark it as yours.',
    },
  },
  rsvpCta: {
    subtitle: 'Join Us',
    title: 'Kindly RSVP',
    description: 'It would mean so much to celebrate with you. Please send your response before {rsvpDate}.',
    buttonText: 'Confirm Your Attendance',
    backgroundImage: photo('birthday-toast'),
  },
  rsvpForm: {
    header: {
      subtitle: 'R.S.V.P',
      title: 'The Response',
      description: 'It would mean so much to celebrate with you. Please send your response before {rsvpDate}.',
    },
    labels: { ...RSVP_LABELS, messagePlaceholder: 'A birthday wish or a favorite memory...' },
    attendanceOptions: { yes: 'Happily Attending', no: 'Sadly Can’t Make It' },
    actions: {
      privacyText: privacyText('organizing and managing this celebration'),
      submitButton: 'Send My RSVP',
      submittingButton: 'Sending...',
    },
    successModal: {
      title: 'Thank You!',
      description: 'Your response has been recorded. We cannot wait to celebrate with you.',
      buttonText: 'Back to the Invitation',
    },
  },
  siteText: {
    loading: { title: 'Getting the Party Ready' },
    entrance: { eyebrow: 'Your Invitation', preparing: 'Preparing your invitation...' },
    registry: { visitRegistry: 'Visit Wish List' },
    giftModal: {
      intro: 'Please provide your details below to confirm you are giving this item.',
      messagePlaceholder: 'Happy birthday and many more...',
    },
    footer: { credit: 'Made with love for a special day.' },
    notFound: {
      heading: 'Lost on the way to the party?',
      daysLeftOne: '{days} day until {couple} in {venue}',
      daysLeftMany: '{days} days until {couple} in {venue}',
    },
    seo: {
      title: '{couple} | You Are Invited',
      description: 'Join us for a celebration of love, laughter and good food on {date}.',
    },
  },
};
