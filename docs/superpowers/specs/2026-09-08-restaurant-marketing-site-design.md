# Animated restaurant marketing site — design

**Date:** 2026-09-08
**Status:** Approved for planning
**Phase:** 1 of 3 (marketing site)

## Summary

Build a modern fine-dining restaurant website: five routes, cinematic scroll-driven
animation, static content, no backend. Reservations and online ordering are deliberately
deferred to later phases, each of which gets its own design and plan.

The site is a fresh Next.js 16 App Router + TypeScript project on a new branch off
`development`, replacing the legacy CRA/Redux code that currently occupies that branch.

## Goals

- A visually distinctive fine-dining site whose motion is the primary design device.
- Scroll-driven animation (parallax, pinned sequences, masked reveals) that stays smooth
  and does not break the App Router's server-rendering model.
- Content readable and navigable without JavaScript, and calm for visitors who ask for
  reduced motion.

## Non-goals (phase 1)

Reservations, online ordering, CMS integration, a real database or backend, authentication,
and internationalization. The nav's "Reserve" call to action points at `/contact` for now,
so introducing the real booking flow later is a route swap rather than a redesign.

## Context

The repository's `development` branch holds a legacy Create React App + Redux + SCSS
codebase. A separate `redesign` branch holds an unrelated Next.js food-ordering app
("Plateful"); it stays untouched, but its toolchain decisions are reused here because they
were resolved against real upstream incompatibilities.

## Scope decomposition

The original request covered marketing, reservations, and ordering — three independent
subsystems. They are split into phases:

1. **Phase 1 (this spec)** — the animated marketing site.
2. **Phase 2** — reservations: booking flow, availability rules, confirmation.
3. **Phase 3** — online ordering: menu selection, cart, checkout.

Phases 2 and 3 each require their own design document and implementation plan.

## Routes

| Route | Content | Signature motion |
| --- | --- | --- |
| `/` | Full-bleed hero, philosophy statement, signature-dish showcase, atmosphere strip, reservation call to action | Parallax hero with masked headline reveal; pinned horizontal dish sequence |
| `/menu` | Courses (starters, mains, desserts, wine) with sticky course navigation | Per-course scroll reveals; sticky nav highlights the active course |
| `/about` | Chef biography, kitchen philosophy, provenance timeline | Alternating image/text parallax; scrubbed timeline progress |
| `/gallery` | Interior and plating photography grid with lightbox | Staggered grid reveals; shared-element transition into the lightbox |
| `/contact` | Hours, address, map placeholder, enquiry form | Reveal on scroll; inline-validated form with a mock submit |

A shared shell provides a fixed header that shrinks and inverts on scroll, a footer with
hours and social links, and animated transitions between all five routes.

## Architecture

### Rendering model

Pages are Server Components. Animation lives in small client "islands" composed into those
pages, so GSAP never enters the server bundle and the majority of each page ships as static
HTML.

### Smooth scroll

A single `SmoothScrollProvider` (Lenis) mounts in the root layout and drives one
`requestAnimationFrame` loop that also calls `ScrollTrigger.update()`. Lenis and GSAP
therefore share one scroll source rather than competing for it. The provider disposes its
loop and instance on unmount.

### Animation primitives

Four client components, each a thin wrapper over `useGSAP` from `@gsap/react`, scoped so
GSAP reverts its own tweens and triggers on unmount:

- `<Reveal>` — fade, slide, or mask entrance on scroll, with `stagger` support for grids.
- `<Parallax>` — scrubbed vertical offset for images and background layers.
- `<PinnedSequence>` — pins a section and scrubs a timeline; used by the home dish showcase
  and the about-page timeline.
- `<SplitHeading>` — per-line or per-word masked headline reveal.

Pages compose these; individual pages do not author bespoke GSAP timelines. Anything that
cannot be expressed through a primitive is a signal to extend the primitive set, not to
inline a one-off timeline.

### Route transitions

React's `<ViewTransition>` component in the root layout. Next.js 16's App Router supports it
with no configuration (verified against the bundled Next.js documentation at
`node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`), so no third-party
transition library or custom router interception is needed. The gallery thumbnail-to-lightbox
morph uses a `view-transition-class` shared-element name. Browsers without View Transitions
support navigate normally, without animation.

### Robustness rules

Two rules are part of the design, not polish, because getting either wrong silently breaks
the site:

