import type { TemplateDocs } from './index';
import { EMBLEM, faq, group, guideline, person, photo, privacyText, venue } from './shared';

// The Corporate / Seminar template's starting content (placeholders: ./index.ts).
// Screens are renamed in catalog.ts: Timeline = Program, People = Speakers,
// RSVP = Registration. The RSVP form's proxy field asks for the company
// (it is still stored and listed as the proxy). Gallery and Registry start
// hidden; their texts are here for when they are switched on. Music off.

const program = (time: string, title: string, description: string, image: string) => ({ date: time, title, description, image });

export const corporateDocs: TemplateDocs = {
  globalSettings: {
    logo: EMBLEM,
    ogImage: photo('corporate-auditorium'),
    footerTagline: 'Learn, connect and grow together',
  },
  welcomeScreen: {
    backgroundImage: photo('corporate-auditorium'),
    subtitle: 'You are invited to',
    topText: 'Save the date',
    bottomText1: 'A day of ideas, learning and connection',
    bottomText2: '{eventDay} · {venueName}',
  },
  entranceScreen: { backgroundImage: photo('corporate-podium') },
  ourStory: {
    subtitle: 'The Program',
    title: 'Agenda',
    description: 'Times are a guide and may move a little on the day.',
    items: [
      program('REGISTRATION', 'Arrival & Registration', 'Get your name badge and kit, and enjoy coffee before we begin.', photo('corporate-networking')),
      program('{eventTime}', 'Opening & Keynote', 'Welcome remarks, followed by our keynote speaker on the theme of the day.', photo('corporate-speaker')),
      program('MIDDAY', 'Panel Discussion', 'Industry leaders share what is working, what is next, and take your questions.', photo('corporate-panel')),
      program('AFTERNOON', 'Workshops & Networking', 'Breakout sessions, then time to meet the speakers and fellow participants.', photo('corporate-questions')),
    ],
  },
  entourage: {
    subtitle: 'Meet the',
    title: 'Speakers',
    groups: [
      group('keynote', 'Keynote Speaker', 'featured', [person('Dr. Elena Reyes', 'Chief Executive Officer, Company Name')]),
      group('speakers', 'Speakers', 'list', [
        person('Miguel Torres', 'Head of Strategy, Company Name'),
        person('Sofia Ramos', 'Director of Operations, Company Name'),
        person('Paolo Navarro', 'Founder, Company Name'),
      ]),
      group('hosts', 'Hosts', 'featured', [person('Bea Villanueva', 'Event Host')]),
    ],
  },
  details: {
    header: { subtitle: 'The Venue', title: 'Where & When', description: 'See you at {venueName}, {eventCity}.' },
    venues: [
      venue('registration', 'Registration', 'Doors Open',
        'Registration opens 30 minutes before the program. Bring your confirmation email or invite code.',
        '{eventName}: Registration'),
      venue('program', 'Main Program', 'Talks & Sessions',
        'Keynote, panel discussion and workshops. Meals and snacks are provided.',
        '{eventName}'),
    ],
    orderOfEventsImage: '',
  },
  dressCode: {
    header: { subtitle: 'What to Wear', title: 'Attire' },
    title: 'Business Casual',
    description: 'Dress comfortably and professionally. The venue is air-conditioned, so a light jacket helps.',
    guidelines: [
      guideline('recommended', 'Recommended', 'Collared shirts, blouses, slacks, skirts, closed shoes; a blazer is optional.'),
      guideline('avoid', 'Please Avoid', 'Shorts, sleeveless tops and slippers.'),
    ],
    inspirationImages: [
      { type: 'Business Casual', url: photo('attire-blazer') },
      { type: 'Business', url: photo('attire-dark-suit') },
      { type: 'Business Casual', url: photo('attire-black-dress') },
    ],
  },
  gallery: {
    header: { subtitle: 'Highlights', title: 'Gallery' },
    images: [
      photo('corporate-auditorium'), photo('corporate-speaker'), photo('corporate-panel'), photo('corporate-networking'),
      photo('corporate-questions'), photo('corporate-session'), photo('corporate-hall'), photo('corporate-podium'),
    ],
  },
  faq: {
    header: { subtitle: 'Participant Information', title: 'Frequently Asked Questions', description: 'Everything you need before the day' },
    items: [
      faq('Is there a registration fee?', 'Tell participants here whether the event is free or how to pay.'),
      faq('What time should I arrive?', 'Registration opens 30 minutes before the program, which starts at {eventTime}.'),
      faq('Will there be a certificate?', 'Yes, certificates of attendance are given at the end of the program.'),
      faq('Are meals provided?', 'Meals and snacks are provided. Tell us about dietary needs in the notes of your registration.'),
      faq('Is parking available?', 'Add parking and transport details for {venueName} here.'),
      faq('Can I bring a colleague?', 'Seats are limited, so each participant needs their own invite code. Ask us for another code.'),
      faq('Who can I contact for questions?', 'Add the organizer’s email or phone number here.'),
    ],
  },
  registry: {
    header: { subtitle: 'Support', title: 'Sponsorships', description: 'Partner with us to make this event possible.' },
    bankTransfer: { title: 'Payment', description: 'Pay a registration fee or sponsorship by bank transfer or e-wallet.', banks: [] },
    curatedRegistry: { title: 'Sponsorship Packages', description1: 'Choose a package below.', description2: 'We will contact you with the details.' },
  },
  rsvpCta: {
    subtitle: 'Reserve Your Seat',
    title: 'Register Now',
    description: 'Seats are limited. Please register before {rsvpDate}.',
    buttonText: 'Register',
    backgroundImage: photo('corporate-hall'),
  },
  rsvpForm: {
    header: { subtitle: 'Registration', title: 'Reserve Your Seat', description: 'Seats are limited. Please register before {rsvpDate}.' },
    labels: {
      fullName: 'Full Name',
      email: 'Work Email',
      phone: 'Mobile Number',
      attendance: 'Will you attend?',
      proxy: 'Company / Organization',
      proxyPlaceholder: 'e.g. Company Name',
      message: 'Questions or notes for the organizers',
      messagePlaceholder: 'Dietary needs, accessibility, topics you would like covered...',
    },
    attendanceOptions: { yes: 'I Will Attend', no: 'I Can’t Make It' },
    actions: {
      privacyText: privacyText('organizing and managing this event'),
      submitButton: 'Register',
      submittingButton: 'Registering...',
    },
    successModal: {
      title: 'You Are Registered!',
      description: 'Your seat is reserved. A confirmation has been sent to your email. See you on {eventDate}.',
      buttonText: 'Back to the Event',
    },
  },
  music: { enabled: false, url: '', fileName: '', volume: 0.5 },
  siteText: {
    loading: { title: 'Loading', subtitle: 'Please wait' },
    entrance: {
      eyebrow: 'Registration',
      instructions: 'Please use the access code sent\nwith your invitation',
      button: 'Register',
      preparing: 'Preparing your registration...',
    },
    registry: { visitRegistry: 'View Packages' },
    giftModal: { intro: 'Please provide your details below to choose this package.', messagePlaceholder: 'Anything we should know...' },
    rsvp: {
      hints: {
        fullName: 'Your first and last name, as it should appear on your certificate.',
        email: 'We will send your registration confirmation here.',
        proxy: 'Where you work or the group you represent.',
        message: 'Optional: anything the organizers should know.',
      },
      errors: { attendanceMissing: 'Please let us know if you will attend.' },
    },
    footer: { credit: 'See you there.' },
    notFound: {
      heading: 'This page took a wrong turn',
      button: 'Back to the event',
      daysLeftOne: '{days} day until {couple} in {venue}',
      daysLeftMany: '{days} days until {couple} in {venue}',
      after: 'Thank you for joining {couple}',
    },
    seo: { title: '{couple}', description: 'Join us on {date}. Register for your seat.' },
  },
};
