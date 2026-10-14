// Labels for the Site Text editor, one group per screen. `path` is the key in
// `siteText` (src/data/wedding-content.json). A key missing here is not
// editable, so add a field to both places.

import { TEXT_LIMITS } from './CharCount';

export type SiteTextField = {
  path: string;
  label: string;
  /** Shown under the field, e.g. which {placeholders} the text may use. */
  hint?: string;
  multiline?: boolean;
  /** Character limit (input stops there, counter shown). */
  max?: number;
};

export type SiteTextGroup = {
  id: string;
  title: string;
  description: string;
  fields: SiteTextField[];
};

export const SITE_TEXT_GROUPS: SiteTextGroup[] = [
  {
    id: 'common',
    title: 'Every screen',
    description: 'Wording shared by all screens.',
    fields: [
      { path: 'common.continue', label: '"Continue" button at the bottom of each screen', max: TEXT_LIMITS.button },
      { path: 'common.view', label: '"View" label on Gallery and Dress Code photos (computers, on hover)', max: TEXT_LIMITS.button },
    ],
  },
  {
    id: 'menu',
    title: 'Menu',
    description: 'Names of the screens in the menu (top-right button).',
    fields: [
      { path: 'menu.welcome', label: 'Welcome', max: TEXT_LIMITS.button },
      { path: 'menu.ourStory', label: 'Timeline (Our Story)', max: TEXT_LIMITS.button },
      { path: 'menu.entourage', label: 'People (Entourage)', max: TEXT_LIMITS.button },
      { path: 'menu.details', label: 'Venues (Event Details)', max: TEXT_LIMITS.button },
      { path: 'menu.dressCode', label: 'Dress Code', max: TEXT_LIMITS.button },
      { path: 'menu.gallery', label: 'Gallery', max: TEXT_LIMITS.button },
      { path: 'menu.faqs', label: 'FAQs', max: TEXT_LIMITS.button },
      { path: 'menu.registry', label: 'Registry', max: TEXT_LIMITS.button },
      { path: 'menu.rsvpCta', label: 'RSVP call to action', max: TEXT_LIMITS.button },
      { path: 'menu.rsvp', label: 'RSVP form', max: TEXT_LIMITS.button },
    ],
  },
  {
    id: 'loading',
    title: 'Loading screen',
    description: 'Shown for a moment while the site opens.',
    fields: [
      { path: 'loading.title', label: 'Main line' },
      { path: 'loading.subtitle', label: 'Small line' },
    ],
  },
  {
    id: 'welcome',
    title: 'Welcome screen',
    description: 'Countdown labels and the hint that invites guests to move the 3D photo.',
    fields: [
      { path: 'welcome.days', label: 'Countdown: days' },
      { path: 'welcome.hours', label: 'Countdown: hours' },
      { path: 'welcome.minutes', label: 'Countdown: minutes' },
      { path: 'welcome.seconds', label: 'Countdown: seconds' },
      { path: 'motionHint.mouseTitle', label: 'Motion hint on computers: title' },
      { path: 'motionHint.mouseText', label: 'Motion hint on computers: line below' },
      { path: 'motionHint.tiltTitle', label: 'Motion hint on phones: title' },
      { path: 'motionHint.tiltText', label: 'Motion hint on phones: line below' },
      { path: 'motionHint.iosTitle', label: 'Motion hint on iPhones (tap to allow): title' },
      { path: 'motionHint.iosText', label: 'Motion hint on iPhones: line below' },
    ],
  },
  {
    id: 'music',
    title: 'Background music',
    description: 'The note that appears next to the music button when the music starts.',
    fields: [
      { path: 'music.title', label: 'Title' },
      { path: 'music.mouseHint', label: 'Line on computers' },
      { path: 'music.touchHint', label: 'Line on phones' },
    ],
  },
  {
    id: 'entrance',
    title: 'Invite code screen',
    description: 'The lock guests see before the RSVP form, where they type their invite code.',
    fields: [
      { path: 'entrance.eyebrow', label: 'Small heading above the names' },
      { path: 'entrance.instructions', label: 'Instructions', hint: 'Press Enter for a new line. Lines do not wrap, so keep them short.', multiline: true },
      { path: 'entrance.codePlaceholder', label: 'Code box placeholder' },
      { path: 'entrance.button', label: 'Button', max: TEXT_LIMITS.button },
      { path: 'entrance.validating', label: 'Button while checking the code', max: TEXT_LIMITS.button },
      { path: 'entrance.granted', label: 'Message when the code is accepted' },
      { path: 'entrance.preparing', label: 'Line below it' },
      { path: 'entrance.errors.invalid', label: 'Error: code does not exist' },
      { path: 'entrance.errors.used', label: 'Error: code already used' },
      { path: 'entrance.errors.failed', label: 'Error: could not check the code' },
    ],
  },
  {
    id: 'ourStory',
    title: 'Timeline (Our Story)',
    description: 'Wording on timeline entries.',
    fields: [{ path: 'ourStory.watchVideo', label: '"Watch Video" link on an entry with a video' }],
  },
  {
    id: 'details',
    title: 'Venues (Event Details)',
    description: 'Labels and buttons on the venue cards.',
    fields: [
      { path: 'details.location', label: 'Location label' },
      { path: 'details.address', label: 'Address label' },
      { path: 'details.viewLocation', label: 'Map button', max: TEXT_LIMITS.button },
      { path: 'details.addToCalendar', label: 'Calendar button', max: TEXT_LIMITS.button },
      { path: 'details.mapTitle', label: 'Map window title' },
      { path: 'details.saveCopy', label: 'Order of events: download button', max: TEXT_LIMITS.button },
      { path: 'details.downloading', label: 'Download button while saving', max: TEXT_LIMITS.button },
    ],
  },
  {
    id: 'dressCode',
    title: 'Dress Code',
    description: 'Section title. The guidelines and their titles are edited in the Dress Code tab.',
    fields: [
      { path: 'dressCode.inspiration', label: 'Outfit photos title' },
    ],
  },
  {
    id: 'registry',
    title: 'Registry',
    description: 'Buttons and the bank QR window.',
    fields: [
      { path: 'registry.visitRegistry', label: 'Button that opens the gift list', max: TEXT_LIMITS.button },
      { path: 'registry.scanQr', label: 'QR window: instruction' },
      { path: 'registry.thankYou', label: 'QR window: thank-you line' },
      { path: 'registry.qrMissing', label: 'QR window: text when a bank has no QR image', hint: '{bank} is replaced by the bank name.' },
    ],
  },
  {
    id: 'curatedRegistry',
    title: 'Gift list',
    description: 'The full-screen list of gifts guests can choose.',
    fields: [
      { path: 'curatedRegistry.title', label: 'Title' },
      { path: 'curatedRegistry.intro', label: 'Intro', multiline: true },
      { path: 'curatedRegistry.viewItem', label: 'Link to the item', max: TEXT_LIMITS.button },
      { path: 'curatedRegistry.selectGift', label: 'Select button', max: TEXT_LIMITS.button },
      { path: 'curatedRegistry.selected', label: 'Button when the gift is taken', max: TEXT_LIMITS.button },
      { path: 'curatedRegistry.errors.notFound', label: 'Error: gift was removed' },
      { path: 'curatedRegistry.errors.full', label: 'Error: gift already taken' },
      { path: 'curatedRegistry.errors.failed', label: 'Error: could not save the choice' },
    ],
  },
  {
    id: 'giftModal',
    title: 'Gift confirmation form',
    description: 'The small form shown after a guest picks a gift. The privacy text comes from the RSVP Form tab.',
    fields: [
      { path: 'giftModal.eyebrow', label: 'Small heading' },
      { path: 'giftModal.intro', label: 'Intro', multiline: true },
      { path: 'giftModal.nameLabel', label: 'Name label' },
      { path: 'giftModal.namePlaceholder', label: 'Name example' },
      { path: 'giftModal.emailLabel', label: 'Email label' },
      { path: 'giftModal.emailPlaceholder', label: 'Email example' },
      { path: 'giftModal.messageLabel', label: 'Message label' },
      { path: 'giftModal.messagePlaceholder', label: 'Message example' },
      { path: 'giftModal.submit', label: 'Button', max: TEXT_LIMITS.button },
    ],
  },
  {
    id: 'rsvp',
    title: 'RSVP form',
    description: 'Help lines, examples and error messages. Field labels are edited in the RSVP Form tab.',
    fields: [
      { path: 'rsvp.optional', label: 'Mark on optional fields' },
      { path: 'rsvp.requiredHintTitle', label: 'Required-fields note: title' },
      { path: 'rsvp.requiredHintText', label: 'Required-fields note: line', hint: '{star} shows the red asterisk.' },
      { path: 'rsvp.placeholders.fullName', label: 'Name example' },
      { path: 'rsvp.placeholders.email', label: 'Email example' },
      { path: 'rsvp.hints.fullName', label: 'Help line under the name' },
      { path: 'rsvp.hints.email', label: 'Help line under the email' },
      { path: 'rsvp.hints.attendance', label: 'Help line under the attendance choice' },
      { path: 'rsvp.hints.proxy', label: 'Help line under the proxy name' },
      { path: 'rsvp.hints.message', label: 'Help line under the message' },
      { path: 'rsvp.errors.fullNameMissing', label: 'Error: name empty' },
      { path: 'rsvp.errors.fullNameIncomplete', label: 'Error: only one name typed' },
      { path: 'rsvp.errors.emailMissing', label: 'Error: email empty' },
      { path: 'rsvp.errors.emailInvalid', label: 'Error: email not valid' },
      { path: 'rsvp.errors.phoneMissing', label: 'Error: phone empty' },
      { path: 'rsvp.errors.phoneTooShort', label: 'Error: phone too short', hint: '{country} = country name, {digits} = expected digits, {dial} = country code.' },
      { path: 'rsvp.errors.phoneTooShortOther', label: 'Error: phone too short ("Other country")', hint: '{min} = the fewest digits allowed.' },
      { path: 'rsvp.errors.attendanceMissing', label: 'Error: attendance not chosen' },
      { path: 'rsvp.errors.consentMissing', label: 'Error: privacy box not ticked' },
      { path: 'rsvp.errors.checkOne', label: 'Note when one field needs fixing' },
      { path: 'rsvp.errors.checkMany', label: 'Note when several fields need fixing', hint: '{count} = number of fields.' },
      { path: 'rsvp.errors.codeInvalid', label: 'Error on send: invite code not found' },
      { path: 'rsvp.errors.codeUsed', label: 'Error on send: invite code already used' },
      { path: 'rsvp.errors.submitFailed', label: 'Error on send: anything else' },
    ],
  },
  {
    id: 'phone',
    title: 'Phone number field',
    description: 'The guide line under the phone number on the RSVP form.',
    fields: [
      { path: 'phone.guide', label: 'Guide before typing', hint: '{digits} = expected digits, {dial} = country code.' },
      { path: 'phone.guideOther', label: 'Guide before typing ("Other country")' },
      { path: 'phone.remainingOne', label: 'One digit left' },
      { path: 'phone.remainingMany', label: 'Several digits left', hint: '{count} = digits left.' },
      { path: 'phone.looksGood', label: 'Number long enough' },
      { path: 'phone.complete', label: 'Number at full length' },
      { path: 'phone.otherOption', label: '"Other country" choice in the country list' },
      { path: 'phone.otherChip', label: 'Short label shown for "Other country"' },
      { path: 'phone.otherPlaceholder', label: 'Number example for "Other country"' },
    ],
  },
  {
    id: 'footer',
    title: 'Footer',
    description: 'Bottom of every scrolling screen. The tagline is in Global Settings.',
    fields: [{ path: 'footer.credit', label: 'Small last line' }],
  },
  {
    id: 'notFound',
    title: 'Page not found (404)',
    description: 'Shown when someone opens a link that does not exist.',
    fields: [
      { path: 'notFound.pageTitle', label: 'Browser tab title', hint: '{couple} = couple names from Global Settings.' },
      { path: 'notFound.heading', label: 'Heading' },
      { path: 'notFound.description', label: 'Description', multiline: true },
      { path: 'notFound.button', label: 'Button', max: TEXT_LIMITS.button },
      { path: 'notFound.resumeNote', label: 'Line under the button' },
      { path: 'notFound.daysLeftOne', label: 'Countdown line, 1 day left', hint: '{days}, {couple}, {venue}.' },
      { path: 'notFound.daysLeftMany', label: 'Countdown line, several days left', hint: '{days}, {couple}, {venue}.' },
      { path: 'notFound.after', label: 'Line after the wedding day', hint: '{couple}, {venue}.' },
    ],
  },
  {
    id: 'seo',
    title: 'Link preview and browser tab',
    description: 'What Google, Facebook and Messenger show when the link is shared. Shared-link previews may take a while to refresh on those sites.',
    fields: [
      { path: 'seo.title', label: 'Title', hint: '{couple}, {date} (from Target Date), {venue}.' },
      { path: 'seo.description', label: 'Description', hint: '{couple}, {date} (from Target Date), {venue}.', multiline: true },
    ],
  },
];
