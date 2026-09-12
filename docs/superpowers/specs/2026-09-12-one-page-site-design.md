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
The About page, removed in the rebrand, returns as a section with no chef content. Otherwise
content, palette, typography, and the scroll-driven motion stay as they are.

## Goals

- Every piece of content (the full menu, gallery, the restaurant's story, and contact details)
  on a single page.
- Header navigation that smooth-scrolls to sections and shows which section is in view.
- Old `/menu`, `/gallery`, `/about`, and `/contact` links keep working.
- No regression in the robustness rules: content is never permanently invisible, and reduced
  motion is honored.

## Non-goals

- Updating the URL hash while the visitor scrolls.
- Any replacement for the route slide transitions.
- Palette or typography changes.
- Chef content: no chef name, role, portrait, or `Chef` type.

## Page structure

Sections render in this order from `src/app/page.tsx`:

| Anchor | Section | Heading |
| --- | --- | --- |
| `#top` | Hero | `h1` "Live flame, seasonal plates" — the only `h1` |
| — | Statement | none |
| — | Signatures (pinned horizontal sequence) | `h2` "Plates worth the trip" |
| `#menu` | Full menu: all 19 dishes in 5 courses, sticky course navigation | `h2` "The Menu"; courses `h3`; dish names `h4` |
| `#gallery` | Gallery grid with lightbox | `h2` "The Room" |
| `#about` | The restaurant's story and a four-entry timeline, text only | `h2` "Built around the grill"; milestone titles `h3` |
| `#contact` | Visit us: hours, address, map placeholder, enquiry form | `h2` "Visit us" |
| — | Footer | — |

Course anchors (`#starters`, `#mains`, `#sides`, `#desserts`, `#drinks`) are unchanged and do
not collide with section anchors.

**Footer.** The footer currently repeats the venue details, which would appear twice in a row
beneath Visit us. It becomes slim: the brand name, links to the four sections, and the
copyright line. Venue details live only in the Visit us section.

**Metadata.** One title and description, set in `src/app/layout.tsx`. Per-page `metadata`
exports disappear with the route files.

**Header links.** The brand links to `/#top`. Menu, Gallery, About, and Contact, in page
order, link to `/#menu`, `/#gallery`, `/#about`, and `/#contact`; Reserve links to
`/#contact`. Links start with `/` so they also work from the 404 page.

**Redirects.** `next.config.js` declares permanent redirects from `/menu`, `/gallery`,
`/about`, and `/contact` to `/#menu`, `/#gallery`, `/#about`, and `/#contact`. `/about` is
included because that URL existed before the rebrand. Next.js preserves the fragment in a
redirect destination (`prepare-destination` appends the parsed hash).

## About section

The About section sits between the gallery and Visit us, so the story reaches guests who are
close to booking. It is text only: two story paragraphs, centered at about 60 characters, then
a four-entry timeline. Paragraphs reveal together and milestones reveal one at a time. The copy
is new; nothing is carried over from the removed page, which told the chef's story in the
earlier brand's wording.

**Heading:** "Built around the grill" (`h2`).

**Story**

1. Cinder & Salt started as a weekend supper club: one charcoal grill, a crate of flake salt,
   and twelve borrowed chairs. The idea has not changed since — cook over live flame, season
   simply, and let what arrives each morning decide the menu.
2. Everything still passes through one grill. Vegetables char beside the ribeye, bread toasts
   over the last of the coals, and every plate leaves the pass while it is still hot.

**Timeline**

| Year | Title (`h3`) | Body |
| --- | --- | --- |
| 2016 | Weekend supper club | Twelve seats around a charcoal grill in a Poblacion courtyard, open on Saturdays only. |
| 2019 | Cinderwood Lane | The first permanent room opened at 27 Cinderwood Lane, with the grill in full view of every table. |
| 2022 | Farms and day boats | Produce and seafood now come directly from partner farms and day boats, with no distributors in between. |
| 2026 | Cinder & Salt today | One live-flame menu, served six nights a week. |

"Six nights" matches the venue hours, which close on Mondays.

## Navigation and scrolling

**Anchor scrolling.** `SmoothScrollProvider` enables Lenis's `anchors` option, so same-page
section links smooth-scroll. Every section sets `scroll-margin-top: var(--space-10)`, the
scrolled header height (64px). Lenis's `scrollTo` reads the target's `scroll-margin-top`, so
that one CSS value sets the stop point below the fixed header for smooth scrolling and for the
native jump under reduced motion. No separate Lenis offset is passed; one would double it.

**Link markup.** Internal links use `href={sectionHref(id)}` expressions. The
`@next/next/no-html-link-for-pages` lint rule reports a string-literal `href="/#menu"` (it
strips the hash and matches the `/` route) but skips non-literal values.

**Arriving with a hash.** A direct visit to `/#menu` (including through a redirect) jumps
natively before `PinnedSequence` adds its pin spacing, so the jump lands short. After the
existing `ScrollTrigger.refresh()` on load, `SmoothScrollProvider` scrolls to the
`location.hash` target immediately; `scrollTo` again applies the section's
`scroll-margin-top`. Under reduced motion no pins exist,
so the native jump is already correct and nothing extra runs. The re-scroll runs on `load`, or
immediately if the document has already finished loading (`document.readyState ===
'complete'`), because hydration can finish after `load` has fired. It is skipped on a page
reload, so the browser's restored scroll position wins. It runs only when the hash matches an
element on the page.

**Active section.** A new hook, `useActiveSection(ids)`, observes the given elements with a
single `IntersectionObserver` using the band CourseNav already uses
(`rootMargin: '-40% 0px -55% 0px'`) and returns the id in view, or `null`.

- The header uses it for `menu`, `gallery`, `about`, and `contact`. The active link gets
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
hidden. `autoToggle` depends on Lenis's stylesheet (`lenis/dist/lenis.css`, imported in the
root layout), which makes overflow changes on `<html>` fire the `transitionend` event Lenis
listens for.

