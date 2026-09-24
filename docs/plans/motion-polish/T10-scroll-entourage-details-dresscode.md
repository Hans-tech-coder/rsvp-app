# T10: Apply scroll effects — Entourage + Details + Dress Code

**Skills:** `lean-build`, `motion`. Read T08's **Result** section for the
chosen intensity and the primitive APIs, and follow T08's "Luxury rules".

## Files

`src/components/screens/EntourageScreen.tsx`, `src/components/screens/DetailsScreen.tsx`,
`src/components/screens/DressCodeScreen.tsx`, and the T08 primitives. Use them;
do not edit them. If a primitive needs a change, note it in `findings.md` →
Parking lot.

## Direction

- **Entourage:** name groups reveal with a soft stagger. No parallax on text.
- **Details:** venue cards reveal. At most one parallax, on the venue image if
  there is one. Leave the download button alone.
- **Dress Code:** palette swatches can stagger in. The inspiration slider
  already moves on its own, so give it no extra scroll motion.
- Replace the existing `whileInView` blocks with the primitives.

## Done when

- Per screen: a full scroll has slow frames at or below 5% and CLS below 0.05.
- Reduced motion is static.
- Lint and build pass.

## Result

(fill in at the end of the session)
