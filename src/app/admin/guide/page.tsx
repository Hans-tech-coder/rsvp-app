import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { CalendarRange, Image as ImageIcon, Key, Users, Gift, UsersRound, Lightbulb, type LucideIcon } from 'lucide-react';
import { getAdmin } from '@/lib/requireAdmin';

// Admin guide (F14): how to run an event, in plain words, for organizers and
// clients who are not technical. Static; keep it in step with the admin pages
// it names (button and page names are quoted as they appear).

type Section = { icon: LucideIcon; title: string; who?: string; steps: ReactNode[] };

const SECTIONS: Section[] = [
  {
    icon: CalendarRange,
    title: 'Pick your event',
    steps: [
      'The event you are working on is shown at the top of the menu. Tap it to switch to another event.',
      <>
        <b>All Events</b> lists every event you can open, with its RSVP numbers. Press <b>Open</b> to work on one, or{' '}
        <b>View site</b> to see what guests see.
      </>,
    ],
  },
  {
    icon: ImageIcon,
    title: 'Change words, photos and colors',
    steps: [
      <>
        <b>Content</b> has one tab for each part of the site: the welcome cover, the story, the people, the venues and
        so on. On a tablet or computer, the <b>Visual Builder</b> shows the site itself: click any part of it to edit it.
      </>,
      <>
        Your changes are saved as a draft by themselves after a few seconds (or press <b>Save Draft</b>). Guests do not
        see a draft. Press <b>Preview</b> to look at the draft site.
      </>,
      <>
        Press <b>Publish</b> when you are happy: the changes go live for guests. <b>Undo</b> goes back to the last saved
        version; <b>History</b> brings back an earlier published version.
      </>,
      'One person at a time can use the Visual Builder. If someone else is in it, you will see who, and you can take over.',
      'Colors, fonts, music and the order of the pages may be locked by your organizer.',
    ],
  },
  {
    icon: Key,
    title: 'Invite your guests',
    steps: [
      <>
        In <b>Invites</b>, generate one code per invitation. Each code works once: it unlocks the RSVP form on the site.
      </>,
      'The copy button next to a code copies your invitation message with that code in it, ready to paste in a chat or email. The code then gets a check mark, so you know it was sent.',
      <>
        Change the invitation message with <b>Edit Message</b>.
      </>,
      'If a code went to the wrong person, regenerate it: the old code stops working.',
    ],
  },
  {
    icon: Users,
    title: 'Follow the RSVPs',
    steps: [
      <>
        <b>Dashboard</b> shows the totals: who is coming, who is not, who has not answered yet.
      </>,
      <>
        <b>Guests</b> lists every answer with the guest’s message. Search by name, open one for the details, or press{' '}
        <b>Export CSV</b> to get the list as a spreadsheet.
      </>,
      'Guests receive a confirmation email when they answer.',
    ],
  },
  {
    icon: Gift,
    title: 'Gifts',
    steps: [
      <>
        <b>Gifts</b> is the wish list guests see: the gift, a link to the store, and how many guests may claim it.
      </>,
      <>
        <b>Registry</b> shows who claimed which gift. Delete a claim, or reset a gift’s claims, to make it free again.
      </>,
    ],
  },
  {
    icon: UsersRound,
    title: 'Team and settings',
    who: 'Organizers',
    steps: [
      <>
        In <b>Team</b>, add someone with the email of their Google account and choose their role. A client can edit texts,
        photos, guests and gifts; turn on “Clients may change the design” to let them change colors, fonts, music and the
        order of the pages too. Activity shows who changed what.
      </>,
      <>
        In <b>Settings</b>, set the name guests see on emails and the address their replies go to, and see how much of
        the photo storage the event uses.
      </>,
    ],
  },
  {
    icon: Lightbulb,
    title: 'Good to know',
    steps: [
      'Most guests open the site on a phone. After a change, look at it on yours.',
      'Photos are made smaller when you upload them, so any phone photo is fine.',
      'Nothing you do in a draft can break the live site: guests only see what you publish.',
    ],
  },
];

export default async function GuidePage() {
  if (!(await getAdmin())) redirect('/api/logout');

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">Guide</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">How to run your event, step by step.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {SECTIONS.map(({ icon: Icon, title, who, steps }, n) => (
          <section key={title} aria-labelledby={`guide-${n}`} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 shrink-0 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-700 dark:text-zinc-300">
                <Icon className="w-4 h-4" aria-hidden="true" />
              </span>
              <h2 id={`guide-${n}`} className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                {title}
              </h2>
              {who && (
                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {who}
                </span>
              )}
            </div>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-gray-600 dark:text-zinc-400 list-disc pl-5 marker:text-gray-300 dark:marker:text-zinc-600 [&_b]:font-semibold [&_b]:text-gray-900 dark:[&_b]:text-zinc-100">
              {steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
