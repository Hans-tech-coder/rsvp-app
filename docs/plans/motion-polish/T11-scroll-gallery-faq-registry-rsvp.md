# T11: Apply scroll effects — Gallery + FAQ + Registry + RSVP

**Skills:** `lean-build`, `motion`. Read T08's **Result** section for the
chosen intensity and the primitive APIs, and follow T08's "Luxury rules".

## Files

`src/components/screens/GalleryScreen.tsx`, `FaqScreen.tsx`, `RegistryScreen.tsx`,
`RsvpCtaScreen.tsx`, `RsvpScreen.tsx` (all in `src/components/screens/`), and the
T08 primitives. **Do not touch** `circular-image-gallery.tsx`,
`CuratedRegistryScreen.tsx` or `GiftSelectionModal.tsx`; they have their own
motion.

## Direction

- **Gallery:** the header and grid reveal. The circular gallery keeps its own
  motion.
- **FAQ:** questions reveal with a light stagger.
- **Registry:** bank cards reveal. The curated gift list is untouched.
- **RSVP CTA:** one reveal for the call-to-action.
- **RSVP form:** only the heading reveals. Form fields never animate on scroll.
- Replace the existing `whileInView` blocks with the primitives.

## Done when

- Per screen: a full scroll has slow frames at or below 5% and CLS below 0.05.
- Reduced motion is static.
- The RSVP form still submits (use a test invite code, not a real guest's).
- Lint and build pass.

## Result

**Changes** (all old `whileInView`/`Variants` blocks removed; each scrolling
screen got a `ref` + `ScrollContainerProvider`):

- **Gallery:** header keeps `TextsReveal`; the two-row slider block is one
  `<ScrollReveal className="mt-8">` around the masked wrapper (the primitive
  has no `style` prop, so the mask stays on the inner div). Continue →
  `<ScrollReveal delay={0.2}>`. Circular gallery untouched; still opens/closes.
- **FAQ:** one `<ScrollReveal>` per question with delay
  `min(index × 0.06, 0.24)` s — a light stagger for the ones visible together,
  no off-screen reveals (T10 rule). Accordion still opens. Continue as above.
- **Registry:** each bank/curated card its own `ScrollReveal`, second delayed
  `SCROLL_MOTION.revealStagger`; cards got `h-full` so heights still match
  (398 / 398 px desktop). Curated list and modals untouched.
- **RSVP CTA:** not scrollable; one `<ScrollReveal delay={0.6}>` on the button
  so it follows the `TextsReveal` lines (0 → 1 opacity, 16 → 0 px, done ~1.6 s
  after the tap).
- **RSVP form:** the card-level fade/rise (which moved every field) removed.
  Only the heading reveals, via its existing `TextsReveal`. No primitives, no
  provider needed.
- `docs/conventions.md`: added the long-list rule (per-item reveal, capped
  index delay).

**Measurements (production build, full scroll top → bottom in 5 s):**

| Screen | 375×812 slow frames | CLS | Desktop 1345 px slow frames | CLS | Long tasks |
| --- | --- | --- | --- | --- | --- |
| Gallery | 0 / 826 (0 %) | 0 | 2 / 594 (0.34 %) | 0 | none |
| FAQ | 0 / 822 (0 %) | 0 | 0 / 796 (0 %) | 0 | none |
| Registry | 0 / 598 (0 %) | 0 | 0 / 814 (0 %) | 0 | none |
| RSVP CTA (entry, not scrollable) | 0 / 280 (0 %) | 0 | – | – | none |
| RSVP form | 0 / 500 (0 %) | 0 | – | – | none |

After each scroll nothing wrapped by a primitive was left at opacity 0 (only
image skeletons and hover overlays, as intended).

**Checks:** lint on the five files 16 → 15 problems (one unused `Variants`
import gone; the rest are older); build OK. Reduced motion verified in code
only (pane cannot emulate it): every primitive renders a static `div`, and the
RSVP form has no scroll motion left. During the form scroll no field (8
inputs/buttons) nor any ancestor had a transform or opacity < 1.
**RSVP submit verified** with the owner's test invite code (test name/email,
"Joyfully Accepts", consent ticked) → "Thank You!" modal. No phone check.
