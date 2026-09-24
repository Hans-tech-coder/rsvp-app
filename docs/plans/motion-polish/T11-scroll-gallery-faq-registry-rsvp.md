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

(fill in at the end of the session)