## Code changes

**New**

- `src/components/menu/MenuSection.tsx` and CSS module, from `src/app/menu/page.tsx` and
  `menu.module.css`.
- `src/components/gallery/GallerySection.tsx` and CSS module, from `src/app/gallery/`.
- `src/components/contact/VisitSection.tsx` and CSS module, from `src/app/contact/`.
- `src/hooks/useActiveSection.ts`.
- `src/lib/sections.ts`: the four section ids and labels and `sectionHref`, shared by the
  header, footer, and page test.
- `src/content/about.ts`, exporting `about { title, story, milestones }`, and a `Milestone`
  type (`year`, `title`, `body`) in `src/types/index.ts`.
- `src/components/about/AboutSection.tsx` and CSS module. Timeline styles come from the removed
  `about.module.css`; its portrait grid, name, and role styles are not restored.

**Changed**

- `src/app/page.tsx` composes every section.
- `next.config.js` adds the four redirects.
- `Header.tsx` uses section links, the hook, and plain anchors.
- `Footer.tsx` and its CSS become the slim footer.
- `CourseNav.tsx` uses the hook and sets `aria-current`.
- `SmoothScrollProvider.tsx` enables `anchors` and `autoToggle` and re-scrolls to the hash
  after refresh.
- `src/app/layout.tsx` imports `lenis/dist/lenis.css`, which `autoToggle` depends on.
- `GalleryGrid.tsx` locks scroll on `<html>`.
- `globals.css` drops the route-transition styles and adds section `scroll-margin-top`.
- Section headings drop one level as listed in Page structure.

**Deleted**

- `src/app/menu/`, `src/app/gallery/`, `src/app/contact/`.
- `src/components/motion/PageTransition.tsx` and `tests/components/PageTransition.test.tsx`.

## Testing

- **New:** `useActiveSection` reports the intersecting section and `null` when none is.
  `MenuSection` renders all 19 dishes across 5 courses with the heading levels above.
  `VisitSection` renders venue details and the enquiry form. `AboutSection` renders both story
  paragraphs and four milestones with `h2` and `h3` headings, and no image. `next.config.js`
  returns the four permanent redirects. `Footer` renders the four section links and no venue
  details.
- **Updated:** `Header` asserts the four `/#…` section hrefs in page order and `aria-current` following the active section,
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
  when an anchor scroll arrives and the 64px `scroll-margin-top` matches. The browser pass confirms this
  for a click made from the very top of the page.
- **`autoToggle` browser support.** Lenis detects the overflow change through
  `transition-behavior`. If a target browser does not trigger it, the fallback is to expose
  the Lenis instance through context and call `stop()` and `start()` from the lightbox.
