# Animated Restaurant Marketing Site Implementation Plan

> **Rebrand note (2026-09-12):** this site is Cinder & Salt. The About page and its chef content were removed in the rebrand, and the examples below use the Cinder & Salt name. Task 10 (the About page) is kept only as a record of what was originally built.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a five-route, scroll-animated fine-dining restaurant marketing site as a fresh Next.js 16 App Router + TypeScript project on a new branch.

**Architecture:** Pages are Server Components composing small client "animation islands" built on GSAP + ScrollTrigger via `useGSAP`. One Lenis smooth-scroll provider in the root layout drives a single RAF loop shared with ScrollTrigger. Route transitions use React's `<ViewTransition>`, wrapped per page. Content is static typed modules imported directly — no API layer, no backend.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 6.x, GSAP 3 + `@gsap/react`, Lenis, CSS Modules + design tokens, Jest 29 + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-08-restaurant-marketing-site-design.md`

## Global Constraints

- Branch: `restaurant-site`, cut from `development`. All work lands here.
- Next.js `^16.3.4`, React `^19.2.8`, React DOM `^19.2.8`.
- **TypeScript pinned to `^6.0.3`** — do not upgrade to 7.x; `eslint-config-next`'s bundled `typescript-eslint` peers on `typescript@<6.1.0`.
- **Jest pinned to `^29.7.0`** (and `jest-environment-jsdom@^29.7.0`) — do not upgrade to 30.x; its `unrs-resolver` native binding fails to load on this machine.
- **ESLint pinned to `^9.39.5`** — stay on the 9.x line; do not upgrade to 10.x.
- `@unrs/resolver-binding-win32-x64-msvc` version `1.12.2` stays in `optionalDependencies`.
- Images come from Unsplash only. `images.remotePatterns` in `next.config.js` is restricted to hostname `images.unsplash.com`.
- **Robustness rule 1:** content is never permanently invisible. Initial hidden states are applied by JavaScript inside `useGSAP`, never as static CSS. Every page must render readable content with JavaScript disabled.
- **Robustness rule 2:** `prefers-reduced-motion: reduce` is honored via `gsap.matchMedia()`. Pins, scrubs, and parallax are dropped; elements resolve to their final state; Lenis falls back to native scrolling.
- Lint rules in force: single quotes, semicolons required, `no-console` is an error, unused args must be prefixed `_`.
- Out of scope for every task in this plan: reservations, online ordering, CMS, backend, authentication, i18n.

---

### Task 1: Branch, scaffold, and toolchain

Replaces the legacy Create React App / Redux / webpack code on `development` with a fresh Next.js 16 App Router project, and proves the build, lint, and test commands all run.

**Files:**
- Create: `package.json` (replace), `next.config.js`, `tsconfig.json`, `eslint.config.mjs`, `jest.config.js`, `jest.setup.js`, `.nvmrc`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/styles/globals.css`
- Delete: `src/App.js`, `src/RouterLists.js`, `src/index.js`, `src/pages/`, `src/redux/`, `src/customHook/`, `src/utils/`, `src/components/`, `src/styles/` (legacy SCSS/CSS), `src/tests/`, `src/assets/`, `public/index.html`, `webpack.config.js`, `.babelrc`, `.eslintrc.js`
- Test: `tests/lib/smoke.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a working Next.js project with `npm run dev`, `npm run build`, `npm run lint`, `npm test`; the `@/*` path alias resolving to `src/*`.

- [ ] **Step 1: Create the branch**

```bash
git checkout development
git checkout -b restaurant-site
```

- [ ] **Step 2: Remove the legacy application**

```bash
git rm -r --quiet src/App.js src/RouterLists.js src/index.js src/pages src/redux src/customHook src/utils src/components src/styles src/tests src/assets public/index.html webpack.config.js .babelrc .eslintrc.js
```

- [ ] **Step 3: Write the new `package.json`**

```json
{
  "name": "restaurant-site",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "jest"
  },
  "dependencies": {
    "@gsap/react": "^2.1.2",
    "gsap": "^3.13.0",
    "lenis": "^1.1.18",
    "next": "^16.3.4",
    "react": "^19.2.8",
    "react-dom": "^19.2.8"
  },
  "optionalDependencies": {
    "@unrs/resolver-binding-win32-x64-msvc": "1.12.2"
  },
  "devDependencies": {
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.3",
    "@types/jest": "^30.0.0",
    "@types/node": "^26.4.1",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "eslint": "^9.39.5",
    "eslint-config-next": "^16.3.4",
    "eslint-config-prettier": "^10.1.8",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "prettier": "^3.9.6",
    "typescript": "^6.0.3"
  }
}
```

- [ ] **Step 4: Write the config files**

`next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },
    "types": ["jest", "@testing-library/jest-dom"]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

`eslint.config.mjs`:

```js
import nextConfig from 'eslint-config-next/core-web-vitals';
import prettierConfig from 'eslint-config-prettier';

const eslintConfig = [
  ...nextConfig,
  prettierConfig,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'no-console': 'error',
      'no-debugger': 'error',
      'no-dupe-keys': 'error',
      'no-unused-vars': [
        'error',
        { vars: 'all', args: 'after-used', ignoreRestSiblings: false, argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
  },
  {
    ignores: ['coverage/**'],
  },
];

export default eslintConfig;
```

`jest.config.js`:

```js
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};

