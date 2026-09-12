# Cinder & Salt one-page site — design

**Date:** 2026-09-12
**Status:** Approved for planning
**Supersedes:** the Routes and Route transitions sections of
`2026-09-08-restaurant-marketing-site-design.md`. Everything else in that spec (rendering
model, animation primitives, robustness rules, content modules, visual system, toolchain)
still applies.

## Summary

Convert the Cinder & Salt marketing site from four routes (`/`, `/menu`, `/gallery`,
`/contact`) into one scrolling page. The header links scroll to sections instead of changing
routes, the old URLs redirect to those sections, and the route slide transitions are removed.
Content, palette, typography, and the scroll-driven motion stay as they are.

## Goals

- Every piece of content (the full menu, gallery, and contact details) on a single page.
- Header navigation that smooth-scrolls to sections and shows which section is in view.
- Old `/menu`, `/gallery`, and `/contact` links keep working.
- No regression in the robustness rules: content is never permanently invisible, and reduced
  motion is honored.

## Non-goals

- Updating the URL hash while the visitor scrolls.
- Any replacement for the route slide transitions.
- Content, palette, or typography changes.

## Page structure

Sections render in this order from `src/app/page.tsx`:

| Anchor | Section | Heading |
| --- | --- | --- |
| `#top` | Hero | `h1` "Live flame, seasonal plates" — the only `h1` |
| — | Statement | none |
| — | Signatures (pinned horizontal sequence) | `h2` "Plates worth the trip" |
| `#menu` | Full menu: all 19 dishes in 5 courses, sticky course navigation | `h2` "The Menu"; courses `h3`; dish names `h4` |
| `#gallery` | Gallery grid with lightbox | `h2` "The Room" |
| `#contact` | Visit us: hours, address, map placeholder, enquiry form | `h2` "Visit us" |
| — | Footer | — |

Course anchors (`#starters`, `#mains`, `#sides`, `#desserts`, `#drinks`) are unchanged and do
not collide with section anchors.

**Footer.** The footer currently repeats the venue details, which would appear twice in a row
beneath Visit us. It becomes slim: the brand name, links to the three sections, and the
copyright line. Venue details live only in the Visit us section.

**Metadata.** One title and description, set in `src/app/layout.tsx`. Per-page `metadata`
exports disappear with the route files.

**Header links.** The brand links to `/#top`; Menu, Gallery, and Contact link to `/#menu`,
`/#gallery`, and `/#contact`; Reserve links to `/#contact`. Links start with `/` so they also
work from the 404 page.

**Redirects.** `next.config.js` declares permanent redirects from `/menu`, `/gallery`, and
`/contact` to `/#menu`, `/#gallery`, and `/#contact`. Next.js preserves the fragment in a
redirect destination (`prepare-destination` appends the parsed hash).

## Navigation and scrolling

**Anchor scrolling.** `SmoothScrollProvider` enables Lenis's `anchors` option with an offset
equal to the scrolled header height (`--space-10`, 64px), so section links smooth-scroll and
stop below the fixed header. Every section also sets `scroll-margin-top: var(--space-10)`,
which covers the native jump when Lenis is not running under reduced motion.

**Arriving with a hash.** A direct visit to `/#menu` (including through a redirect) jumps
natively before `PinnedSequence` adds its pin spacing, so the jump lands short. After the
existing `ScrollTrigger.refresh()` on load, `SmoothScrollProvider` scrolls to the
`location.hash` target immediately, with the same offset. Under reduced motion no pins exist,
so the native jump is already correct and nothing extra runs.

**Active section.** A new hook, `useActiveSection(ids)`, observes the given elements with a
single `IntersectionObserver` using the band CourseNav already uses
(`rootMargin: '-40% 0px -55% 0px'`) and returns the id in view, or `null`.

- The header uses it for `menu`, `gallery`, and `contact`. The active link gets
  `data-active` and `aria-current="true"`. Over the hero, statement, and signatures no link is
  active.
- `CourseNav` switches to the same hook and adds `aria-current="true"` to the active course
  link.
- Header links become plain `<a>` elements; `next/link` and `usePathname` are dropped because
  nothing navigates between routes.

## Motion

**Removed:** the `PageTransition` component, the `nav-forward` and `nav-back` view-transition
styles and the slide and fade keyframes only they use, and every `transitionTypes` prop.

**Kept:** the gallery thumbnail-to-lightbox morph (it runs within a page via
`startTransition`), `Reveal`, `SplitHeading`, `Parallax`, `PinnedSequence`, and both
reduced-motion layers.

**Lightbox scroll lock.** The lightbox locks background scroll with
`body { overflow: hidden }`, which Lenis ignores, so the wheel can scroll the page behind an
open lightbox. This existed on the old gallery page and matters more mid-page. The lock moves
to the `<html>` element, and Lenis's `autoToggle` option pauses Lenis while that overflow is
hidden.

## Code changes

**New**

- `src/components/menu/MenuSection.tsx` and CSS module, from `src/app/menu/page.tsx` and
  `menu.module.css`.
- `src/components/gallery/GallerySection.tsx` and CSS module, from `src/app/gallery/`.
- `src/components/contact/VisitSection.tsx` and CSS module, from `src/app/contact/`.
- `src/hooks/useActiveSection.ts`.

**Changed**

- `src/app/page.tsx` composes every section.
- `next.config.js` adds the three redirects.
- `Header.tsx` uses section links, the hook, and plain anchors.
- `Footer.tsx` and its CSS become the slim footer.
- `CourseNav.tsx` uses the hook and sets `aria-current`.
- `SmoothScrollProvider.tsx` enables `anchors` and `autoToggle` and re-scrolls to the hash
  after refresh.
- `GalleryGrid.tsx` locks scroll on `<html>`.
- `globals.css` drops the route-transition styles and adds section `scroll-margin-top`.
- Section headings drop one level as listed in Page structure.

**Deleted**

- `src/app/menu/`, `src/app/gallery/`, `src/app/contact/`.
- `src/components/motion/PageTransition.tsx` and `tests/components/PageTransition.test.tsx`.

## Testing

- **New:** `useActiveSection` reports the intersecting section and `null` when none is.
  `MenuSection` renders all 19 dishes across 5 courses with the heading levels above.
  `VisitSection` renders venue details and the enquiry form. `next.config.js` returns the
  three permanent redirects. `Footer` renders the section links and no venue details.
- **Updated:** `Header` asserts `/#…` hrefs and `aria-current` following the active section,
  without a `usePathname` mock. `CourseNav` asserts `aria-current`. `SmoothScrollProvider`
  asserts the `anchors` and `autoToggle` options and the hash re-scroll. `GalleryGrid` asserts
  the lock on `<html>`.
- **Verification gate:** the full Jest suite, ESLint on changed files, and `next build`
  listing only `/` (plus `/_not-found`). Then a browser pass: header links smooth-scroll and
  highlight, `/menu` lands on the menu through the redirect, the lightbox blocks wheel scroll,
  and reduced motion jumps natively to the right place.

## Risks

- **Lenis anchor offset versus header height.** The header is 88px at the top of the page and
  64px once scrolled. Every section sits well below the fold, so the header has already shrunk
  when an anchor scroll arrives and the 64px offset matches. The browser pass confirms this
  for a click made from the very top of the page.
- **`autoToggle` browser support.** Lenis detects the overflow change through
  `transition-behavior`. If a target browser does not trigger it, the fallback is to expose
  the Lenis instance through context and call `stop()` and `start()` from the lightbox.