1. **Content is never permanently invisible.** Initial hidden states are applied by
   JavaScript inside `useGSAP`, never as static CSS. With JavaScript disabled, hydration
   failed, or an animation error thrown, every page still renders readable content.
2. **Reduced motion is honored via `gsap.matchMedia()`.** Under
   `prefers-reduced-motion: reduce`, pins, scrubs, and parallax are dropped and elements
   resolve directly to their final state; Lenis falls back to native scrolling.

`ScrollTrigger.refresh()` runs once fonts and images have settled, so trigger positions do
not drift as late-loading media changes layout.

## Content and data

Static, typed content modules under `src/content/` (`dishes.ts`, `courses.ts`, `chef.ts`,
`gallery.ts`, `venue.ts`), imported directly by Server Components. Shared interfaces live in
`src/types/`.

No mock API route: this content is static, so routing it through a fake fetch layer would add
indirection without representing anything real. Phase 2 and 3 introduce data that genuinely
comes from elsewhere; those phases decide their own data access.

Pure helpers that shape content for display (grouping dishes by course, deriving the menu's
course list) live in `src/lib/` so they are unit-testable without rendering React.

## Visual system

- **Palette:** near-black base, warm off-white, and a single brass/amber accent, defined as
  custom properties in one token stylesheet so the entire look is tunable from one file.
- **Typography:** a high-contrast display serif for headlines paired with a quiet sans for
  body text, both self-hosted via `next/font` to avoid layout shift.
- **Layout:** generous negative space, full-bleed imagery, restrained rules. Motion carries
  the drama rather than ornamentation.

## Images

`next/image` throughout, sourcing photography from Unsplash (the source already used
elsewhere in this repository) with `images.remotePatterns` in `next.config.js` restricted to
`images.unsplash.com`. Every image declares explicit `sizes` and a blur placeholder. The hero
and above-the-fold plating photographs use `priority`; everything else lazy-loads.

## Project setup

A new branch, `restaurant-site`, cut from `development`, containing a fresh Next.js 16 App
Router + TypeScript project at the repository root. The legacy files are removed: `src/App.js`, `src/index.js`,
`src/pages/`, `src/redux/`, `src/customHook/`, `src/utils/`, the SCSS stylesheets,
`webpack.config.js`, `.babelrc`, `.eslintrc.js`, and `public/index.html`.

### Toolchain

Configuration is carried over from the `redesign` branch rather than rediscovered: ESLint 9
flat config with `eslint-config-next`, Prettier, Jest 29 with React Testing Library via
`next/jest`, a `tsconfig` exposing the `@/*` alias, and `.nvmrc`.

Three version pins carry over with them, each for a documented upstream incompatibility:

- **TypeScript 6.x** — `eslint-config-next`'s bundled `typescript-eslint` peers on
  `typescript@<6.1.0`.
- **Jest 29.x** — Jest 30's `unrs-resolver` needs a native binding that fails to load on this
  machine, and its WASM fallback cannot see the real filesystem.
- **ESLint 9.x** — `eslint-config-next`'s bundled `eslint-plugin-react` peers on
  `eslint@<=9.7`.

`@unrs/resolver-binding-win32-x64-msvc` stays pinned in `optionalDependencies` for the same
resolver.

### New dependencies

`gsap`, `@gsap/react`, and `lenis`. Nothing else is added for animation.

## Testing

- **Unit** — pure content helpers in `src/lib/` (course grouping, menu derivation).
- **Component** — animation primitives verified in their reduced-motion path: content is
  present and visible with GSAP effectively inert. Header scroll state and navigation are
  also covered.
- **Not unit-tested** — the GSAP timelines themselves. jsdom has no layout engine, so scroll
  positions and pin calculations carry no meaning there. These are verified by running the
  site.
- **Verification gate** — `npm run build`, `npm run lint`, and `npm test` all pass, followed
  by a development-server pass across all five routes.

## Risks

- **Scroll-trigger drift from late-loading media.** Mitigated by refreshing ScrollTrigger
  after fonts and images settle, and by reserving image dimensions.
- **Pinned sequences on small screens.** Pinning is disabled below a breakpoint through
  `gsap.matchMedia()`; those sections degrade to ordinary stacked reveals.
- **Scope creep from phases 2 and 3.** The "Reserve" call to action deliberately points at
  `/contact` so no partial booking implementation leaks into this phase.