module.exports = createJestConfig(config);
```

`jest.setup.js`:

```js
require('@testing-library/jest-dom');
```

`.nvmrc`:

```
24.14.0
```

`.gitignore`:

```
node_modules
.next
.swc
coverage
tsconfig.tsbuildinfo
*.tsbuildinfo
```

- [ ] **Step 5: Write the minimal app shell**

`src/styles/globals.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}
```

`src/app/layout.tsx`:

```tsx
import { ReactNode } from 'react';
import { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Restaurant',
  description: 'Placeholder — replaced in Task 2.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`:

```tsx
export default function HomePage() {
  return <main>Scaffold online.</main>;
}
```

- [ ] **Step 6: Write the failing smoke test**

`tests/lib/smoke.test.ts`:

```ts
describe('toolchain', () => {
  it('runs TypeScript tests', () => {
    const doubled = [1, 2, 3].map((n) => n * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });
});
```

- [ ] **Step 7: Install dependencies and run the verification gate**

```bash
npm install
npm test
npm run lint
npm run build
```

Expected: `npm test` passes 1 test; `npm run lint` exits 0 with no output; `npm run build` completes and reports the `/` route. If `npm run lint` hangs for minutes, install the resolver fallback: `npm install --no-save --force @unrs/resolver-binding-wasm32-wasi`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js App Router project, remove legacy CRA code"
```

---

### Task 2: Design tokens, fonts, and layout shell

Establishes the fine-dining visual system: token stylesheet, self-hosted fonts, and a root layout that renders a header and footer around every page.

**Files:**
- Create: `src/styles/tokens.css`, `src/lib/motion.ts`
- Modify: `src/styles/globals.css`, `src/app/layout.tsx`
- Test: `tests/lib/motion.test.ts`

**Interfaces:**
- Consumes: the scaffold from Task 1.
- Produces:
  - CSS custom properties on `:root` — `--ink`, `--ink-muted`, `--surface`, `--surface-raised`, `--accent`, `--font-display`, `--font-body`, plus `--space-1` … `--space-16`.
  - `src/lib/motion.ts` exporting `export const DURATION: { fast: number; base: number; slow: number }` and `export const EASE: { out: string; inOut: string }` and `export function prefersReducedMotion(): boolean`.

- [ ] **Step 1: Write the failing test**

`tests/lib/motion.test.ts`:

```ts
import { DURATION, EASE, prefersReducedMotion } from '@/lib/motion';

describe('motion constants', () => {
  it('exposes ascending durations', () => {
    expect(DURATION.fast).toBeLessThan(DURATION.base);
    expect(DURATION.base).toBeLessThan(DURATION.slow);
  });

  it('exposes GSAP easing strings', () => {
    expect(typeof EASE.out).toBe('string');
    expect(typeof EASE.inOut).toBe('string');
  });
});

describe('prefersReducedMotion', () => {
  it('is true when the media query matches', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    expect(prefersReducedMotion()).toBe(true);
  });

  it('is false when the media query does not match', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    expect(prefersReducedMotion()).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/lib/motion.test.ts`
Expected: FAIL — cannot find module `@/lib/motion`.

- [ ] **Step 3: Write `src/lib/motion.ts`**

```ts
export const DURATION = {
  fast: 0.3,
  base: 0.8,
  slow: 1.4,
};

export const EASE = {
  out: 'power3.out',
  inOut: 'power2.inOut',
};

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest tests/lib/motion.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Write `src/styles/tokens.css`**

```css
:root {
  /* Ink and surfaces — near-black base, warm off-white, single brass accent */
  --ink: #f4efe7;
  --ink-muted: #a89f92;
  --ink-subtle: #7a7269;
  --ink-inverse: #0d0c0b;
  --surface: #0d0c0b;
  --surface-raised: #16140f;
  --surface-veil: rgba(13, 12, 11, 0.72);
  --accent: #c8a24a;
  --accent-strong: #dfba63;
  --border: #2a2621;

  /* Spacing, 4px base */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-8: 48px;
  --space-10: 64px;
  --space-12: 96px;
  --space-16: 144px;

  /* Type scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.75rem;
  --text-2xl: 2.5rem;
  --text-3xl: 4rem;
  --text-4xl: 6rem;
  --leading-tight: 1.05;
  --leading-normal: 1.6;
  --tracking-wide: 0.18em;

  --content-max: 1240px;
  --header-height: 88px;
}
```

- [ ] **Step 6: Replace `src/styles/globals.css`**

```css
@import './tokens.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body), Georgia, serif;
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1,
h2,
h3 {
  font-family: var(--font-display), Georgia, serif;
  font-weight: 400;
  line-height: var(--leading-tight);
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
```

- [ ] **Step 7: Wire fonts and metadata into `src/app/layout.tsx`**

```tsx
import { ReactNode } from 'react';
import { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import '../styles/globals.css';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  display: 'swap',
  variable: '--font-display',
});

const body = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: {
    default: 'Cinder & Salt',
    template: '%s · Cinder & Salt',
  },
  description:
    'A seasonal tasting menu cooked over open flame, served in a room built for long evenings.',
  openGraph: {
    title: 'Cinder & Salt',
    description:
      'A seasonal tasting menu cooked over open flame, served in a room built for long evenings.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Verify and commit**

```bash
npm test
npm run lint
npm run build
git add -A
git commit -m "Add design tokens, fonts, and motion constants"
```

Expected: all three commands succeed.

---

### Task 3: Types, content modules, and menu helpers

All site copy and data as typed static modules, plus the pure helpers that shape them for display.

**Files:**
- Create: `src/types/index.ts`, `src/content/venue.ts`, `src/content/dishes.ts`, `src/content/chef.ts`, `src/content/gallery.ts`, `src/lib/menu.ts`
- Test: `tests/lib/menu.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `Course = 'starters' | 'mains' | 'desserts' | 'wine'`
  - `interface Dish { id: string; name: string; description: string; course: Course; price: number; image: string; signature: boolean }`
  - `interface GalleryImage { id: string; src: string; alt: string; width: number; height: number }`
  - `interface TimelineEntry { year: string; title: string; body: string }`
  - `venue: { name: string; tagline: string; address: string[]; phone: string; email: string; hours: { days: string; time: string }[] }`
  - `dishes: Dish[]`, `chef: { name: string; role: string; portrait: string; philosophy: string[]; timeline: TimelineEntry[] }`, `galleryImages: GalleryImage[]`
  - `groupByCourse(dishes: Dish[]): { course: Course; label: string; dishes: Dish[] }[]`
  - `signatureDishes(dishes: Dish[], limit?: number): Dish[]`
  - `COURSE_LABELS: Record<Course, string>`

- [ ] **Step 1: Write the failing test**

`tests/lib/menu.test.ts`:

```ts
import { COURSE_LABELS, groupByCourse, signatureDishes } from '@/lib/menu';
import { Dish } from '@/types';

const dish = (id: string, course: Dish['course'], signature = false): Dish => ({
  id,
  name: `Dish ${id}`,
  description: 'A description.',
  course,
  price: 1200,
  image: 'https://images.unsplash.com/photo-1',
  signature,
});

describe('groupByCourse', () => {
  it('groups dishes into the canonical course order', () => {
    const groups = groupByCourse([
      dish('a', 'desserts'),
      dish('b', 'starters'),
      dish('c', 'mains'),
    ]);

    expect(groups.map((g) => g.course)).toEqual(['starters', 'mains', 'desserts']);
  });

  it('labels each group', () => {
    const [group] = groupByCourse([dish('a', 'starters')]);
    expect(group.label).toBe(COURSE_LABELS.starters);
  });

  it('omits courses with no dishes', () => {
    const groups = groupByCourse([dish('a', 'wine')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].course).toBe('wine');
  });

  it('returns an empty array for no dishes', () => {
    expect(groupByCourse([])).toEqual([]);
  });
});

describe('signatureDishes', () => {
  it('returns only signature dishes', () => {
    const result = signatureDishes([
      dish('a', 'mains', true),
      dish('b', 'mains', false),
    ]);
    expect(result.map((d) => d.id)).toEqual(['a']);
  });

  it('respects the limit', () => {
    const result = signatureDishes(
      [dish('a', 'mains', true), dish('b', 'mains', true), dish('c', 'mains', true)],
      2,
    );
    expect(result).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/lib/menu.test.ts`
Expected: FAIL — cannot find module `@/lib/menu`.

- [ ] **Step 3: Write `src/types/index.ts`**

```ts
export type Course = 'starters' | 'mains' | 'desserts' | 'wine';

export interface Dish {
  id: string;
  name: string;
  description: string;
  course: Course;
  price: number;
  image: string;
  signature: boolean;
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface TimelineEntry {
  year: string;
  title: string;
  body: string;
}

export interface OpeningHours {
  days: string;
  time: string;
}

export interface Venue {
  name: string;
  tagline: string;
  address: string[];
  phone: string;
  email: string;
  hours: OpeningHours[];
}

export interface Chef {
  name: string;
  role: string;
  portrait: string;
  philosophy: string[];
  timeline: TimelineEntry[];
}
```

- [ ] **Step 4: Write `src/lib/menu.ts`**

```ts
import { Course, Dish } from '@/types';

export const COURSE_ORDER: Course[] = ['starters', 'mains', 'desserts', 'wine'];

export const COURSE_LABELS: Record<Course, string> = {
  starters: 'To Begin',
  mains: 'The Table',
  desserts: 'To Finish',
  wine: 'The Cellar',
};

export interface CourseGroup {
  course: Course;
  label: string;
  dishes: Dish[];
}

export function groupByCourse(dishes: Dish[]): CourseGroup[] {
  return COURSE_ORDER.map((course) => ({
    course,
    label: COURSE_LABELS[course],
    dishes: dishes.filter((dish) => dish.course === course),
  })).filter((group) => group.dishes.length > 0);
}

export function signatureDishes(dishes: Dish[], limit = 4): Dish[] {
  return dishes.filter((dish) => dish.signature).slice(0, limit);
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest tests/lib/menu.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Write the content modules**

`src/content/venue.ts`:

```ts
import { Venue } from '@/types';

export const venue: Venue = {
  name: 'Cinder & Salt',
  tagline: 'Cooked over open flame, served without ceremony.',
  address: ['27 Cinderwood Lane', 'Poblacion', 'Makati 1210'],
  phone: '+63 2 8123 4567',
  email: 'reserve@cinderandsalt.example',
  hours: [
    { days: 'Tuesday — Thursday', time: '18:00 — 23:00' },
    { days: 'Friday — Saturday', time: '17:30 — 00:30' },
    { days: 'Sunday', time: '17:30 — 22:00' },
    { days: 'Monday', time: 'Closed' },
  ],
};
```

`src/content/dishes.ts`:

```ts
import { Dish } from '@/types';

export const dishes: Dish[] = [
  {
    id: 'oyster',
    name: 'Salt-Cured Oyster',
    description: 'Cured over live coals, dressed with green apple and burnt lemon oil.',
    course: 'starters',
    price: 680,
    image:
      'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=1200&q=80&auto=format&fit=crop',
    signature: true,
  },
  {
    id: 'bone-marrow',
    name: 'Roasted Bone Marrow',
    description: 'Slow-roasted marrow, fermented chili, charred sourdough.',
    course: 'starters',
    price: 820,
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'scallop',
    name: 'Hand-Dived Scallop',
    description: 'Seared in brown butter, finished with kombu and yuzu.',
    course: 'starters',
    price: 940,
    image:
      'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'ribeye',
    name: 'Forty-Day Ribeye',
    description: 'Dry-aged, grilled over binchotan, bathed in bone jus.',
    course: 'mains',
    price: 2480,
    image:
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=1200&q=80&auto=format&fit=crop',
    signature: true,
  },
  {
    id: 'lobster',
    name: 'Fire-Roasted Lobster',
    description: 'Split and basted with garlic butter, smoked over applewood.',
    course: 'mains',
    price: 2180,
    image:
      'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=1200&q=80&auto=format&fit=crop',
    signature: true,
  },
  {
    id: 'duck',
    name: 'Aged Duck, Cherry',
    description: 'Twelve-day aged breast, sour cherry, fermented beetroot.',
    course: 'mains',
    price: 1860,
    image:
      'https://images.unsplash.com/photo-1562967914-608f82629710?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'celeriac',
    name: 'Whole Roast Celeriac',
    description: 'Buried in live coals for six hours, hazelnut, aged parmesan.',
    course: 'mains',
    price: 1280,
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'chocolate',
    name: 'Burnt Honey Chocolate',
    description: 'Single-origin ganache, burnt honey, smoked salt.',
    course: 'desserts',
    price: 620,
    image:
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&q=80&auto=format&fit=crop',
    signature: true,
  },
  {
    id: 'panna-cotta',
    name: 'Charred Pineapple Panna Cotta',
    description: 'Vanilla cream, grilled pineapple, black pepper caramel.',
    course: 'desserts',
    price: 540,
    image:
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'barolo',
    name: 'Barolo, Piedmont 2016',
    description: 'Tar and roses, long finish. Poured by the glass or bottle.',
    course: 'wine',
    price: 980,
    image:
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'old-fashioned',
    name: 'Smoked Old Fashioned',
    description: 'Barrel-aged bourbon, applewood smoke, orange oil.',
    course: 'wine',
    price: 520,
    image:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
];
```

`src/content/chef.ts`:

```ts
import { Chef } from '@/types';

export const chef: Chef = {
  name: 'Alex Rivera',
  role: 'Chef & Founder',
  portrait:
    'https://images.unsplash.com/photo-1583394293214-28a5b42f7f37?w=1200&q=80&auto=format&fit=crop',
  philosophy: [
    'We cook with fire because fire is honest. It rewards attention and punishes shortcuts, and everything that leaves this kitchen carries the mark of that argument.',
    'The menu changes when the market changes. Nothing is plated to be photographed; it is plated to be eaten while it is still hot.',
  ],
  timeline: [
    {
      year: '2014',
      title: 'A borrowed grill',
      body: 'Mira began cooking eight-seat suppers on a borrowed grill behind a shuttered bakery.',
    },
    {
      year: '2018',
      title: 'The first room',
      body: 'A twenty-two seat room opened on Cinderwood Lane, with a single hearth at its centre.',
    },
    {
      year: '2021',
      title: 'Provenance',
      body: 'Direct relationships with six farms and two day boats replaced every distributor.',
    },
    {
      year: '2025',
      title: 'Cinder & Salt today',
      body: 'One seasonal menu, served five nights a week, still cooked entirely over flame.',
    },
  ],
};
```

`src/content/gallery.ts`:

```ts
import { GalleryImage } from '@/types';

export const galleryImages: GalleryImage[] = [
  {
    id: 'hearth',
    src: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1600&q=80&auto=format&fit=crop',
    alt: 'The dining room at dusk, lit by the open hearth',
    width: 1600,
    height: 1067,
  },
  {
    id: 'pass',
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80&auto=format&fit=crop',
    alt: 'Plates waiting under the lamps at the pass',
    width: 1600,
    height: 1067,
  },
  {
    id: 'grill',
    src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80&auto=format&fit=crop',
    alt: 'Meat searing over binchotan coals',
    width: 1600,
    height: 1067,
  },
  {
    id: 'table',
    src: 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=1600&q=80&auto=format&fit=crop',
    alt: 'A laid table with candles and linen',
    width: 1600,
    height: 1067,
  },
  {
    id: 'cellar',
    src: 'https://images.unsplash.com/photo-1470158499416-75be9aa0c4db?w=1600&q=80&auto=format&fit=crop',
    alt: 'Bottles resting in the cellar',
    width: 1600,
    height: 1067,
  },
  {
    id: 'plating',
    src: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1600&q=80&auto=format&fit=crop',
    alt: 'A dish being finished with sauce at the pass',
    width: 1600,
    height: 1067,
  },
];
```

- [ ] **Step 7: Verify and commit**

```bash
npm test
npm run lint
git add -A
git commit -m "Add content modules, shared types, and menu helpers"
```

Expected: 10 tests pass across three suites; lint exits 0.

---

### Task 4: Smooth scroll provider

One Lenis instance driving a single RAF loop shared with ScrollTrigger, disabled under reduced motion.

**Files:**
- Create: `src/components/motion/gsap.ts`, `src/components/motion/SmoothScrollProvider.tsx`
- Modify: `src/app/layout.tsx`
- Test: `tests/components/SmoothScrollProvider.test.tsx`

**Interfaces:**
- Consumes: `prefersReducedMotion` from `@/lib/motion` (Task 2).
- Produces:
  - `src/components/motion/gsap.ts` re-exporting the registered instances: `export { gsap, ScrollTrigger, useGSAP }`. Every other motion component imports GSAP from this module so registration happens exactly once.
  - `<SmoothScrollProvider>{children}</SmoothScrollProvider>` — a client component rendering its children unchanged.

- [ ] **Step 1: Write the failing test**

`tests/components/SmoothScrollProvider.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import SmoothScrollProvider from '@/components/motion/SmoothScrollProvider';

beforeEach(() => {
  window.matchMedia = jest.fn().mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
});

describe('SmoothScrollProvider', () => {
  it('renders its children', () => {
    render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );
    expect(screen.getByText('Dining room')).toBeInTheDocument();
  });

  it('still renders children when reduced motion is requested', () => {
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );
    expect(screen.getByText('Dining room')).toBeInTheDocument();
  });

  it('unmounts without throwing', () => {
    const { unmount } = render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );
    expect(() => unmount()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/components/SmoothScrollProvider.test.tsx`
Expected: FAIL — cannot find module `@/components/motion/SmoothScrollProvider`.

- [ ] **Step 3: Write `src/components/motion/gsap.ts`**

```ts
'use client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export { gsap, ScrollTrigger, useGSAP };
```

- [ ] **Step 4: Write `src/components/motion/SmoothScrollProvider.tsx`**

```tsx
'use client';
import { ReactNode, useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';
import { prefersReducedMotion } from '@/lib/motion';

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });

    // Lenis owns the scroll position, so ScrollTrigger must read from it
    // rather than from the native scroll event, and both must advance on a
    // single ticker — two RAF loops fight each other and stutter.
    lenis.on('scroll', ScrollTrigger.update);

    const advance = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(advance);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(advance);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest tests/components/SmoothScrollProvider.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 6: Mount the provider in `src/app/layout.tsx`**

Replace the `<body>` element's contents:

```tsx
      <body>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
```

Add the import at the top of the file:

```tsx
import SmoothScrollProvider from '@/components/motion/SmoothScrollProvider';
```

- [ ] **Step 7: Verify and commit**

```bash
npm test
npm run lint
npm run build
git add -A
git commit -m "Add Lenis smooth scroll provider synced to ScrollTrigger"
```

---

### Task 5: Reveal and Parallax primitives

The two primitives every page depends on, both honoring reduced motion and leaving content visible if animation never runs.

**Files:**
- Create: `src/components/motion/Reveal.tsx`, `src/components/motion/Parallax.tsx`
- Test: `tests/components/Reveal.test.tsx`, `tests/components/Parallax.test.tsx`

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger`, `useGSAP` from `@/components/motion/gsap`; `DURATION`, `EASE` from `@/lib/motion`.
- Produces:
  - `<Reveal as?: 'div' | 'section' | 'li'; y?: number; delay?: number; stagger?: number; className?: string; children: ReactNode>` — animates its direct children in on scroll.
  - `<Parallax speed?: number; className?: string; children: ReactNode>` — scrubbed vertical offset.

- [ ] **Step 1: Write the failing tests**

`tests/components/Reveal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import Reveal from '@/components/motion/Reveal';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({
    matches,
    media: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
}

describe('Reveal', () => {
  it('renders children with animation enabled', () => {
    mockMatchMedia(false);
    render(
      <Reveal>
        <p>Signature dishes</p>
      </Reveal>,
    );
    expect(screen.getByText('Signature dishes')).toBeInTheDocument();
  });

  it('renders visible children under reduced motion', () => {
    mockMatchMedia(true);
    render(
      <Reveal>
        <p>Signature dishes</p>
      </Reveal>,
    );

    const text = screen.getByText('Signature dishes');
    expect(text).toBeInTheDocument();
    expect(text).toBeVisible();
  });

  it('never sets a static hidden style on the wrapper', () => {
    mockMatchMedia(true);
    const { container } = render(
      <Reveal>
        <p>Signature dishes</p>
      </Reveal>,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).not.toBe('0');
    expect(wrapper).toBeVisible();
  });

  it('renders the requested element type', () => {
    mockMatchMedia(false);
    const { container } = render(
      <Reveal as="section">
        <p>Signature dishes</p>
      </Reveal>,
    );
    expect(container.querySelector('section')).not.toBeNull();
  });
});
```

`tests/components/Parallax.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import Parallax from '@/components/motion/Parallax';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({
    matches,
    media: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
}

describe('Parallax', () => {
  it('renders children with animation enabled', () => {
    mockMatchMedia(false);
    render(
      <Parallax>
        <p>Hearth</p>
      </Parallax>,
    );
    expect(screen.getByText('Hearth')).toBeInTheDocument();
  });

  it('renders visible children under reduced motion', () => {
    mockMatchMedia(true);
    render(
      <Parallax>
        <p>Hearth</p>
      </Parallax>,
    );
    expect(screen.getByText('Hearth')).toBeVisible();
  });

  it('unmounts without throwing', () => {
    mockMatchMedia(false);
    const { unmount } = render(
      <Parallax>
        <p>Hearth</p>
      </Parallax>,
    );
    expect(() => unmount()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/components/Reveal.test.tsx tests/components/Parallax.test.tsx`
Expected: FAIL — cannot find the two modules.

- [ ] **Step 3: Write `src/components/motion/Reveal.tsx`**

```tsx
'use client';
import { ElementType, ReactNode, useRef } from 'react';
import { gsap, useGSAP } from './gsap';
import { DURATION, EASE, REDUCED_MOTION_QUERY } from '@/lib/motion';

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  y?: number;
  delay?: number;
  stagger?: number;
  className?: string;
}

export default function Reveal({
  children,
  as: Tag = 'div',
  y = 48,
  delay = 0,
  stagger = 0.08,
  className,
}: RevealProps) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const targets = gsap.utils.toArray<HTMLElement>(':scope > *', scope.current);
      if (targets.length === 0) return;

      const media = gsap.matchMedia();

      // Motion is opt-in per media query. Under reduced motion no tween is
      // created at all, so the elements keep the visible state the server
      // rendered — nothing to resolve, nothing that can strand them hidden.
      media.add(`(prefers-reduced-motion: no-preference)`, () => {
        gsap.set(targets, { opacity: 0, y });

        gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration: DURATION.base,
          ease: EASE.out,
          delay,
          stagger,
          scrollTrigger: {
            trigger: scope.current,
            start: 'top 85%',
            once: true,
          },
        });
      });

      media.add(REDUCED_MOTION_QUERY, () => {
        gsap.set(targets, { opacity: 1, y: 0, clearProps: 'transform' });
      });

      return () => media.revert();
    },
    { scope, dependencies: [y, delay, stagger] },
  );

  return (
    <Tag ref={scope} className={className}>
      {children}
    </Tag>
  );
}
```

- [ ] **Step 4: Write `src/components/motion/Parallax.tsx`**

```tsx
'use client';
import { ReactNode, useRef } from 'react';
import { gsap, useGSAP } from './gsap';
import { REDUCED_MOTION_QUERY } from '@/lib/motion';

interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export default function Parallax({ children, speed = 0.2, className }: ParallaxProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const target = scope.current?.firstElementChild;
      if (!target) return;

      const media = gsap.matchMedia();

      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(target, {
          yPercent: speed * 100,
          ease: 'none',
          scrollTrigger: {
            trigger: scope.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      media.add(REDUCED_MOTION_QUERY, () => {
        gsap.set(target, { yPercent: 0 });
      });

      return () => media.revert();
    },
    { scope, dependencies: [speed] },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest tests/components/Reveal.test.tsx tests/components/Parallax.test.tsx`
Expected: PASS, 7 tests.

- [ ] **Step 6: Verify and commit**

```bash
npm test
npm run lint
npm run build
git add -A
git commit -m "Add Reveal and Parallax motion primitives"
```

---

### Task 6: PinnedSequence and SplitHeading primitives

The two showpiece primitives: a pinned horizontal scrub and a masked headline reveal.

**Files:**
- Create: `src/components/motion/PinnedSequence.tsx`, `src/components/motion/SplitHeading.tsx`, `src/components/motion/PinnedSequence.module.css`, `src/components/motion/SplitHeading.module.css`
- Test: `tests/components/PinnedSequence.test.tsx`, `tests/components/SplitHeading.test.tsx`

**Interfaces:**
- Consumes: `gsap`, `useGSAP` from `@/components/motion/gsap`; `DURATION`, `EASE`, `REDUCED_MOTION_QUERY` from `@/lib/motion`.
- Produces:
  - `<PinnedSequence className?: string; children: ReactNode>` — pins its container and scrubs its track horizontally; below 900px it degrades to a normal horizontal scroll container with no pinning.
  - `<SplitHeading text: string; as?: 'h1' | 'h2'; className?: string; delay?: number>` — splits `text` on spaces and reveals each word from behind a mask.

- [ ] **Step 1: Write the failing tests**

`tests/components/PinnedSequence.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import PinnedSequence from '@/components/motion/PinnedSequence';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({
    matches,
    media: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
}

describe('PinnedSequence', () => {
  it('renders every panel', () => {
    mockMatchMedia(false);
    render(
      <PinnedSequence>
        <article>Panel one</article>
        <article>Panel two</article>
      </PinnedSequence>,
    );

    expect(screen.getByText('Panel one')).toBeInTheDocument();
    expect(screen.getByText('Panel two')).toBeInTheDocument();
  });

  it('keeps panels visible under reduced motion', () => {
    mockMatchMedia(true);
    render(
      <PinnedSequence>
        <article>Panel one</article>
      </PinnedSequence>,
    );
    expect(screen.getByText('Panel one')).toBeVisible();
  });

  it('unmounts without throwing', () => {
    mockMatchMedia(false);
    const { unmount } = render(
      <PinnedSequence>
        <article>Panel one</article>
      </PinnedSequence>,
    );
    expect(() => unmount()).not.toThrow();
  });
});
```

`tests/components/SplitHeading.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import SplitHeading from '@/components/motion/SplitHeading';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({
    matches,
    media: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
}

describe('SplitHeading', () => {
  it('renders the full text as an accessible heading', () => {
    mockMatchMedia(false);
    render(<SplitHeading text="Cooked over open flame" as="h1" />);

    expect(
      screen.getByRole('heading', { name: 'Cooked over open flame' }),
    ).toBeInTheDocument();
  });

  it('renders each word in its own element', () => {
    mockMatchMedia(false);
    const { container } = render(<SplitHeading text="Open flame" />);
    expect(container.querySelectorAll('[data-word]')).toHaveLength(2);
  });

  it('keeps the heading readable under reduced motion', () => {
    mockMatchMedia(true);
    render(<SplitHeading text="Open flame" />);
    expect(screen.getByRole('heading', { name: 'Open flame' })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/components/PinnedSequence.test.tsx tests/components/SplitHeading.test.tsx`
Expected: FAIL — cannot find the two modules.

- [ ] **Step 3: Write `src/components/motion/PinnedSequence.module.css`**

```css
.viewport {
  position: relative;
  overflow: hidden;
}

.track {
  display: flex;
  gap: var(--space-6);
  align-items: stretch;
  padding: 0 var(--space-6);
}

@media (max-width: 899px) {
  .viewport {
    overflow-x: auto;
    scrollbar-width: none;
  }

  .viewport::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 4: Write `src/components/motion/PinnedSequence.tsx`**

```tsx
'use client';
import { ReactNode, useRef } from 'react';
import { gsap, useGSAP } from './gsap';
import styles from './PinnedSequence.module.css';

interface PinnedSequenceProps {
  children: ReactNode;
  className?: string;
}

export default function PinnedSequence({ children, className }: PinnedSequenceProps) {
  const scope = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      // Pinning is desktop-only: on a narrow screen a pinned horizontal
      // scrub hijacks the one gesture a touch user needs, so below 900px
      // the track stays an ordinary horizontally scrollable strip.
      media.add(
        '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
        () => {
          const el = track.current;
          if (!el) return;

          const distance = el.scrollWidth - el.clientWidth;
          if (distance <= 0) return;

          gsap.to(el, {
            x: -distance,
            ease: 'none',
            scrollTrigger: {
              trigger: scope.current,
              start: 'top top',
              end: () => `+=${distance}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        },
      );

      return () => media.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className={[styles.viewport, className].filter(Boolean).join(' ')}>
      <div ref={track} className={styles.track}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write `src/components/motion/SplitHeading.module.css`**

```css
.heading {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.28em;
}

.mask {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
}

.word {
  display: inline-block;
  will-change: transform;
}
```

- [ ] **Step 6: Write `src/components/motion/SplitHeading.tsx`**

```tsx
'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from './gsap';
import { DURATION, EASE, REDUCED_MOTION_QUERY } from '@/lib/motion';
import styles from './SplitHeading.module.css';

interface SplitHeadingProps {
  text: string;
  as?: 'h1' | 'h2';
  className?: string;
  delay?: number;
}

export default function SplitHeading({
  text,
  as: Tag = 'h2',
  className,
  delay = 0,
}: SplitHeadingProps) {
  const scope = useRef<HTMLHeadingElement>(null);
  const words = text.split(' ');

  useGSAP(
    () => {
      const targets = gsap.utils.toArray<HTMLElement>('[data-word]', scope.current);
      if (targets.length === 0) return;

      const media = gsap.matchMedia();

      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(targets, { yPercent: 120 });

        gsap.to(targets, {
          yPercent: 0,
          duration: DURATION.slow,
          ease: EASE.out,
          delay,
          stagger: 0.07,
          scrollTrigger: {
            trigger: scope.current,
            start: 'top 90%',
            once: true,
          },
        });
      });

      media.add(REDUCED_MOTION_QUERY, () => {
        gsap.set(targets, { yPercent: 0 });
      });

      return () => media.revert();
    },
    { scope, dependencies: [text, delay] },
  );

  return (
    <Tag ref={scope} className={[styles.heading, className].filter(Boolean).join(' ')}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className={styles.mask}>
          <span className={styles.word} data-word>
            {word}
          </span>
        </span>
      ))}
    </Tag>
  );
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx jest tests/components/PinnedSequence.test.tsx tests/components/SplitHeading.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 8: Verify and commit**

```bash
npm test
npm run lint
npm run build
git add -A
git commit -m "Add PinnedSequence and SplitHeading motion primitives"
```

---

### Task 7: Header and footer shell

The persistent chrome: a header that inverts once the page scrolls, and a footer carrying hours and contact details.

**Files:**
- Create: `src/components/layout/Header.tsx`, `src/components/layout/Header.module.css`, `src/components/layout/Footer.tsx`, `src/components/layout/Footer.module.css`
- Modify: `src/app/layout.tsx`
- Test: `tests/components/Header.test.tsx`

**Interfaces:**
- Consumes: `venue` from `@/content/venue`.
- Produces: `<Header />` and `<Footer />`, both mounted in the root layout. Header nav links: `/menu`, `/about`, `/gallery`, `/contact`, plus a "Reserve" call to action pointing at `/contact`.

- [ ] **Step 1: Write the failing test**

`tests/components/Header.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/layout/Header';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Header', () => {
  it('renders the venue name and primary navigation', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: 'Cinder & Salt' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Menu' })).toHaveAttribute('href', '/menu');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Gallery' })).toHaveAttribute('href', '/gallery');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
  });

  it('points the reserve call to action at contact until booking exists', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Reserve' })).toHaveAttribute('href', '/contact');
  });

  it('marks itself scrolled once the page moves', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header') as HTMLElement;

    expect(header.dataset.scrolled).toBe('false');

    window.scrollY = 200;
    fireEvent.scroll(window);

    expect(header.dataset.scrolled).toBe('true');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/components/Header.test.tsx`
Expected: FAIL — cannot find module `@/components/layout/Header`.

- [ ] **Step 3: Write `src/components/layout/Header.module.css`**

```css
.header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  height: var(--header-height);
  display: flex;
  align-items: center;
  transition: background-color 400ms ease, height 400ms ease, border-color 400ms ease;
  border-bottom: 1px solid transparent;
}

.header[data-scrolled='true'] {
  height: 64px;
  background: var(--surface-veil);
  backdrop-filter: blur(12px);
  border-bottom-color: var(--border);
}

.inner {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
}

.brand {
  font-family: var(--font-display), Georgia, serif;
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.nav {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.link {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-muted);
  transition: color 200ms ease;
}

.link:hover,
.link[data-active='true'] {
  color: var(--ink);
}

.reserve {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-inverse);
  background: var(--accent);
  padding: var(--space-3) var(--space-5);
  transition: background-color 200ms ease;
}

.reserve:hover {
  background: var(--accent-strong);
}

@media (max-width: 820px) {
  .nav {
    gap: var(--space-4);
  }

  .link {
    display: none;
  }
}
```

- [ ] **Step 4: Write `src/components/layout/Header.tsx`**

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { venue } from '@/content/venue';
import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '/menu', label: 'Menu' },
  { href: '/about', label: 'About' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={styles.header} data-scrolled={scrolled}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          {venue.name}
        </Link>

        <nav className={styles.nav}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.link}
              data-active={pathname === link.href}
              transitionTypes={['nav-forward']}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className={styles.reserve} transitionTypes={['nav-forward']}>
            Reserve
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest tests/components/Header.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 6: Write `src/components/layout/Footer.module.css`**

```css
.footer {
  border-top: 1px solid var(--border);
  background: var(--surface-raised);
  padding: var(--space-12) var(--space-6) var(--space-8);
}

.inner {
  max-width: var(--content-max);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-8);
}

.heading {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-subtle);
  margin-bottom: var(--space-4);
}

.line {
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.hours {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  padding: var(--space-1) 0;
}

.colophon {
  max-width: var(--content-max);
  margin: var(--space-10) auto 0;
  padding-top: var(--space-5);
  border-top: 1px solid var(--border);
  font-size: var(--text-xs);
  color: var(--ink-subtle);
}
```

- [ ] **Step 7: Write `src/components/layout/Footer.tsx`**

```tsx
import { venue } from '@/content/venue';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <p className={styles.heading}>Find us</p>
          {venue.address.map((line) => (
            <p key={line} className={styles.line}>
              {line}
            </p>
          ))}
        </div>

        <div>
          <p className={styles.heading}>Hours</p>
          {venue.hours.map((entry) => (
            <div key={entry.days} className={styles.hours}>
              <span>{entry.days}</span>
              <span>{entry.time}</span>
            </div>
          ))}
        </div>

        <div>
          <p className={styles.heading}>Reach us</p>
          <p className={styles.line}>{venue.phone}</p>
          <p className={styles.line}>{venue.email}</p>
        </div>
      </div>

      <p className={styles.colophon}>
        © {new Date().getFullYear()} {venue.name}. {venue.tagline}
      </p>
    </footer>
  );
}
```

- [ ] **Step 8: Mount both in `src/app/layout.tsx`**

Replace the `<body>` contents:

```tsx
      <body>
        <SmoothScrollProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </SmoothScrollProvider>
      </body>
```

Add the imports:

```tsx
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
```

- [ ] **Step 9: Verify and commit**

```bash
npm test
npm run lint
npm run build
git add -A
git commit -m "Add header with scroll state and site footer"
```

---

### Task 8: Home page

The cinematic entry: parallax hero, philosophy statement, pinned signature-dish sequence, atmosphere strip, and reservation call to action.

**Files:**
- Create: `src/components/home/Hero.tsx`, `src/components/home/Hero.module.css`, `src/components/home/DishShowcase.tsx`, `src/components/home/DishShowcase.module.css`, `src/components/home/Statement.tsx`, `src/components/home/Statement.module.css`
- Modify: `src/app/page.tsx`
- Test: `tests/components/DishShowcase.test.tsx`

**Interfaces:**
- Consumes: `Reveal`, `Parallax`, `PinnedSequence`, `SplitHeading`; `dishes` from `@/content/dishes`; `signatureDishes` from `@/lib/menu`; `venue`.
- Produces: `<Hero />`, `<Statement />`, `<DishShowcase dishes: Dish[] />`, and the `/` route.

- [ ] **Step 1: Write the failing test**

`tests/components/DishShowcase.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import DishShowcase from '@/components/home/DishShowcase';
import { Dish } from '@/types';

jest.mock('@/components/motion/PinnedSequence', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const dishes: Dish[] = [
  {
    id: 'ribeye',
    name: 'Forty-Day Ribeye',
    description: 'Dry-aged, grilled over binchotan.',
    course: 'mains',
    price: 2480,
    image: 'https://images.unsplash.com/photo-1',
    signature: true,
  },
  {
    id: 'oyster',
    name: 'Salt-Cured Oyster',
    description: 'Cured over live coals.',
    course: 'starters',
    price: 680,
    image: 'https://images.unsplash.com/photo-2',
    signature: true,
  },
];

describe('DishShowcase', () => {
  it('renders a panel per dish with name and description', () => {
    render(<DishShowcase dishes={dishes} />);

    expect(screen.getByText('Forty-Day Ribeye')).toBeInTheDocument();
    expect(screen.getByText('Dry-aged, grilled over binchotan.')).toBeInTheDocument();
    expect(screen.getByText('Salt-Cured Oyster')).toBeInTheDocument();
  });

  it('gives every dish image descriptive alt text', () => {
    render(<DishShowcase dishes={dishes} />);
    expect(screen.getByAltText('Forty-Day Ribeye')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/components/DishShowcase.test.tsx`
Expected: FAIL — cannot find module `@/components/home/DishShowcase`.

- [ ] **Step 3: Write `src/components/home/Hero.module.css`**

```css
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.media {
  position: absolute;
  inset: -12% 0;
}

.image {
  object-fit: cover;
}

.scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(13, 12, 11, 0.55) 0%,
    rgba(13, 12, 11, 0.2) 45%,
    rgba(13, 12, 11, 0.95) 100%
  );
}

.content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 var(--space-6) var(--space-12);
}

.eyebrow {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: var(--space-5);
}

.title {
  font-size: var(--text-3xl);
  max-width: 16ch;
}

.tagline {
  margin-top: var(--space-5);
  max-width: 46ch;
  color: var(--ink-muted);
  font-size: var(--text-lg);
}

@media (min-width: 1100px) {
  .title {
    font-size: var(--text-4xl);
  }
}
```

- [ ] **Step 4: Write `src/components/home/Hero.tsx`**

```tsx
import Image from 'next/image';
import Parallax from '@/components/motion/Parallax';
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import { venue } from '@/content/venue';
import styles from './Hero.module.css';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=2000&q=80&auto=format&fit=crop';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <Parallax className={styles.media} speed={0.18}>
        <Image
          className={styles.image}
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </Parallax>
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.content}>
        <Reveal>
          <p className={styles.eyebrow}>Scorchlit · Downtown</p>
        </Reveal>
        <SplitHeading as="h1" text="Cooked over open flame" className={styles.title} />
        <Reveal delay={0.3}>
          <p className={styles.tagline}>{venue.tagline}</p>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Write `src/components/home/Statement.module.css`**

```css
.statement {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
  text-align: center;
}

.body {
  font-family: var(--font-display), Georgia, serif;
  font-size: var(--text-xl);
  line-height: 1.5;
  color: var(--ink);
}

.rule {
  width: 64px;
  height: 1px;
  background: var(--accent);
  margin: var(--space-8) auto 0;
}
```

- [ ] **Step 6: Write `src/components/home/Statement.tsx`**

```tsx
import Reveal from '@/components/motion/Reveal';
import styles from './Statement.module.css';

export default function Statement() {
  return (
    <section className={styles.statement}>
      <Reveal>
        <p className={styles.body}>
          One menu, written each morning around what the farms and the day boats send.
          Cooked entirely over wood and coal, and finished by hand at the pass a few
          steps from your table.
        </p>
        <div className={styles.rule} />
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 7: Write `src/components/home/DishShowcase.module.css`**

```css
.section {
  padding: var(--space-10) 0 var(--space-16);
}

.header {
  max-width: var(--content-max);
  margin: 0 auto var(--space-8);
  padding: 0 var(--space-6);
}

.eyebrow {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent);
}

.panel {
  flex: 0 0 min(78vw, 460px);
  display: flex;
  flex-direction: column;
}

.frame {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: var(--surface-raised);
}

.image {
  object-fit: cover;
}

.name {
  margin-top: var(--space-5);
  font-family: var(--font-display), Georgia, serif;
  font-size: var(--text-xl);
}

.description {
  margin-top: var(--space-2);
  color: var(--ink-muted);
  font-size: var(--text-sm);
  max-width: 38ch;
}
```

- [ ] **Step 8: Write `src/components/home/DishShowcase.tsx`**

```tsx
import Image from 'next/image';
import PinnedSequence from '@/components/motion/PinnedSequence';
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import { Dish } from '@/types';
import styles from './DishShowcase.module.css';

interface DishShowcaseProps {
  dishes: Dish[];
}

export default function DishShowcase({ dishes }: DishShowcaseProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <Reveal>
          <p className={styles.eyebrow}>Signatures</p>
        </Reveal>
        <SplitHeading text="Plates the room is known for" />
      </div>

      <PinnedSequence>
        {dishes.map((dish) => (
          <article key={dish.id} className={styles.panel}>
            <div className={styles.frame}>
              <Image
                className={styles.image}
                src={dish.image}
                alt={dish.name}
                fill
                sizes="(max-width: 900px) 78vw, 460px"
              />
            </div>
            <h3 className={styles.name}>{dish.name}</h3>
            <p className={styles.description}>{dish.description}</p>
          </article>
        ))}
      </PinnedSequence>
    </section>
  );
}
```

- [ ] **Step 9: Write `src/app/page.tsx`**

```tsx
import Hero from '@/components/home/Hero';
import Statement from '@/components/home/Statement';
import DishShowcase from '@/components/home/DishShowcase';
import { dishes } from '@/content/dishes';
import { signatureDishes } from '@/lib/menu';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Statement />
      <DishShowcase dishes={signatureDishes(dishes, 4)} />
    </>
  );
}
```

- [ ] **Step 10: Run the tests and verify**

```bash
npx jest tests/components/DishShowcase.test.tsx
npm run lint
npm run build
```

Expected: 2 tests pass; lint and build succeed.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Add home page with parallax hero and pinned dish showcase"
```

---

### Task 9: Menu page

The full menu grouped by course, with a sticky course navigation that tracks the active section.

**Files:**
- Create: `src/app/menu/page.tsx`, `src/app/menu/menu.module.css`, `src/components/menu/CourseNav.tsx`, `src/components/menu/CourseNav.module.css`
- Test: `tests/components/CourseNav.test.tsx`

**Interfaces:**
- Consumes: `groupByCourse`, `COURSE_LABELS` from `@/lib/menu`; `dishes`; `Reveal`, `SplitHeading`.
- Produces: `<CourseNav groups: { course: Course; label: string }[] />` and the `/menu` route. Each course section carries `id={course}` so the nav can anchor to it.

- [ ] **Step 1: Write the failing test**

`tests/components/CourseNav.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import CourseNav from '@/components/menu/CourseNav';

const groups = [
  { course: 'starters' as const, label: 'To Begin' },
  { course: 'mains' as const, label: 'The Table' },
];

describe('CourseNav', () => {
  it('renders an anchor per course', () => {
    render(<CourseNav groups={groups} />);

    expect(screen.getByRole('link', { name: 'To Begin' })).toHaveAttribute('href', '#starters');
    expect(screen.getByRole('link', { name: 'The Table' })).toHaveAttribute('href', '#mains');
  });

  it('labels the navigation for assistive technology', () => {
    render(<CourseNav groups={groups} />);
    expect(screen.getByRole('navigation', { name: 'Menu courses' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/components/CourseNav.test.tsx`
Expected: FAIL — cannot find module `@/components/menu/CourseNav`.

- [ ] **Step 3: Write `src/components/menu/CourseNav.module.css`**

```css
.nav {
  position: sticky;
  top: calc(var(--header-height) + var(--space-4));
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.link {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-subtle);
  transition: color 200ms ease;
}

.link:hover,
.link[data-active='true'] {
  color: var(--accent);
}

@media (max-width: 899px) {
  .nav {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-4);
    margin-bottom: var(--space-8);
  }
}
```

- [ ] **Step 4: Write `src/components/menu/CourseNav.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Course } from '@/types';
import styles from './CourseNav.module.css';

interface CourseNavProps {
  groups: { course: Course; label: string }[];
}

export default function CourseNav({ groups }: CourseNavProps) {
  const [active, setActive] = useState<Course | null>(null);

  useEffect(() => {
    const sections = groups
      .map((group) => document.getElementById(group.course))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.id as Course);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [groups]);

  return (
    <nav className={styles.nav} aria-label="Menu courses">
      {groups.map((group) => (
        <a
          key={group.course}
          href={`#${group.course}`}
          className={styles.link}
          data-active={active === group.course}
        >
          {group.label}
        </a>
      ))}
    </nav>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest tests/components/CourseNav.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 6: Write `src/app/menu/menu.module.css`**

```css
.page {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: calc(var(--header-height) + var(--space-12)) var(--space-6) var(--space-16);
}

.title {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-4);
}

.intro {
  color: var(--ink-muted);
  max-width: 52ch;
  margin-bottom: var(--space-12);
}

.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--space-10);
  align-items: start;
}

.course {
  margin-bottom: var(--space-12);
  scroll-margin-top: calc(var(--header-height) + var(--space-6));
}

.courseTitle {
  font-size: var(--text-2xl);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-6);
}

.dish {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-4);
  padding: var(--space-5) 0;
  border-bottom: 1px solid var(--border);
}

.dishName {
  font-family: var(--font-display), Georgia, serif;
  font-size: var(--text-lg);
}

.dishDescription {
  margin-top: var(--space-2);
  color: var(--ink-muted);
  font-size: var(--text-sm);
  max-width: 54ch;
}

.price {
  font-size: var(--text-sm);
  color: var(--accent);
  white-space: nowrap;
}

@media (max-width: 899px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Write `src/app/menu/page.tsx`**

```tsx
import { Metadata } from 'next';
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import CourseNav from '@/components/menu/CourseNav';
import { dishes } from '@/content/dishes';
import { groupByCourse } from '@/lib/menu';
import styles from './menu.module.css';

export const metadata: Metadata = {
  title: 'Menu',
  description:
    'One seasonal menu cooked over open flame — starters, mains, desserts, and the cellar.',
};

export default function MenuPage() {
  const groups = groupByCourse(dishes);

  return (
    <div className={styles.page}>
      <SplitHeading as="h1" text="The Menu" className={styles.title} />
      <Reveal>
        <p className={styles.intro}>
          Written each morning around what arrives. Prices are in Philippine pesos and
          include service.
        </p>
      </Reveal>

      <div className={styles.layout}>
        <CourseNav groups={groups.map(({ course, label }) => ({ course, label }))} />

        <div>
          {groups.map((group) => (
            <section key={group.course} id={group.course} className={styles.course}>
              <h2 className={styles.courseTitle}>{group.label}</h2>
              <Reveal stagger={0.06}>
                {group.dishes.map((dish) => (
                  <div key={dish.id} className={styles.dish}>
                    <div>
                      <h3 className={styles.dishName}>{dish.name}</h3>
                      <p className={styles.dishDescription}>{dish.description}</p>
                    </div>
                    <span className={styles.price}>₱{dish.price.toLocaleString('en-PH')}</span>
                  </div>
                ))}
              </Reveal>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Verify and commit**

```bash
npm test
npm run lint
npm run build
git add -A
git commit -m "Add menu page with sticky course navigation"
```

Expected: build reports the `/menu` route.

---

### Task 10: About page

Chef biography, philosophy, and a provenance timeline with alternating parallax imagery.

**Files:**
- Create: `src/app/about/page.tsx`, `src/app/about/about.module.css`
- Test: `tests/app/about.test.tsx`

**Interfaces:**
- Consumes: `chef` from `@/content/chef`; `Reveal`, `Parallax`, `SplitHeading`.
- Produces: the `/about` route.

- [ ] **Step 1: Write the failing test**

`tests/app/about.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import AboutPage from '@/app/about/page';
import { chef } from '@/content/chef';

describe('AboutPage', () => {
  it('renders the chef name and role', () => {
    render(<AboutPage />);

    expect(screen.getByText(chef.name)).toBeInTheDocument();
    expect(screen.getByText(chef.role)).toBeInTheDocument();
  });

  it('renders every timeline entry', () => {
    render(<AboutPage />);

    chef.timeline.forEach((entry) => {
      expect(screen.getByText(entry.title)).toBeInTheDocument();
      expect(screen.getByText(entry.year)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/app/about.test.tsx`
Expected: FAIL — cannot find module `@/app/about/page`.

- [ ] **Step 3: Write `src/app/about/about.module.css`**

```css
.page {
  padding-top: calc(var(--header-height) + var(--space-12));
}

.intro {
  max-width: var(--content-max);
  margin: 0 auto var(--space-16);
  padding: 0 var(--space-6);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-10);
  align-items: center;
}

.title {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-6);
}

.paragraph {
  color: var(--ink-muted);
  margin-bottom: var(--space-5);
  max-width: 52ch;
}

.portraitFrame {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: var(--surface-raised);
}

.portrait {
  object-fit: cover;
}

.name {
  margin-top: var(--space-5);
  font-family: var(--font-display), Georgia, serif;
  font-size: var(--text-lg);
}

.role {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent);
}

.timeline {
  max-width: 820px;
  margin: 0 auto;
  padding: 0 var(--space-6) var(--space-16);
}

.entry {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: var(--space-6);
  padding: var(--space-8) 0;
  border-top: 1px solid var(--border);
}

.year {
  font-family: var(--font-display), Georgia, serif;
  font-size: var(--text-lg);
  color: var(--accent);
}

.entryTitle {
  font-size: var(--text-lg);
  margin-bottom: var(--space-2);
}

.entryBody {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}

@media (max-width: 899px) {
  .intro {
    grid-template-columns: 1fr;
  }

  .entry {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }
}
```

- [ ] **Step 4: Write `src/app/about/page.tsx`**

```tsx
import { Metadata } from 'next';
import Image from 'next/image';
import Parallax from '@/components/motion/Parallax';
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import { chef } from '@/content/chef';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About',
  description:
    'How a borrowed grill behind a shuttered bakery became a twenty-two seat room built around one hearth.',
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <section className={styles.intro}>
        <div>
          <SplitHeading as="h1" text="A room built around one fire" className={styles.title} />
          <Reveal>
            {chef.philosophy.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
          </Reveal>
        </div>

        <div>
          <Parallax speed={0.12}>
            <div className={styles.portraitFrame}>
              <Image
                className={styles.portrait}
                src={chef.portrait}
                alt={`${chef.name}, ${chef.role}`}
                fill
                sizes="(max-width: 899px) 100vw, 560px"
              />
            </div>
          </Parallax>
          <Reveal>
            <p className={styles.name}>{chef.name}</p>
            <p className={styles.role}>{chef.role}</p>
          </Reveal>
        </div>
      </section>

      <section className={styles.timeline}>
        {chef.timeline.map((entry) => (
          <Reveal key={entry.year}>
            <div className={styles.entry}>
              <span className={styles.year}>{entry.year}</span>
              <div>
                <h2 className={styles.entryTitle}>{entry.title}</h2>
                <p className={styles.entryBody}>{entry.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest tests/app/about.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 6: Verify and commit**

```bash
npm test
npm run lint
npm run build
git add -A
git commit -m "Add about page with chef story and provenance timeline"
```

---

### Task 11: Gallery page with shared-element lightbox

A staggered photography grid where selecting an image morphs it into a full-screen view using a shared-element view transition.

**Files:**
- Create: `src/app/gallery/page.tsx`, `src/app/gallery/gallery.module.css`, `src/components/gallery/GalleryGrid.tsx`, `src/components/gallery/GalleryGrid.module.css`
- Modify: `src/styles/globals.css`
- Test: `tests/components/GalleryGrid.test.tsx`

**Interfaces:**
- Consumes: `galleryImages` from `@/content/gallery`; `Reveal`, `SplitHeading`.
- Produces: `<GalleryGrid images: GalleryImage[] />` — a client component owning lightbox open/close state — and the `/gallery` route.

- [ ] **Step 1: Write the failing test**

`tests/components/GalleryGrid.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import { GalleryImage } from '@/types';

const images: GalleryImage[] = [
  {
    id: 'hearth',
    src: 'https://images.unsplash.com/photo-1',
    alt: 'The dining room at dusk',
    width: 1600,
    height: 1067,
  },
  {
    id: 'pass',
    src: 'https://images.unsplash.com/photo-2',
    alt: 'Plates at the pass',
    width: 1600,
    height: 1067,
  },
];

describe('GalleryGrid', () => {
  it('renders a button per image with its alt text', () => {
    render(<GalleryGrid images={images} />);

    expect(screen.getByRole('button', { name: /dining room at dusk/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /plates at the pass/i })).toBeInTheDocument();
  });

  it('opens a dialog showing the selected image', () => {
    render(<GalleryGrid images={images} />);

    fireEvent.click(screen.getByRole('button', { name: /dining room at dusk/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByAltText('The dining room at dusk')).toBeInTheDocument();
  });

  it('closes the dialog on Escape', () => {
    render(<GalleryGrid images={images} />);

    fireEvent.click(screen.getByRole('button', { name: /dining room at dusk/i }));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the dialog with the close control', () => {
    render(<GalleryGrid images={images} />);

    fireEvent.click(screen.getByRole('button', { name: /plates at the pass/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Close image' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/components/GalleryGrid.test.tsx`
Expected: FAIL — cannot find module `@/components/gallery/GalleryGrid`.

- [ ] **Step 3: Write `src/components/gallery/GalleryGrid.module.css`**

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
}

.tile {
  position: relative;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  border: none;
  padding: 0;
  background: var(--surface-raised);
  cursor: pointer;
}

.tileImage {
  object-fit: cover;
  transition: transform 700ms ease;
}

.tile:hover .tileImage {
  transform: scale(1.04);
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: rgba(8, 7, 6, 0.92);
}

.figure {
  position: relative;
  width: min(1200px, 100%);
  aspect-ratio: 3 / 2;
}

.full {
  object-fit: contain;
}

.caption {
  margin-top: var(--space-4);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.close {
  position: absolute;
  top: var(--space-6);
  right: var(--space-6);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--ink);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
}
```

- [ ] **Step 4: Write `src/components/gallery/GalleryGrid.tsx`**

```tsx
'use client';
import { useEffect, useState, ViewTransition } from 'react';
import Image from 'next/image';
import { GalleryImage } from '@/types';
import styles from './GalleryGrid.module.css';

interface GalleryGridProps {
  images: GalleryImage[];
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = images.find((image) => image.id === openId) ?? null;

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenId(null);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <div className={styles.grid}>
        {images.map((image) => (
          <button
            key={image.id}
            type="button"
            className={styles.tile}
            aria-label={`View ${image.alt}`}
            onClick={() => setOpenId(image.id)}
          >
            <ViewTransition name={`gallery-${image.id}`} share="morph" default="none">
              <Image
                className={styles.tileImage}
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 700px) 100vw, 33vw"
              />
            </ViewTransition>
          </button>
        ))}
      </div>

      {open && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={open.alt}
          onClick={() => setOpenId(null)}
        >
          <button
            type="button"
            className={styles.close}
            aria-label="Close image"
            onClick={() => setOpenId(null)}
          >
            Close
          </button>

          <div onClick={(event) => event.stopPropagation()}>
            <ViewTransition name={`gallery-${open.id}`} share="morph" default="none">
              <figure className={styles.figure}>
                <Image
                  className={styles.full}
                  src={open.src}
                  alt={open.alt}
                  fill
                  sizes="100vw"
                />
              </figure>
            </ViewTransition>
            <figcaption className={styles.caption}>{open.alt}</figcaption>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest tests/components/GalleryGrid.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 6: Add the morph timing to `src/styles/globals.css`**

Append:

```css
::view-transition-group(.morph) {
  animation-duration: 420ms;
}

::view-transition-image-pair(.morph) {
  animation-name: morph-blur;
}

@keyframes morph-blur {
  30% {
    filter: blur(3px);
  }
}
```

- [ ] **Step 7: Write `src/app/gallery/gallery.module.css`**

```css
.page {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: calc(var(--header-height) + var(--space-12)) var(--space-6) var(--space-16);
}

.title {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-4);
}

.intro {
  color: var(--ink-muted);
  max-width: 52ch;
  margin-bottom: var(--space-10);
}
```

- [ ] **Step 8: Write `src/app/gallery/page.tsx`**

```tsx
import { Metadata } from 'next';
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import { galleryImages } from '@/content/gallery';
import styles from './gallery.module.css';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'The room, the hearth, and the plates that leave it.',
};

export default function GalleryPage() {
  return (
    <div className={styles.page}>
      <SplitHeading as="h1" text="The Room" className={styles.title} />
      <Reveal>
        <p className={styles.intro}>
          Photographs from service — the hearth at its hottest, and the room once it
          settles.
        </p>
      </Reveal>

      <GalleryGrid images={galleryImages} />
    </div>
  );
}
```

- [ ] **Step 9: Verify and commit**

```bash
npm test
npm run lint
npm run build
git add -A
git commit -m "Add gallery page with shared-element lightbox"
```

---

### Task 12: Contact page

Hours, address, and an enquiry form with inline validation and a mock submit.

**Files:**
- Create: `src/app/contact/page.tsx`, `src/app/contact/contact.module.css`, `src/components/contact/EnquiryForm.tsx`, `src/components/contact/EnquiryForm.module.css`, `src/lib/enquiry.ts`
- Test: `tests/lib/enquiry.test.ts`, `tests/components/EnquiryForm.test.tsx`

**Interfaces:**
- Consumes: `venue`; `Reveal`, `SplitHeading`.
- Produces:
  - `interface EnquiryValues { name: string; email: string; date: string; guests: string; message: string }`
  - `validateEnquiry(values: EnquiryValues): Partial<Record<keyof EnquiryValues, string>>`
  - `<EnquiryForm />` and the `/contact` route.

- [ ] **Step 1: Write the failing validation test**

`tests/lib/enquiry.test.ts`:

```ts
import { EnquiryValues, validateEnquiry } from '@/lib/enquiry';

const valid: EnquiryValues = {
  name: 'Alex Rivera',
  email: 'mira@example.com',
  date: '2026-10-02',
  guests: '4',
  message: 'A birthday dinner for four.',
};

describe('validateEnquiry', () => {
  it('accepts a complete enquiry', () => {
    expect(validateEnquiry(valid)).toEqual({});
  });

  it('requires a name', () => {
    expect(validateEnquiry({ ...valid, name: '  ' }).name).toBe('Please tell us your name');
  });

  it('rejects a malformed email', () => {
    expect(validateEnquiry({ ...valid, email: 'mira@' }).email).toBe(
      'Enter a valid email address',
    );
  });

  it('requires a date', () => {
    expect(validateEnquiry({ ...valid, date: '' }).date).toBe('Choose a date');
  });

  it('requires at least one guest', () => {
    expect(validateEnquiry({ ...valid, guests: '0' }).guests).toBe('Enter 1 or more guests');
  });

  it('rejects a party larger than twelve', () => {
    expect(validateEnquiry({ ...valid, guests: '13' }).guests).toBe(
      'For parties over 12, please call us',
    );
  });

  it('requires a message', () => {
    expect(validateEnquiry({ ...valid, message: '' }).message).toBe('Add a short note');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/lib/enquiry.test.ts`
Expected: FAIL — cannot find module `@/lib/enquiry`.

- [ ] **Step 3: Write `src/lib/enquiry.ts`**

```ts
export interface EnquiryValues {
  name: string;
  email: string;
  date: string;
  guests: string;
  message: string;
}

export type EnquiryErrors = Partial<Record<keyof EnquiryValues, string>>;

export const EMPTY_ENQUIRY: EnquiryValues = {
  name: '',
  email: '',
  date: '',
  guests: '2',
  message: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEnquiry(values: EnquiryValues): EnquiryErrors {
  const errors: EnquiryErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Please tell us your name';
  }

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  if (!values.date) {
    errors.date = 'Choose a date';
  }

  const guests = Number(values.guests);
  if (!Number.isFinite(guests) || guests < 1) {
    errors.guests = 'Enter 1 or more guests';
  } else if (guests > 12) {
    errors.guests = 'For parties over 12, please call us';
  }

  if (!values.message.trim()) {
    errors.message = 'Add a short note';
  }

  return errors;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest tests/lib/enquiry.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Write the failing form test**

`tests/components/EnquiryForm.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import EnquiryForm from '@/components/contact/EnquiryForm';

describe('EnquiryForm', () => {
  it('shows validation errors when submitted empty', () => {
    render(<EnquiryForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(screen.getByText('Please tell us your name')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('confirms the enquiry once every field is valid', () => {
    render(<EnquiryForm />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Mira' } });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mira@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Preferred date'), {
      target: { value: '2026-10-02' },
    });
    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Birthday dinner' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Thank you — we will reply within one working day.',
    );
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx jest tests/components/EnquiryForm.test.tsx`
Expected: FAIL — cannot find module `@/components/contact/EnquiryForm`.

- [ ] **Step 7: Write `src/components/contact/EnquiryForm.module.css`**

```css
.form {
  display: grid;
  gap: var(--space-5);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
}

.field {
  display: grid;
  gap: var(--space-2);
}

.label {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-subtle);
}

.input,
.textarea {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  color: var(--ink);
  font-family: inherit;
  font-size: var(--text-base);
  padding: var(--space-3) 0;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-bottom-color: var(--accent);
}

.textarea {
  resize: vertical;
  min-height: 120px;
}

.error {
  font-size: var(--text-xs);
  color: #e07a6a;
}

.submit {
  justify-self: start;
  border: none;
  background: var(--accent);
  color: var(--ink-inverse);
  font-family: inherit;
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: var(--space-4) var(--space-8);
  cursor: pointer;
  transition: background-color 200ms ease;
}

.submit:hover {
  background: var(--accent-strong);
}

.status {
  font-size: var(--text-sm);
  color: var(--accent);
}

@media (max-width: 720px) {
  .row {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 8: Write `src/components/contact/EnquiryForm.tsx`**

```tsx
'use client';
import { FormEvent, useState } from 'react';
import {
  EMPTY_ENQUIRY,
  EnquiryErrors,
  EnquiryValues,
  validateEnquiry,
} from '@/lib/enquiry';
import styles from './EnquiryForm.module.css';

export default function EnquiryForm() {
  const [values, setValues] = useState<EnquiryValues>(EMPTY_ENQUIRY);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [sent, setSent] = useState(false);

  const setField = (field: keyof EnquiryValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setSent(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateEnquiry(values);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      setSent(false);
      return;
    }

    // No backend in this phase: the enquiry is acknowledged locally so the
    // flow is complete and testable. Phase 2 replaces this with a real
    // booking request.
    setSent(true);
    setValues(EMPTY_ENQUIRY);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className={styles.input}
            value={values.name}
            onChange={(event) => setField('name', event.target.value)}
          />
          {errors.name && <p className={styles.error}>{errors.name}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={values.email}
            onChange={(event) => setField('email', event.target.value)}
          />
          {errors.email && <p className={styles.error}>{errors.email}</p>}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="date">
            Preferred date
          </label>
          <input
            id="date"
            type="date"
            className={styles.input}
            value={values.date}
            onChange={(event) => setField('date', event.target.value)}
          />
          {errors.date && <p className={styles.error}>{errors.date}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="guests">
            Guests
          </label>
          <input
            id="guests"
            type="number"
            min={1}
            max={12}
            className={styles.input}
            value={values.guests}
            onChange={(event) => setField('guests', event.target.value)}
          />
          {errors.guests && <p className={styles.error}>{errors.guests}</p>}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          className={styles.textarea}
          value={values.message}
          onChange={(event) => setField('message', event.target.value)}
        />
        {errors.message && <p className={styles.error}>{errors.message}</p>}
      </div>

      <button type="submit" className={styles.submit}>
        Send enquiry
      </button>

      {sent && (
        <p className={styles.status} role="status">
          Thank you — we will reply within one working day.
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `npx jest tests/components/EnquiryForm.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 10: Write `src/app/contact/contact.module.css`**

```css
.page {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: calc(var(--header-height) + var(--space-12)) var(--space-6) var(--space-16);
}

.title {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-10);
}

.layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: var(--space-12);
  align-items: start;
}

.heading {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-subtle);
  margin-bottom: var(--space-4);
}

.line {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}

.block {
  margin-bottom: var(--space-8);
}

.hours {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  padding: var(--space-1) 0;
}

.map {
  margin-top: var(--space-6);
  aspect-ratio: 4 / 3;
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  color: var(--ink-subtle);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

@media (max-width: 899px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 11: Write `src/app/contact/page.tsx`**

```tsx
import { Metadata } from 'next';
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import EnquiryForm from '@/components/contact/EnquiryForm';
import { venue } from '@/content/venue';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Find us on Cinderwood Lane, check our hours, or send an enquiry.',
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <SplitHeading as="h1" text="Visit us" className={styles.title} />

      <div className={styles.layout}>
        <Reveal>
          <div className={styles.block}>
            <p className={styles.heading}>Address</p>
            {venue.address.map((line) => (
              <p key={line} className={styles.line}>
                {line}
              </p>
            ))}
          </div>

          <div className={styles.block}>
            <p className={styles.heading}>Hours</p>
            {venue.hours.map((entry) => (
              <div key={entry.days} className={styles.hours}>
                <span>{entry.days}</span>
                <span>{entry.time}</span>
              </div>
            ))}
          </div>

          <div className={styles.block}>
            <p className={styles.heading}>Reach us</p>
            <p className={styles.line}>{venue.phone}</p>
            <p className={styles.line}>{venue.email}</p>
          </div>

          <div className={styles.map} aria-hidden="true">
            Map
          </div>
        </Reveal>

        <Reveal>
          <EnquiryForm />
        </Reveal>
      </div>
    </div>
  );
}
```

- [ ] **Step 12: Verify and commit**

```bash
npm test
npm run lint
npm run build
git add -A
git commit -m "Add contact page with validated enquiry form"
```

---

### Task 13: Route transitions and final verification

Wraps each page in a directional `<ViewTransition>`, adds the transition CSS, and runs the full gate across all five routes.

**Files:**
- Create: `src/components/motion/PageTransition.tsx`
- Modify: `src/app/page.tsx`, `src/app/menu/page.tsx`, `src/app/about/page.tsx`, `src/app/gallery/page.tsx`, `src/app/contact/page.tsx`, `src/styles/globals.css`, `src/components/layout/Header.tsx`
- Test: `tests/components/PageTransition.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks beyond the pages themselves.
- Produces: `<PageTransition>{children}</PageTransition>` — a server-safe wrapper applying the `nav-forward` / `nav-back` enter and exit maps.

**Important:** the wrapper goes in each `page.tsx`, never in `layout.tsx`. Layouts persist across navigation, so enter and exit animations never fire there.

- [ ] **Step 1: Write the failing test**

`tests/components/PageTransition.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import PageTransition from '@/components/motion/PageTransition';

describe('PageTransition', () => {
  it('renders its children unchanged', () => {
    render(
      <PageTransition>
        <p>Menu content</p>
      </PageTransition>,
    );
    expect(screen.getByText('Menu content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/components/PageTransition.test.tsx`
Expected: FAIL — cannot find module `@/components/motion/PageTransition`.

- [ ] **Step 3: Write `src/components/motion/PageTransition.tsx`**

```tsx
import { ReactNode, ViewTransition } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

// `default="none"` keeps untyped transitions (browser back/forward,
// router.refresh, Suspense reveals) from animating; only navigations
// tagged with a transition type slide.
export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <ViewTransition
      enter={{
        'nav-forward': 'nav-forward',
        'nav-back': 'nav-back',
        default: 'none',
      }}
      exit={{
        'nav-forward': 'nav-forward',
        'nav-back': 'nav-back',
        default: 'none',
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest tests/components/PageTransition.test.tsx`
Expected: PASS, 1 test.

- [ ] **Step 5: Add the transition CSS to `src/styles/globals.css`**

Append:

```css
::view-transition-old(.nav-forward) {
  animation: 160ms ease-in both fade-out, 380ms ease-in-out both slide-out-left;
}

::view-transition-new(.nav-forward) {
  animation: 220ms ease-out 160ms both fade-in, 420ms ease-out 160ms both slide-in-right;
}

::view-transition-old(.nav-back) {
  animation: 160ms ease-in both fade-out, 380ms ease-in-out both slide-out-right;
}

::view-transition-new(.nav-back) {
  animation: 220ms ease-out 160ms both fade-in, 420ms ease-out 160ms both slide-in-left;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes slide-in-right {
  from {
    transform: translateX(48px);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slide-in-left {
  from {
    transform: translateX(-48px);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slide-out-left {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-48px);
  }
}

@keyframes slide-out-right {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(48px);
  }
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

- [ ] **Step 6: Wrap every page**

In each of `src/app/page.tsx`, `src/app/menu/page.tsx`, `src/app/about/page.tsx`, `src/app/gallery/page.tsx`, and `src/app/contact/page.tsx`, add the import:

```tsx
import PageTransition from '@/components/motion/PageTransition';
```

and wrap the entire returned JSX in `<PageTransition>…</PageTransition>`. For example, `src/app/page.tsx` becomes:

```tsx
import PageTransition from '@/components/motion/PageTransition';
import Hero from '@/components/home/Hero';
import Statement from '@/components/home/Statement';
import DishShowcase from '@/components/home/DishShowcase';
import { dishes } from '@/content/dishes';
import { signatureDishes } from '@/lib/menu';

export default function HomePage() {
  return (
    <PageTransition>
      <Hero />
      <Statement />
      <DishShowcase dishes={signatureDishes(dishes, 4)} />
    </PageTransition>
  );
}
```

- [ ] **Step 7: Tag the brand link as a back navigation**

In `src/components/layout/Header.tsx`, the brand link returns the visitor to the home page, so it carries the back type:

```tsx
        <Link href="/" className={styles.brand} transitionTypes={['nav-back']}>
          {venue.name}
        </Link>
```

- [ ] **Step 8: Run the full verification gate**

```bash
npm test
npm run lint
npm run build
```

Expected: every test passes; lint exits 0; the build reports all five routes (`/`, `/menu`, `/about`, `/gallery`, `/contact`).

- [ ] **Step 9: Verify the running site**

```bash
npm run dev
```

Then confirm, in a browser at `http://localhost:3000`:
- The hero image parallaxes and the headline words rise into place.
- The signature-dish strip pins and scrubs horizontally on a desktop-width window.
- Navigating between routes slides directionally.
- A gallery thumbnail morphs into the lightbox, and Escape closes it.
- With "reduce motion" enabled in the operating system, every page still renders fully and scrolls natively, with no pinning.
- With JavaScript disabled in the browser, every page still shows its content.

Stop the server when finished.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Add directional route transitions across all pages"
```

---

## Plan Self-Review

**Spec coverage:** Every spec section maps to a task — routes (8–12), rendering model (5–8), smooth scroll (4), primitives (5–6), route transitions (13), robustness rules (5, 6, 13), content and helpers (3), visual system (2), images (8–11), project setup and toolchain (1), testing (every task).

**Correction to the spec:** the spec placed `<ViewTransition>` in the root layout. Next.js's own documentation states enter and exit animations never fire in a layout because layouts persist across navigation. Task 13 wraps each `page.tsx` instead. Update the spec's "Route transitions" paragraph to match.

**Deferred by design:** reservations and ordering (phases 2 and 3), so the "Reserve" call to action points at `/contact` throughout.
