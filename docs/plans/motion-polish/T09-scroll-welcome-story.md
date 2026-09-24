# T09: Apply scroll effects — Welcome + Our Story

**Skills:** `lean-build`, `motion`. Read T08's **Result** section for the
chosen intensity and the primitive APIs, and follow T08's "Luxury rules".

## Files

`src/components/screens/WelcomeScreen.tsx`, `src/components/screens/OurStoryScreen.tsx`,
and the T08 primitives. Use them; do not edit them. If a primitive needs a
change, note it in `findings.md` → Parking lot.

## Direction

- **Our Story** has the most impact: timeline entries reveal in sequence as
  they arrive, with one gentle parallax on the photos.
- **Welcome** is a single screen with little or no scroll. Only add motion if
  it scrolls. Otherwise leave it and write "no change, not scrollable" in
  Result.
- Replace the existing ad-hoc `whileInView` blocks in these files with the
  primitives. Never stack two animations on one element.

## Done when

- Per screen: a full scroll to the bottom has slow frames at or below 5% and CLS
  below 0.05.
- Reduced motion is static.
- It feels good on a real phone (one line in Result).
- Lint and build pass.

## Result

(fill in at the end of the session)
