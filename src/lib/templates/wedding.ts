import type { TemplateDocs } from './index';
import {
  EMBLEM, RSVP_LABELS, SAMPLE_BANKS, faq, group, guideline, pairsGroup, person, photo, privacyText, venue,
} from './shared';

// The Wedding template's starting content (placeholders: ./index.ts).
// Sample names (Juan / Maria Dela Cruz ...) are there to be replaced.

export const weddingDocs: TemplateDocs = {
  globalSettings: {
    logo: EMBLEM,
    ogImage: photo('wedding-bouquet'),
    footerTagline: 'Together is a beautiful place to be',
  },
  welcomeScreen: {
    backgroundImage: photo('wedding-bouquet'),
    subtitle: 'Join us in celebrating',
    topText: 'Together with their families',
    bottomText1: 'Request the honor of your presence',
    bottomText2: '{eventDay}',
  },
  entranceScreen: { backgroundImage: photo('wedding-hall') },
  ourStory: {
    subtitle: 'Our Journey',
    title: 'The Chapters of Us',
    description: 'Every love story is beautiful, but ours is our favorite.',
    items: [
      {
        date: 'THE BEGINNING',
        title: 'How We Met',
        description: 'Tell your guests where it all started: the place, the friends who introduced you, the first thing you noticed about each other.',
        image: photo('wedding-hands'),
      },
      {
        date: 'THE YEARS TOGETHER',
        title: 'Growing Together',
        description: 'The trips, the milestones and the ordinary days that made you a team. Add or remove chapters to tell your story.',
        image: photo('wedding-rings-wood'),
      },
      {
        date: 'THE QUESTION',
        title: 'The Proposal',
        description: 'Where it happened, who knew, and the answer that changed everything. A video link can go on any chapter.',
        image: photo('wedding-rings'),
      },
      {
        date: '{eventDate}',
        title: 'Our Forever Begins',
        description: 'Every chapter has led us here. Surrounded by the people we love most, we begin our greatest adventure together in {eventCity}.',
        image: photo('wedding-ring-exchange'),
      },
    ],
  },
  entourage: {
    subtitle: 'With love and gratitude',
    title: 'Wedding Entourage',
    groups: [
      group('parents-bride', 'Parents of the Bride', 'featured', [person('Mr. Jose Santos'), person('Mrs. Rosa Santos')]),
      group('parents-groom', 'Parents of the Groom', 'featured', [person('Mr. Pedro Dela Cruz'), person('Mrs. Carmen Dela Cruz')]),
      pairsGroup('principal-sponsors', 'Principal Sponsors', [
        [person('Elena Reyes', '', 'Mrs.'), person('Ramon Reyes', '', 'Mr.')],
        [person('Teresa Garcia', '', 'Mrs.'), person('Antonio Garcia', '', 'Mr.')],
        [person('Lourdes Mendoza', '', 'Mrs.'), person('Roberto Mendoza', '', 'Mr.')],
      ]),
      group('maid-of-honor', 'Maid of Honor', 'featured', [person('Sofia Ramos')]),
      group('best-man', 'Best Man', 'featured', [person('Miguel Torres')]),
      group('bridesmaids', 'Bridesmaids', 'list', [person('Bea Villanueva'), person('Carla Aquino'), person('Dana Castillo')]),
      group('groomsmen', 'Groomsmen', 'list', [person('Paolo Navarro'), person('Rico Bautista'), person('Enzo Flores')]),
      group('flower-girls', 'Flower Girls', 'list', [person('Mia Santos')]),
      group('ring-bearers', 'Ring Bearer', 'list', [person('Lucas Dela Cruz')]),
    ],
  },
  details: {
    header: { subtitle: 'The Celebration', title: 'Where & When', description: 'Celebrate with us in {eventCity}.' },
    venues: [
      venue('ceremony', 'The Ceremony', 'The Vows',
        'Witness the beginning of our forever as we exchange vows, surrounded by the blessings of our families and friends.',
        '{hostNames} Wedding Ceremony'),
      venue('reception', 'The Reception', 'Dinner & Dancing',
        'As the sun sets, join us for an evening of good food, heartfelt toasts and joyful dancing.',
        '{hostNames} Wedding Reception'),
    ],
    orderOfEventsImage: '',
  },
  dressCode: {
    header: { subtitle: 'The Style Guideline', title: 'Dress Code' },
    title: 'Formal Attire',
    description: 'We would love our guests to dress in harmony with our wedding colors.',
    guidelines: [
      guideline('ladies', 'For Ladies', 'Floor-length gowns or elegant cocktail dresses in our wedding colors or soft neutrals.'),
      guideline('gentlemen', 'For Gentlemen', 'A suit or barong with a crisp dress shirt. A tie in our wedding colors is a lovely touch.'),
    ],
    inspirationImages: [
      { type: 'Ladies', url: photo('attire-necklace-gown') },
      { type: 'Gentlemen', url: photo('attire-tuxedo-boutonniere') },
      { type: 'Ladies', url: photo('attire-gold-dress') },
      { type: 'Gentlemen', url: photo('attire-bowtie') },
      { type: 'Ladies', url: photo('attire-pearls-gown') },
      { type: 'Gentlemen', url: photo('attire-tuxedo') },
    ],
  },
  gallery: {
    header: { subtitle: 'Our Memories', title: 'The Gallery' },
    images: [
      photo('wedding-bouquet'), photo('wedding-ring-exchange'), photo('wedding-bouquets'), photo('wedding-hands'),
      photo('wedding-aisle'), photo('wedding-rings-wood'), photo('wedding-centerpiece'), photo('wedding-place-card'),
      photo('wedding-table'), photo('wedding-rings'),
    ],
  },
  faq: {
    header: { subtitle: 'Guest Information', title: 'Things You Might Want to Know', description: 'Quick answers for our beloved guests' },
    items: [
      faq('Can I bring a plus one?', 'We have reserved a seat for each guest named on your invitation and invite code. Thank you for understanding.'),
      faq('What time should I arrive?', 'The ceremony starts at {eventTime}. Please arrive 30 minutes early to find your seat.'),
      faq('Is there a dress code?', 'Yes: formal attire. See the Dress Code page for our colors and ideas.'),
      faq('Can I take photos or videos?', 'We kindly ask for an unplugged ceremony. Feel free to take photos at the reception!'),
      faq('Can I give gifts or cash?', 'Your presence is the greatest gift. If you wish to give, the options are on the Registry page.'),
      faq('What if I cannot attend?', 'Please still send your RSVP and choose “Regretfully Declines” so we can plan our guest list.'),
      faq('Who can I contact for questions?', 'Message the couple or a member of the entourage. Add a phone number here.'),
    ],
  },
  registry: {
    header: {
      subtitle: 'Wishing Well',
      title: 'Registry & Contributions',
      description: 'Your presence is our greatest gift, but should you wish to honor us, we have provided options below.',
    },
    bankTransfer: {
      title: 'Bank Transfer',
      description: 'Help us start our new home together with a contribution by bank transfer or e-wallet.',
      banks: SAMPLE_BANKS,
    },
    curatedRegistry: {
      title: 'Curated Registry',
      description1: 'We have chosen a few things for our new home.',
      description2: 'Pick one below and we will mark it as yours.',
    },
  },
  rsvpCta: {
    subtitle: 'Join Our Day',
    title: 'Kindly RSVP',
    description: 'We would be deeply honored by your presence. Please send your response before {rsvpDate}.',
    buttonText: 'Confirm Your Attendance',
    backgroundImage: photo('wedding-table'),
  },
  rsvpForm: {
    header: {
      subtitle: 'R.S.V.P',
      title: 'The Response',
      description: 'We would be deeply honored by your presence. Please send your response before {rsvpDate}.',
    },
    labels: RSVP_LABELS,
    attendanceOptions: { yes: 'Joyfully Accepts', no: 'Regretfully Declines' },
    actions: {
      privacyText: privacyText('organizing and managing this wedding'),
      submitButton: 'Confirm Attendance',
      submittingButton: 'Confirming...',
    },
    successModal: {
      title: 'Thank You!',
      description: 'Your response has been recorded. We cannot wait to celebrate with you.\n\nShould you wish to honor us with a gift, please view our registry.',
      buttonText: 'View Registry',
    },
  },
};
