# Cinder & Salt One-Page Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the four-route Cinder & Salt marketing site into one scrolling page with Menu, Gallery, About, and Contact sections, header links that smooth-scroll to them, and redirects from the retired routes.

**Architecture:** `src/app/page.tsx` composes self-contained section components (each owns its CSS module and its anchor id). A shared `useActiveSection` hook drives the active-link state for both the header and the menu's course nav. Lenis's `anchors` option handles same-page link scrolling, reading each section's CSS `scroll-margin-top` for the stop point; `next.config.js` redirects the old routes to `/#section` URLs.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6.0, GSAP 3 + `@gsap/react`, Lenis 1.3.26, CSS Modules with design tokens, Jest 29 + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-12-one-page-site-design.md` (it supersedes the Routes and Route transitions sections of `docs/superpowers/specs/2026-09-08-restaurant-marketing-site-design.md`; the rest of that spec still applies).

## Global Constraints

- Branch: `restaurant-site`. All work lands here. Do not push or merge.
- **Never run `npm install`, `npm ci`, or anything that writes to `node_modules`.** Every dependency this plan needs is already installed.
- Run every command in the foreground. Do not background `jest`, `eslint`, or `next build`.
- Do not run whole-repo `npm run lint`; run `npx eslint` on the files the task changed.
- A single Jest file runs in seconds; the full suite takes about 5 minutes on this machine. Use a 10-minute timeout for full runs.
- Version pins stay as they are: TypeScript `^6.0.3`, Jest `^29.7.0`, ESLint `^9.39.5`, Next.js `^16.3.4`, Lenis `1.3.26`.
- Brand is **Cinder & Salt**. Never add Ember/Ash wording, content from the Ember & Oak reference site, or chef details (no chef name, role, portrait, or `Chef` type).
- Colours come only from tokens in `src/styles/tokens.css`; no new hex or rgba values in components.
- **Robustness rule 1:** content is never permanently invisible. Hidden animation states are applied by JavaScript inside `useGSAP`, never by static CSS.
- **Robustness rule 2:** `prefers-reduced-motion: reduce` is honored in JavaScript (`gsap.matchMedia()`, no Lenis) and CSS.
- **Internal links are written as `href={sectionHref(...)}` expressions, never string literals.** `@next/next/no-html-link-for-pages` reports a literal `<a href="/#menu">` (it strips the hash and matches the `/` route), but it skips non-literal hrefs.
- Lint rules in force: single quotes, semicolons, `no-console` is an error, unused args must be prefixed `_`.
- Commit messages are plain sentences (no `feat:` prefix) and end with the trailer `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

### Task 1: Section links and the `useActiveSection` hook

Adds the single source of truth for the four section anchors, a hook that reports which section is in view, and a reusable IntersectionObserver test double.

**Files:**
- Create: `src/lib/sections.ts`
- Create: `src/hooks/useActiveSection.ts`
- Create: `tests/helpers/mockIntersectionObserver.ts`
- Test: `tests/lib/sections.test.ts`
- Test: `tests/hooks/useActiveSection.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `SECTION_LINKS: readonly [{ id: 'menu'; label: 'Menu' }, { id: 'gallery'; label: 'Gallery' }, { id: 'about'; label: 'About' }, { id: 'contact'; label: 'Contact' }]`
  - `type SectionId = 'menu' | 'gallery' | 'about' | 'contact'`
  - `SECTION_IDS: readonly SectionId[]`
  - `sectionHref(id: SectionId | 'top'): string` returning `'/#' + id`
  - `ACTIVE_SECTION_ROOT_MARGIN = '-40% 0px -55% 0px'`
  - `useActiveSection(ids: readonly string[]): string | null`
  - Test helper `installIntersectionObserverMock()` returning `{ observers, setIntersecting(id: string, isIntersecting: boolean): void, restore(): void }`; each observer exposes `elements: Element[]`, `options?: IntersectionObserverInit`, `disconnectCalls: number`.

- [ ] **Step 1: Write the failing tests**

Create `tests/helpers/mockIntersectionObserver.ts`:

```ts
import { act } from '@testing-library/react';

// jest.setup.js installs an inert IntersectionObserver so components can
// mount. Tests that need to drive intersection changes swap in this one.
export interface MockObserver {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  elements: Element[];
  disconnectCalls: number;
}

export function installIntersectionObserverMock() {
  const original = globalThis.IntersectionObserver;
  const observers: MockObserver[] = [];

  class MockIntersectionObserver implements MockObserver {
    callback: IntersectionObserverCallback;
    options?: IntersectionObserverInit;
    elements: Element[] = [];
    disconnectCalls = 0;

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.callback = callback;
      this.options = options;
      observers.push(this);
    }

    observe(element: Element) {
      this.elements.push(element);
    }

    unobserve() {}

    disconnect() {
      this.disconnectCalls += 1;
    }

    takeRecords() {
      return [];
    }
  }

  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;

  return {
    observers,
    setIntersecting(id: string, isIntersecting: boolean) {
      act(() => {
        observers.forEach((observer) => {
          const target = observer.elements.find((element) => element.id === id);
          if (!target) return;
          observer.callback(
            [{ isIntersecting, target } as unknown as IntersectionObserverEntry],
            observer as unknown as IntersectionObserver,
          );
        });
      });
    },
    restore() {
      globalThis.IntersectionObserver = original;
    },
  };
}
```

Create `tests/lib/sections.test.ts`:

```ts
import { SECTION_IDS, SECTION_LINKS, sectionHref } from '@/lib/sections';

describe('sections', () => {
  it('lists the four sections in page order', () => {
    expect(SECTION_IDS).toEqual(['menu', 'gallery', 'about', 'contact']);
  });

  it('labels each section for navigation', () => {
    expect(SECTION_LINKS.map((link) => link.label)).toEqual([
      'Menu',
      'Gallery',
      'About',
      'Contact',
    ]);
  });

  it('builds root-relative hrefs so links also work away from the home page', () => {
    expect(sectionHref('about')).toBe('/#about');
    expect(sectionHref('top')).toBe('/#top');
  });
});
```

Create `tests/hooks/useActiveSection.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { ACTIVE_SECTION_ROOT_MARGIN, useActiveSection } from '@/hooks/useActiveSection';
import { installIntersectionObserverMock } from '../helpers/mockIntersectionObserver';

function Probe({ ids }: { ids: string[] }) {
  const active = useActiveSection(ids);
  return <p data-testid="active">{active ?? 'none'}</p>;
}

function renderWithSections(ids: string[], present: string[] = ids) {
  return render(
    <>
      <Probe ids={ids} />
      {present.map((id) => (
        <section key={id} id={id} />
      ))}
    </>,
  );
}

describe('useActiveSection', () => {
  let io: ReturnType<typeof installIntersectionObserverMock>;

  beforeEach(() => {
    io = installIntersectionObserverMock();
  });

  afterEach(() => {
    io.restore();
  });

  it('reports no active section before any section intersects', () => {
    renderWithSections(['menu', 'gallery']);
    expect(screen.getByTestId('active')).toHaveTextContent('none');
  });

  it('observes every present section with one observer and the shared band', () => {
    renderWithSections(['menu', 'gallery']);

    expect(io.observers).toHaveLength(1);
    expect(io.observers[0].elements.map((element) => element.id)).toEqual(['menu', 'gallery']);
    expect(io.observers[0].options).toEqual({ rootMargin: ACTIVE_SECTION_ROOT_MARGIN });
  });

  it('skips ids that have no element on the page', () => {
    renderWithSections(['menu', 'missing'], ['menu']);
    expect(io.observers[0].elements.map((element) => element.id)).toEqual(['menu']);
  });

  it('reports the section inside the band', () => {
    renderWithSections(['menu', 'gallery']);

    io.setIntersecting('gallery', true);

    expect(screen.getByTestId('active')).toHaveTextContent('gallery');
  });

  it('returns to none once that section leaves the band', () => {
    renderWithSections(['menu', 'gallery']);

    io.setIntersecting('gallery', true);
    io.setIntersecting('gallery', false);

    expect(screen.getByTestId('active')).toHaveTextContent('none');
  });

  it('prefers the earlier section in the given order when two intersect', () => {
    renderWithSections(['menu', 'gallery']);

    io.setIntersecting('gallery', true);
    io.setIntersecting('menu', true);

    expect(screen.getByTestId('active')).toHaveTextContent('menu');
  });

  it('disconnects its observer on unmount', () => {
    const { unmount } = renderWithSections(['menu']);

    unmount();

    expect(io.observers[0].disconnectCalls).toBe(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/lib/sections.test.ts tests/hooks/useActiveSection.test.tsx`
Expected: FAIL with `Cannot find module '@/lib/sections'` and `Cannot find module '@/hooks/useActiveSection'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/sections.ts`:

```ts
export const SECTION_LINKS = [
  { id: 'menu', label: 'Menu' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
] as const;

export type SectionId = (typeof SECTION_LINKS)[number]['id'];

export const SECTION_IDS: readonly SectionId[] = SECTION_LINKS.map((link) => link.id);

// Root-relative rather than a bare `#id`, so the links still reach the
// sections from any page that is not `/`, such as the 404 page.
export function sectionHref(id: SectionId | 'top'): string {
  return `/#${id}`;
}
```

Create `src/hooks/useActiveSection.ts`:

```ts
import { useEffect, useState } from 'react';

// A thin band just above the middle of the viewport: a section counts as
// "in view" while it crosses that band.
export const ACTIVE_SECTION_ROOT_MARGIN = '-40% 0px -55% 0px';

export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  // Callers often build `ids` inline, so key the effect on the ids
  // themselves rather than on the array's identity.
  const idsKey = ids.join(' ');

  useEffect(() => {
    const order = idsKey.split(' ');
    const elements = order
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return undefined;

    const intersecting = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersecting.add(entry.target.id);
          } else {
            intersecting.delete(entry.target.id);
          }
        });
        setActive(order.find((id) => intersecting.has(id)) ?? null);
      },
      { rootMargin: ACTIVE_SECTION_ROOT_MARGIN },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [idsKey]);

  return active;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/lib/sections.test.ts tests/hooks/useActiveSection.test.tsx`
Expected: PASS, 10 tests.

- [ ] **Step 5: Lint the changed files**

Run: `npx eslint src/lib/sections.ts src/hooks/useActiveSection.ts tests/helpers/mockIntersectionObserver.ts tests/lib/sections.test.ts tests/hooks/useActiveSection.test.tsx`
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sections.ts src/hooks/useActiveSection.ts tests/helpers/mockIntersectionObserver.ts tests/lib/sections.test.ts tests/hooks/useActiveSection.test.tsx
git commit -m "Add section links and useActiveSection hook" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Menu section and course nav `aria-current`

Moves the menu page body into a `MenuSection` component with the one-page heading levels, and switches `CourseNav` to the shared hook so the active course carries `aria-current`. The `/menu` route keeps working until Task 5 deletes it.

**Files:**
- Create: `src/components/menu/MenuSection.tsx`
- Create: `src/components/menu/MenuSection.module.css`
- Modify: `src/components/menu/CourseNav.tsx` (whole file)
- Modify: `src/styles/globals.css` (heading reset rules, lines 31-44)
- Test: `tests/components/MenuSection.test.tsx`
- Test: `tests/components/CourseNav.test.tsx` (whole file)

**Interfaces:**
- Consumes: `useActiveSection(ids: readonly string[]): string | null` from `@/hooks/useActiveSection`; `installIntersectionObserverMock()` from `tests/helpers/mockIntersectionObserver.ts`; existing `groupByCourse(dishes: Dish[]): CourseGroup[]` from `@/lib/menu`; existing `dishes` from `@/content/dishes`.
- Produces: default export `MenuSection(): JSX.Element` rendering `<section id="menu">`; `CourseNav({ groups }: { groups: { course: Course; label: string }[] })` now sets `aria-current="true"` on the active course link.

- [ ] **Step 1: Write the failing tests**

Create `tests/components/MenuSection.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import MenuSection from '@/components/menu/MenuSection';
import { dishes } from '@/content/dishes';

describe('MenuSection', () => {
  it('is the #menu anchor target', () => {
    const { container } = render(<MenuSection />);
    expect(container.querySelector('section#menu')).not.toBeNull();
  });

  it('titles the section with an h2', () => {
    render(<MenuSection />);
    expect(screen.getByRole('heading', { level: 2, name: 'The Menu' })).toBeInTheDocument();
  });

  it('renders every course as an h3 in menu order', () => {
    render(<MenuSection />);

    const courses = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(courses).toEqual(['Starters', 'Mains', 'Sides', 'Desserts', 'Drinks']);
  });

  it('renders all 19 dishes as h4 headings', () => {
    render(<MenuSection />);

    const names = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    expect(names).toHaveLength(19);
    expect(names).toEqual(expect.arrayContaining(dishes.map((dish) => dish.name)));
  });

  it('prints prices in Philippine pesos', () => {
    render(<MenuSection />);
    expect(screen.getByText('₱1,980')).toBeInTheDocument();
  });
});
```

Replace `tests/components/CourseNav.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import CourseNav from '@/components/menu/CourseNav';
import { installIntersectionObserverMock } from '../helpers/mockIntersectionObserver';

const groups = [
  { course: 'starters' as const, label: 'Starters' },
  { course: 'mains' as const, label: 'Mains' },
];

function renderWithCourses() {
  return render(
    <>
      <CourseNav groups={groups} />
      <section id="starters" />
      <section id="mains" />
    </>,
  );
}

describe('CourseNav', () => {
  let io: ReturnType<typeof installIntersectionObserverMock>;

  beforeEach(() => {
    io = installIntersectionObserverMock();
  });

  afterEach(() => {
    io.restore();
  });

  it('renders an anchor per course', () => {
    renderWithCourses();

    expect(screen.getByRole('link', { name: 'Starters' })).toHaveAttribute('href', '#starters');
    expect(screen.getByRole('link', { name: 'Mains' })).toHaveAttribute('href', '#mains');
  });

  it('labels the navigation for assistive technology', () => {
    renderWithCourses();
    expect(screen.getByRole('navigation', { name: 'Menu courses' })).toBeInTheDocument();
  });

  it('marks no course as current before any is in view', () => {
    renderWithCourses();

    expect(screen.getByRole('link', { name: 'Starters' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Mains' })).not.toHaveAttribute('aria-current');
  });

  it('marks the course in view with aria-current', () => {
    renderWithCourses();

    io.setIntersecting('mains', true);

    expect(screen.getByRole('link', { name: 'Mains' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'Starters' })).not.toHaveAttribute('aria-current');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/components/MenuSection.test.tsx tests/components/CourseNav.test.tsx`
Expected: FAIL. `MenuSection.test.tsx` fails with `Cannot find module '@/components/menu/MenuSection'`; `CourseNav.test.tsx` fails `marks the course in view with aria-current` (no `aria-current` attribute).

- [ ] **Step 3: Write the implementation**

Create `src/components/menu/MenuSection.tsx`:

```tsx
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import CourseNav from '@/components/menu/CourseNav';
import { dishes } from '@/content/dishes';
import { groupByCourse } from '@/lib/menu';
import styles from './MenuSection.module.css';

export default function MenuSection() {
  const groups = groupByCourse(dishes);

  return (
    <section id="menu" className={styles.section}>
      <SplitHeading text="The Menu" className={styles.title} />
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
              <h3 className={styles.courseTitle}>{group.label}</h3>
              <Reveal stagger={0.06}>
                {group.dishes.map((dish) => (
                  <div key={dish.id} className={styles.dish}>
                    <div>
                      <h4 className={styles.dishName}>{dish.name}</h4>
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
    </section>
  );
}
```

Create `src/components/menu/MenuSection.module.css`. It is the old `src/app/menu/menu.module.css` with two changes: the section no longer pads for the header (the page, not each section, sits under it), and `.course` uses `padding-bottom` instead of `margin-bottom` so consecutive courses touch and the active-course band never falls into a gap between them.

```css
.section {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
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
  padding-bottom: var(--space-12);
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

Replace `src/components/menu/CourseNav.tsx` with:

```tsx
'use client';
import { useActiveSection } from '@/hooks/useActiveSection';
import { Course } from '@/types';
import styles from './CourseNav.module.css';

interface CourseNavProps {
  groups: { course: Course; label: string }[];
}

export default function CourseNav({ groups }: CourseNavProps) {
  const active = useActiveSection(groups.map((group) => group.course));

  return (
    <nav className={styles.nav} aria-label="Menu courses">
      {groups.map((group) => {
        const isActive = active === group.course;

        return (
          <a
            key={group.course}
            href={`#${group.course}`}
            className={styles.link}
            data-active={isActive}
            aria-current={isActive ? 'true' : undefined}
          >
            {group.label}
          </a>
        );
      })}
    </nav>
  );
}
```

In `src/styles/globals.css`, dish names are now `h4`, so extend the heading resets. Replace:

```css
h1,
h2,
h3,
p {
  margin: 0;
}

h1,
h2,
h3 {
```

with:

```css
h1,
h2,
h3,
h4,
p {
  margin: 0;
}

h1,
h2,
h3,
h4 {
```

(The rule body that follows — display font, `font-weight: 400`, tight leading — stays unchanged.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/components/MenuSection.test.tsx tests/components/CourseNav.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 5: Lint the changed files**

Run: `npx eslint src/components/menu/MenuSection.tsx src/components/menu/CourseNav.tsx tests/components/MenuSection.test.tsx tests/components/CourseNav.test.tsx`
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/menu/MenuSection.tsx src/components/menu/MenuSection.module.css src/components/menu/CourseNav.tsx src/styles/globals.css tests/components/MenuSection.test.tsx tests/components/CourseNav.test.tsx
git commit -m "Add MenuSection and mark the active course with aria-current" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: About section

Adds the text-only About section: new story copy and a four-entry restaurant timeline, with no chef content and no image.

**Files:**
- Modify: `src/types/index.ts` (add two interfaces after `GalleryImage`)
- Create: `src/content/about.ts`
- Create: `src/components/about/AboutSection.tsx`
- Create: `src/components/about/AboutSection.module.css`
- Test: `tests/components/AboutSection.test.tsx`

**Interfaces:**
- Consumes: existing `Reveal` (`as`, `className`, `stagger` props) and `SplitHeading` (`text`, `className`; renders `h2` by default).
- Produces: `interface Milestone { year: string; title: string; body: string }`; `interface AboutContent { title: string; story: string[]; milestones: Milestone[] }`; `about: AboutContent` from `@/content/about`; default export `AboutSection(): JSX.Element` rendering `<section id="about">`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/AboutSection.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import AboutSection from '@/components/about/AboutSection';
import { about } from '@/content/about';

describe('AboutSection', () => {
  it('is the #about anchor target', () => {
    const { container } = render(<AboutSection />);
    expect(container.querySelector('section#about')).not.toBeNull();
  });

  it('titles the section with an h2', () => {
    render(<AboutSection />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Built around the grill' }),
    ).toBeInTheDocument();
  });

  it('renders both story paragraphs', () => {
    render(<AboutSection />);

    expect(about.story).toHaveLength(2);
    about.story.forEach((paragraph) => {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    });
  });

  it('renders the four milestones in order as h3 headings in a list', () => {
    render(<AboutSection />);

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Weekend supper club',
      'Cinderwood Lane',
      'Farms and day boats',
      'Cinder & Salt today',
    ]);
  });

  it('shows the year of each milestone', () => {
    render(<AboutSection />);

    ['2016', '2019', '2022', '2026'].forEach((year) => {
      expect(screen.getByText(year)).toBeInTheDocument();
    });
  });

  it('contains no image and no chef details', () => {
    const { container } = render(<AboutSection />);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByText(/chef/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/components/AboutSection.test.tsx`
Expected: FAIL with `Cannot find module '@/components/about/AboutSection'`.

- [ ] **Step 3: Write the implementation**

In `src/types/index.ts`, insert after the closing `}` of `interface GalleryImage`:

```ts
export interface Milestone {
  year: string;
  title: string;
  body: string;
}

export interface AboutContent {
  title: string;
  story: string[];
  milestones: Milestone[];
}
```

Create `src/content/about.ts` (copy is verbatim from the spec; do not reword it):

```ts
import { AboutContent } from '@/types';

export const about: AboutContent = {
  title: 'Built around the grill',
  story: [
    'Cinder & Salt started as a weekend supper club: one charcoal grill, a crate of flake salt, and twelve borrowed chairs. The idea has not changed since — cook over live flame, season simply, and let what arrives each morning decide the menu.',
    'Everything still passes through one grill. Vegetables char beside the ribeye, bread toasts over the last of the coals, and every plate leaves the pass while it is still hot.',
  ],
  milestones: [
    {
      year: '2016',
      title: 'Weekend supper club',
      body: 'Twelve seats around a charcoal grill in a Poblacion courtyard, open on Saturdays only.',
    },
    {
      year: '2019',
      title: 'Cinderwood Lane',
      body: 'The first permanent room opened at 27 Cinderwood Lane, with the grill in full view of every table.',
    },
    {
      year: '2022',
      title: 'Farms and day boats',
      body: 'Produce and seafood now come directly from partner farms and day boats, with no distributors in between.',
    },
    {
      year: '2026',
      title: 'Cinder & Salt today',
      body: 'One live-flame menu, served six nights a week.',
    },
  ],
};
```

Create `src/components/about/AboutSection.tsx`:

```tsx
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import { about } from '@/content/about';
import styles from './AboutSection.module.css';

export default function AboutSection() {
  return (
    <section id="about" className={styles.section}>
      <div className={styles.story}>
        <SplitHeading text={about.title} className={styles.title} />
        <Reveal>
          {about.story.map((paragraph) => (
            <p key={paragraph} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
        </Reveal>
      </div>

      <ol className={styles.timeline}>
        {about.milestones.map((milestone) => (
          <Reveal as="li" key={milestone.year}>
            <div className={styles.entry}>
              <span className={styles.year}>{milestone.year}</span>
              <div>
                <h3 className={styles.entryTitle}>{milestone.title}</h3>
                <p className={styles.entryBody}>{milestone.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
```

Create `src/components/about/AboutSection.module.css`:

```css
.section {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
}

.story {
  max-width: 60ch;
  margin: 0 auto var(--space-12);
  text-align: center;
}

/* SplitHeading lays its words out with flexbox, so centre them with
   justify-content rather than text-align. */
.title {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-6);
  justify-content: center;
}

.paragraph {
  color: var(--ink-muted);
  margin-bottom: var(--space-5);
}

.timeline {
  max-width: 820px;
  margin: 0 auto;
  padding: 0;
  list-style: none;
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
  .entry {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest tests/components/AboutSection.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 5: Lint the changed files**

Run: `npx eslint src/types/index.ts src/content/about.ts src/components/about/AboutSection.tsx tests/components/AboutSection.test.tsx`
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/content/about.ts src/components/about/AboutSection.tsx src/components/about/AboutSection.module.css tests/components/AboutSection.test.tsx
git commit -m "Add text-only About section with restaurant timeline" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Gallery and Visit sections, lightbox scroll lock on `<html>`

Moves the gallery and contact page bodies into section components, and moves the lightbox scroll lock from `<body>` to `<html>`, where Lenis's `autoToggle` (enabled in Task 7) can see it.

**Files:**
- Create: `src/components/gallery/GallerySection.tsx`
- Create: `src/components/gallery/GallerySection.module.css`
- Create: `src/components/contact/VisitSection.tsx`
- Create: `src/components/contact/VisitSection.module.css`
- Modify: `src/components/gallery/GalleryGrid.tsx:63-76` (scroll-lock effect)
- Test: `tests/components/GallerySection.test.tsx`
- Test: `tests/components/VisitSection.test.tsx`
- Test: `tests/components/GalleryGrid.test.tsx` (`afterEach` at lines 31-33 and the last test at lines 124-133)

**Interfaces:**
- Consumes: existing `GalleryGrid({ images }: { images: GalleryImage[] })`, `galleryImages`, `VenueDetails()`, `EnquiryForm()`, `venue`.
- Produces: default exports `GallerySection(): JSX.Element` rendering `<section id="gallery">` and `VisitSection(): JSX.Element` rendering `<section id="contact">`; `GalleryGrid` now sets `document.documentElement.style.overflow = 'hidden'` while the lightbox is open.

- [ ] **Step 1: Write the failing tests**

Create `tests/components/GallerySection.test.tsx`:

```tsx
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    ViewTransition: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { render, screen } from '@testing-library/react';
import GallerySection from '@/components/gallery/GallerySection';
import { galleryImages } from '@/content/gallery';

describe('GallerySection', () => {
  it('is the #gallery anchor target', () => {
    const { container } = render(<GallerySection />);
    expect(container.querySelector('section#gallery')).not.toBeNull();
  });

  it('titles the section with an h2', () => {
    render(<GallerySection />);
    expect(screen.getByRole('heading', { level: 2, name: 'The Room' })).toBeInTheDocument();
  });

  it('renders a tile for every gallery image', () => {
    render(<GallerySection />);
    expect(screen.getAllByRole('button', { name: /^View / })).toHaveLength(galleryImages.length);
  });
});
```

Create `tests/components/VisitSection.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import VisitSection from '@/components/contact/VisitSection';
import { venue } from '@/content/venue';

describe('VisitSection', () => {
  it('is the #contact anchor target', () => {
    const { container } = render(<VisitSection />);
    expect(container.querySelector('section#contact')).not.toBeNull();
  });

  it('titles the section with an h2', () => {
    render(<VisitSection />);
    expect(screen.getByRole('heading', { level: 2, name: 'Visit us' })).toBeInTheDocument();
  });

  it('shows the venue address and phone number', () => {
    render(<VisitSection />);

    expect(screen.getByText(venue.address[0])).toBeInTheDocument();
    expect(screen.getByText(venue.phone)).toBeInTheDocument();
  });

  it('includes the enquiry form', () => {
    render(<VisitSection />);
    expect(screen.getByRole('button', { name: 'Send enquiry' })).toBeInTheDocument();
  });
});
```

In `tests/components/GalleryGrid.test.tsx`, replace the `afterEach` block:

```tsx
  afterEach(() => {
    document.body.style.overflow = '';
  });
```

with:

```tsx
  afterEach(() => {
    document.documentElement.style.overflow = '';
  });
```

and replace the last test (`locks body scroll while the dialog is open ...`) with:

```tsx
  it('locks page scroll on the root element while open and restores the prior value after close', () => {
    document.documentElement.style.overflow = 'scroll';
    render(<GalleryGrid images={images} />);

    fireEvent.click(screen.getByRole('button', { name: /dining room at dusk/i }));
    expect(document.documentElement.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Close image' }));
    expect(document.documentElement.style.overflow).toBe('scroll');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/components/GallerySection.test.tsx tests/components/VisitSection.test.tsx tests/components/GalleryGrid.test.tsx`
Expected: FAIL. The two section suites fail with `Cannot find module`; `GalleryGrid.test.tsx` fails `locks page scroll on the root element ...` (expected `hidden`, received `scroll`).

- [ ] **Step 3: Write the implementation**

Create `src/components/gallery/GallerySection.tsx`:

```tsx
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import { galleryImages } from '@/content/gallery';
import styles from './GallerySection.module.css';

export default function GallerySection() {
  return (
    <section id="gallery" className={styles.section}>
      <SplitHeading text="The Room" className={styles.title} />
      <Reveal>
        <p className={styles.intro}>
          Photographs from service — the grill at its hottest, and the room once it
          settles.
        </p>
      </Reveal>

      <GalleryGrid images={galleryImages} />
    </section>
  );
}
```

Create `src/components/gallery/GallerySection.module.css`:

```css
.section {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
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

Create `src/components/contact/VisitSection.tsx`:

```tsx
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import EnquiryForm from '@/components/contact/EnquiryForm';
import VenueDetails from '@/components/venue/VenueDetails';
import styles from './VisitSection.module.css';

export default function VisitSection() {
  return (
    <section id="contact" className={styles.section}>
      <SplitHeading text="Visit us" className={styles.title} />

      <div className={styles.layout}>
        <Reveal className={styles.venueBlocks}>
          <VenueDetails />

          <div className={styles.map} aria-hidden="true">
            Map
          </div>
        </Reveal>

        <Reveal>
          <EnquiryForm />
        </Reveal>
      </div>
    </section>
  );
}
```

Create `src/components/contact/VisitSection.module.css`:

```css
.section {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
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

.venueBlocks > div + div:not(.map) {
  margin-top: var(--space-8);
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

In `src/components/gallery/GalleryGrid.tsx`, replace the scroll-lock effect (the comment and `useEffect` at lines 63-76) with:

```tsx
  // A plain `<div role="dialog">` gets no browser-enforced modality, unlike
  // native <dialog>.showModal(). Lock background scroll ourselves while the
  // dialog is open, restoring whatever value was there before rather than
  // assuming it was empty. The lock sits on <html>, not <body>: Lenis
  // ignores body overflow, but its autoToggle option (see
  // SmoothScrollProvider) pauses smooth scrolling while the root element's
  // overflow is hidden.
  useEffect(() => {
    if (!open) return undefined;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    return () => {
      root.style.overflow = previousOverflow;
    };
  }, [open]);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/components/GallerySection.test.tsx tests/components/VisitSection.test.tsx tests/components/GalleryGrid.test.tsx`
Expected: PASS, 16 tests (3 + 4 + 9).

- [ ] **Step 5: Lint the changed files**

Run: `npx eslint src/components/gallery/GallerySection.tsx src/components/contact/VisitSection.tsx src/components/gallery/GalleryGrid.tsx tests/components/GallerySection.test.tsx tests/components/VisitSection.test.tsx tests/components/GalleryGrid.test.tsx`
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/gallery/GallerySection.tsx src/components/gallery/GallerySection.module.css src/components/contact/VisitSection.tsx src/components/contact/VisitSection.module.css src/components/gallery/GalleryGrid.tsx tests/components/GallerySection.test.tsx tests/components/VisitSection.test.tsx tests/components/GalleryGrid.test.tsx
git commit -m "Add Gallery and Visit sections; lock lightbox scroll on html" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Compose the one page, redirect retired routes, remove route transitions

Makes `/` render every section, deletes the three routes and the route-transition layer, and redirects `/menu`, `/gallery`, `/about`, and `/contact` to their sections.

**Files:**
- Modify: `src/app/page.tsx` (whole file)
- Modify: `src/components/home/Hero.tsx:13` (add `id="top"`)
- Modify: `next.config.js` (whole file)
- Modify: `src/styles/globals.css` (delete route-transition styles; add section scroll margin)
- Delete: `src/app/menu/page.tsx`, `src/app/menu/menu.module.css`, `src/app/gallery/page.tsx`, `src/app/gallery/gallery.module.css`, `src/app/contact/page.tsx`, `src/app/contact/contact.module.css`
- Delete: `src/components/motion/PageTransition.tsx`, `tests/components/PageTransition.test.tsx`
- Test: `tests/app/page.test.tsx`
- Test: `tests/config/redirects.test.ts`

**Interfaces:**
- Consumes: `SECTION_IDS` from `@/lib/sections` (Task 1); `MenuSection` (Task 2); `AboutSection` (Task 3); `GallerySection`, `VisitSection` (Task 4); existing `Hero`, `Statement`, `DishShowcase({ dishes })`, `signatureDishes(dishes, limit)`.
- Produces: `/` renders `#top`, `#menu`, `#gallery`, `#about`, `#contact`; `nextConfig.redirects(): Promise<{ source: string; destination: string; permanent: true }[]>`.

- [ ] **Step 1: Write the failing tests**

Create `tests/app/page.test.tsx`:

```tsx
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    ViewTransition: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('@/components/motion/PinnedSequence', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';
import { SECTION_IDS } from '@/lib/sections';

describe('HomePage', () => {
  it('renders a target for every navigation anchor', () => {
    const { container } = render(<HomePage />);

    ['top', ...SECTION_IDS].forEach((id) => {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    });
  });

  it('orders the sections menu, gallery, about, contact', () => {
    const { container } = render(<HomePage />);
    const sectionIds: readonly string[] = SECTION_IDS;

    const order = Array.from(container.querySelectorAll('section[id]'))
      .map((section) => section.id)
      .filter((id) => sectionIds.includes(id));

    expect(order).toEqual(['menu', 'gallery', 'about', 'contact']);
  });

  it('has exactly one h1', () => {
    render(<HomePage />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
```

Create `tests/config/redirects.test.ts`:

```ts
import nextConfig from '../../next.config.js';

describe('next.config.js redirects', () => {
  it('permanently redirects each retired route to its section on the one page', async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toEqual([
      { source: '/menu', destination: '/#menu', permanent: true },
      { source: '/gallery', destination: '/#gallery', permanent: true },
      { source: '/about', destination: '/#about', permanent: true },
      { source: '/contact', destination: '/#contact', permanent: true },
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/app/page.test.tsx tests/config/redirects.test.ts`
Expected: FAIL. The page suite fails `renders a target for every navigation anchor` (`#top` is null); the redirects suite fails because `redirects` is `undefined`.

- [ ] **Step 3: Write the implementation**

Replace `src/app/page.tsx` with:

```tsx
import Hero from '@/components/home/Hero';
import Statement from '@/components/home/Statement';
import DishShowcase from '@/components/home/DishShowcase';
import MenuSection from '@/components/menu/MenuSection';
import GallerySection from '@/components/gallery/GallerySection';
import AboutSection from '@/components/about/AboutSection';
import VisitSection from '@/components/contact/VisitSection';
import { dishes } from '@/content/dishes';
import { signatureDishes } from '@/lib/menu';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Statement />
      <DishShowcase dishes={signatureDishes(dishes, 4)} />
      <MenuSection />
      <GallerySection />
      <AboutSection />
      <VisitSection />
    </>
  );
}
```

In `src/components/home/Hero.tsx`, change:

```tsx
    <section className={styles.hero}>
```

to:

```tsx
    <section id="top" className={styles.hero}>
```

Replace `next.config.js` with:

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
  // The site is one page. Routes that used to exist redirect to their
  // section; Next.js keeps the #fragment in a redirect destination.
  async redirects() {
    return ['menu', 'gallery', 'about', 'contact'].map((section) => ({
      source: `/${section}`,
      destination: `/#${section}`,
      permanent: true,
    }));
  },
};

module.exports = nextConfig;
```

Delete the retired routes and the route-transition component:

```bash
git rm src/app/menu/page.tsx src/app/menu/menu.module.css src/app/gallery/page.tsx src/app/gallery/gallery.module.css src/app/contact/page.tsx src/app/contact/contact.module.css src/components/motion/PageTransition.tsx tests/components/PageTransition.test.tsx
```

In `src/styles/globals.css`:

1. Delete every rule from `::view-transition-old(.nav-forward) {` down to and including the closing `}` of `@keyframes slide-out-right`. That removes the four `nav-forward`/`nav-back` view-transition rules and the `fade-in`, `fade-out`, `slide-in-right`, `slide-in-left`, `slide-out-left`, and `slide-out-right` keyframes. Keep the `.morph` rules, `@keyframes morph-blur`, and the whole `@media (prefers-reduced-motion: reduce)` block.
2. Insert directly after the `:focus-visible { ... }` rule:

```css
/* Section anchors stop just below the scrolled (64px) fixed header. Lenis's
   scrollTo reads scroll-margin-top as well, so this one value sets the stop
   point for smooth scrolling and for the native jump under reduced motion.
   :where() keeps specificity at zero, so a component's own rule (the menu's
   course anchors) still wins. */
:where(section[id]) {
  scroll-margin-top: var(--space-10);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/app/page.test.tsx tests/config/redirects.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Confirm nothing still imports the deleted files**

Run: `git grep -n "PageTransition\|app/menu\|app/gallery\|app/contact" -- src tests`
Expected: no output.

- [ ] **Step 6: Build**

Run: `npx next build`
Expected: `✓ Compiled successfully`, TypeScript passes, and the route table lists only `○ /` and `○ /_not-found`.

If the TypeScript step fails citing `.next/dev/types/validator.ts` and a deleted route such as `src/app/menu/page.js`, that is a stale generated file. Check that no dev server is running (`Get-CimInstance Win32_Process -Filter "Name='node.exe'"` in PowerShell shows no `next dev`), then delete `.next/dev/types` and build again.

- [ ] **Step 7: Lint the changed files**

Run: `npx eslint src/app/page.tsx src/components/home/Hero.tsx next.config.js tests/app/page.test.tsx tests/config/redirects.test.ts`
Expected: no output, exit code 0.

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx src/components/home/Hero.tsx next.config.js src/styles/globals.css tests/app/page.test.tsx tests/config/redirects.test.ts
git commit -m "Compose the one-page site and redirect the retired routes" -m "Remove the menu, gallery, and contact routes and the route transition layer." -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Header and footer section navigation

Points the header and footer at the sections, drives the header's active link from `useActiveSection`, and slims the footer so the venue details appear only in Visit us.

**Files:**
- Modify: `src/components/layout/Header.tsx` (whole file)
- Modify: `src/components/layout/Footer.tsx` (whole file)
- Modify: `src/components/layout/Footer.module.css` (whole file)
- Modify: `src/components/venue/VenueDetails.tsx:4-10` (comment only)
- Test: `tests/components/Header.test.tsx` (whole file)
- Test: `tests/components/Footer.test.tsx`

**Interfaces:**
- Consumes: `SECTION_IDS`, `SECTION_LINKS`, `sectionHref` from `@/lib/sections` and `useActiveSection` from `@/hooks/useActiveSection` (Task 1); `installIntersectionObserverMock()` test helper (Task 1).
- Produces: header `<nav aria-label="Primary">` with links `/#menu`, `/#gallery`, `/#about`, `/#contact`, the brand at `/#top`, and Reserve at `/#contact`; footer `<nav aria-label="Footer">` with the same four section links.

- [ ] **Step 1: Write the failing tests**

Replace `tests/components/Header.test.tsx` with:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
import Header from '@/components/layout/Header';
import { venue } from '@/content/venue';
import { installIntersectionObserverMock } from '../helpers/mockIntersectionObserver';

function renderWithSections() {
  return render(
    <>
      <Header />
      <section id="menu" />
      <section id="gallery" />
      <section id="about" />
      <section id="contact" />
    </>,
  );
}

function sectionLinks() {
  const nav = screen.getByRole('navigation', { name: 'Primary' });
  return within(nav)
    .getAllByRole('link')
    .filter((link) => link.textContent !== 'Reserve');
}

describe('Header', () => {
  let io: ReturnType<typeof installIntersectionObserverMock>;

  beforeEach(() => {
    io = installIntersectionObserverMock();
  });

  afterEach(() => {
    io.restore();
  });

  it('links the brand to the top of the page', () => {
    renderWithSections();
    expect(screen.getByRole('link', { name: venue.name })).toHaveAttribute('href', '/#top');
  });

  it('links each section in page order', () => {
    renderWithSections();

    expect(sectionLinks().map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Menu', '/#menu'],
      ['Gallery', '/#gallery'],
      ['About', '/#about'],
      ['Contact', '/#contact'],
    ]);
  });

  it('marks no link as current while no section is in view', () => {
    renderWithSections();

    sectionLinks().forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current');
    });
  });

  it('marks the section in view with aria-current', () => {
    renderWithSections();

    io.setIntersecting('about', true);

    const current = sectionLinks().filter((link) => link.getAttribute('aria-current') === 'true');
    expect(current.map((link) => link.textContent)).toEqual(['About']);
  });

  it('points the reserve call to action at the contact section until booking exists', () => {
    renderWithSections();
    expect(screen.getByRole('link', { name: 'Reserve' })).toHaveAttribute('href', '/#contact');
  });

  it('marks itself scrolled once the page moves', () => {
    const { container } = renderWithSections();
    const header = container.querySelector('header') as HTMLElement;

    expect(header.dataset.scrolled).toBe('false');

    window.scrollY = 200;
    fireEvent.scroll(window);

    expect(header.dataset.scrolled).toBe('true');
  });
});
```

Create `tests/components/Footer.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import Footer from '@/components/layout/Footer';
import { venue } from '@/content/venue';

describe('Footer', () => {
  it('links to each section in page order', () => {
    render(<Footer />);

    const nav = screen.getByRole('navigation', { name: 'Footer' });
    const links = within(nav).getAllByRole('link');

    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Menu', '/#menu'],
      ['Gallery', '/#gallery'],
      ['About', '/#about'],
      ['Contact', '/#contact'],
    ]);
  });

  it('links the brand to the top of the page', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: venue.name })).toHaveAttribute('href', '/#top');
  });

  it('does not repeat the venue details shown in Visit us', () => {
    render(<Footer />);

    expect(screen.queryByText(venue.address[0])).toBeNull();
    expect(screen.queryByText(venue.phone)).toBeNull();
    expect(screen.queryByText('Hours')).toBeNull();
  });

  it('shows the copyright line', () => {
    render(<Footer />);
    expect(
      screen.getByText(`© ${new Date().getFullYear()} ${venue.name}. ${venue.tagline}`),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/components/Header.test.tsx tests/components/Footer.test.tsx`
Expected: FAIL. Header fails on the `/#top` and `/#menu` hrefs and the missing `Primary` navigation name; Footer fails because there is no `Footer` navigation and the address is rendered.

- [ ] **Step 3: Write the implementation**

Replace `src/components/layout/Header.tsx` with:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { venue } from '@/content/venue';
import { useActiveSection } from '@/hooks/useActiveSection';
import { SECTION_IDS, SECTION_LINKS, sectionHref } from '@/lib/sections';
import styles from './Header.module.css';

export default function Header() {
  const active = useActiveSection(SECTION_IDS);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Plain anchors, not next/link: every link targets a section of this one
  // page, and Lenis's `anchors` option (SmoothScrollProvider) smooth-scrolls
  // same-page links itself.
  return (
    <header className={styles.header} data-scrolled={scrolled}>
      <div className={styles.inner}>
        <a href={sectionHref('top')} className={styles.brand}>
          {venue.name}
        </a>

        <nav className={styles.nav} aria-label="Primary">
          <div className={styles.links}>
            {SECTION_LINKS.map((link) => {
              const isActive = active === link.id;

              return (
                <a
                  key={link.id}
                  href={sectionHref(link.id)}
                  className={styles.link}
                  data-active={isActive}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
          <a href={sectionHref('contact')} className={styles.reserve}>
            Reserve
          </a>
        </nav>
      </div>
    </header>
  );
}
```

Replace `src/components/layout/Footer.tsx` with:

```tsx
import { venue } from '@/content/venue';
import { SECTION_LINKS, sectionHref } from '@/lib/sections';
import styles from './Footer.module.css';

// The venue details live in the Visit us section directly above the footer,
// so the footer carries only navigation and the copyright line.
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <a href={sectionHref('top')} className={styles.brand}>
          {venue.name}
        </a>

        <nav aria-label="Footer">
          <ul className={styles.links}>
            {SECTION_LINKS.map((link) => (
              <li key={link.id}>
                <a href={sectionHref(link.id)} className={styles.link}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className={styles.colophon}>
        © {new Date().getFullYear()} {venue.name}. {venue.tagline}
      </p>
    </footer>
  );
}
```

Replace `src/components/layout/Footer.module.css` with:

```css
.footer {
  border-top: 1px solid var(--border);
  background: var(--surface-raised);
  padding: var(--space-10) var(--space-6) var(--space-8);
}

.inner {
  max-width: var(--content-max);
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
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

.links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
  margin: 0;
  padding: 0;
  list-style: none;
}

.link {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-muted);
  transition: color 200ms ease;
}

.link:hover {
  color: var(--ink);
}

.colophon {
  max-width: var(--content-max);
  margin: var(--space-8) auto 0;
  padding-top: var(--space-5);
  border-top: 1px solid var(--border);
  font-size: var(--text-xs);
  color: var(--ink-subtle);
}
```

In `src/components/venue/VenueDetails.tsx`, replace the comment block above the component (lines 4-10) with:

```tsx
// Rendered by the Visit us section (VisitSection). A Server Component with
// no props: the section controls the surrounding layout (a stacked column
// with a spacer between blocks) via CSS targeting these plain, unclassed
// wrapper elements.
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/components/Header.test.tsx tests/components/Footer.test.tsx`
Expected: PASS, 10 tests.

- [ ] **Step 5: Confirm route-navigation code is gone**

Run: `git grep -n "transitionTypes\|usePathname\|next/link" -- src tests`
Expected: no output.

- [ ] **Step 6: Lint the changed files**

Run: `npx eslint src/components/layout/Header.tsx src/components/layout/Footer.tsx src/components/venue/VenueDetails.tsx tests/components/Header.test.tsx tests/components/Footer.test.tsx`
Expected: no output, exit code 0. (A `no-html-link-for-pages` error here means an `href` was written as a string literal; switch it to `sectionHref(...)`.)

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/Header.tsx src/components/layout/Footer.tsx src/components/layout/Footer.module.css src/components/venue/VenueDetails.tsx tests/components/Header.test.tsx tests/components/Footer.test.tsx
git commit -m "Point header and footer navigation at the page sections" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Lenis anchor scrolling, auto-pause, and landing on a hash

Enables smooth scrolling for section links, pauses Lenis while the lightbox locks the page, and corrects the landing position when a visit arrives with a `#section` hash.

**Files:**
- Modify: `src/components/motion/SmoothScrollProvider.tsx:15` and `:45-52` (Lenis options; load handler)
- Modify: `src/app/layout.tsx:7` (import Lenis's stylesheet)
- Test: `tests/components/SmoothScrollProvider.test.tsx` (Lenis mock at lines 1-10; add three tests)

**Interfaces:**
- Consumes: the `<html>` overflow lock from Task 4; the `:where(section[id])` scroll margin from Task 5.
- Produces: `new Lenis({ duration: 1.1, smoothWheel: true, anchors: true, autoToggle: true })`; on `window` `load`, `ScrollTrigger.refresh()` then, if `window.location.hash` is set, `lenis.scrollTo(window.location.hash, { immediate: true })`.

- [ ] **Step 1: Write the failing tests**

In `tests/components/SmoothScrollProvider.test.tsx`, replace the Lenis mock (lines 1-10) with:

```tsx
jest.mock('lenis', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      raf: jest.fn(),
      scrollTo: jest.fn(),
      destroy: jest.fn(),
    })),
  };
});
```

Then add these three tests at the end of the `describe('SmoothScrollProvider', ...)` block, just before its closing `});`:

```tsx
  it('enables anchor scrolling and pauses itself while the root overflow is hidden', () => {
    render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );

    expect(MockedLenis).toHaveBeenCalledWith(
      expect.objectContaining({ anchors: true, autoToggle: true }),
    );
  });

  it('re-scrolls to the URL hash once the page has loaded', () => {
    const refreshSpy = jest.spyOn(ScrollTrigger, 'refresh').mockImplementation(() => {});
    window.history.replaceState(null, '', '/#menu');

    render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );
    window.dispatchEvent(new Event('load'));

    const lenisInstance = MockedLenis.mock.results[0].value;
    expect(lenisInstance.scrollTo).toHaveBeenCalledWith('#menu', { immediate: true });

    window.history.replaceState(null, '', '/');
    refreshSpy.mockRestore();
  });

  it('does not scroll on load when the URL has no hash', () => {
    const refreshSpy = jest.spyOn(ScrollTrigger, 'refresh').mockImplementation(() => {});
    window.history.replaceState(null, '', '/');

    render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );
    window.dispatchEvent(new Event('load'));

    const lenisInstance = MockedLenis.mock.results[0].value;
    expect(lenisInstance.scrollTo).not.toHaveBeenCalled();

    refreshSpy.mockRestore();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/components/SmoothScrollProvider.test.tsx`
Expected: FAIL `enables anchor scrolling ...` (options lack `anchors`/`autoToggle`) and `re-scrolls to the URL hash ...` (`scrollTo` not called). The other tests still pass.

- [ ] **Step 3: Write the implementation**

In `src/components/motion/SmoothScrollProvider.tsx`, replace:

```tsx
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
```

with:

```tsx
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      // Same-page links such as /#menu smooth-scroll. Lenis applies each
      // target's scroll-margin-top, so the stop point below the fixed header
      // is set once, in CSS (globals.css).
      anchors: true,
      // Pause while the root element's overflow is hidden, which is how the
      // gallery lightbox locks the page. Depends on lenis/dist/lenis.css,
      // imported in the root layout.
      autoToggle: true,
    });
```

Then replace:

```tsx
    window.addEventListener('load', refresh);

    return () => {
      cancelled = true;
      window.removeEventListener('load', refresh);
```

with:

```tsx
    // A visit that arrives with a hash (a shared link, or a redirect from a
    // retired route) jumps natively before PinnedSequence has added its pin
    // spacing, so it lands short of the section. Re-scroll once the page and
    // its images have loaded and the triggers have been refreshed.
    const onLoad = () => {
      refresh();
      if (!cancelled && window.location.hash) {
        lenis.scrollTo(window.location.hash, { immediate: true });
      }
    };

    window.addEventListener('load', onLoad);

    return () => {
      cancelled = true;
      window.removeEventListener('load', onLoad);
```

(The `gsap.ticker.remove(advance);` and `lenis.destroy();` lines that follow stay as they are.)

In `src/app/layout.tsx`, replace:

```tsx
import '../styles/globals.css';
```

with:

```tsx
// Lenis's stylesheet makes overflow changes on <html> fire the transition
// event its autoToggle option listens for. Imported before globals.css so
// the site's own rules win any overlap.
import 'lenis/dist/lenis.css';
import '../styles/globals.css';
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/components/SmoothScrollProvider.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 5: Lint the changed files**

Run: `npx eslint src/components/motion/SmoothScrollProvider.tsx src/app/layout.tsx tests/components/SmoothScrollProvider.test.tsx`
Expected: no output, exit code 0.

- [ ] **Step 6: Build**

Run: `npx next build`
Expected: `✓ Compiled successfully` (the `lenis/dist/lenis.css` import resolves through the package's `./dist/*` export), and the route table lists only `○ /` and `○ /_not-found`.

- [ ] **Step 7: Commit**

```bash
git add src/components/motion/SmoothScrollProvider.tsx src/app/layout.tsx tests/components/SmoothScrollProvider.test.tsx
git commit -m "Smooth-scroll section links and land correctly on a hash" -m "Enable Lenis anchors and autoToggle, and re-scroll to the URL hash after load." -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Verification gate

Runs the whole suite and build against the finished one-page site, and hands the browser checks to the user.

**Files:**
- No source changes. If a check fails, fix it in the task that owns the file and re-run this task.

**Interfaces:**
- Consumes: everything from Tasks 1-7.
- Produces: a verified branch ready for the user's browser pass.

- [ ] **Step 1: Run the full test suite**

Run: `npx jest` (10-minute timeout; takes about 5 minutes)
Expected: every suite passes. Suites: the 15 that existed before this plan minus `PageTransition` (14), plus `sections`, `useActiveSection`, `MenuSection`, `AboutSection`, `GallerySection`, `VisitSection`, `page`, `redirects`, and `Footer` — 23 suites in total. `PinnedSequence.test.tsx` prints a GSAP stack trace as expected log output; it is not a failure.

- [ ] **Step 2: Lint every file this plan touched**

Run:

```bash
npx eslint src/lib/sections.ts src/hooks/useActiveSection.ts src/components/menu/MenuSection.tsx src/components/menu/CourseNav.tsx src/types/index.ts src/content/about.ts src/components/about/AboutSection.tsx src/components/gallery/GallerySection.tsx src/components/gallery/GalleryGrid.tsx src/components/contact/VisitSection.tsx src/app/page.tsx src/components/home/Hero.tsx next.config.js src/components/layout/Header.tsx src/components/layout/Footer.tsx src/components/venue/VenueDetails.tsx src/components/motion/SmoothScrollProvider.tsx src/app/layout.tsx tests/helpers/mockIntersectionObserver.ts tests/lib/sections.test.ts tests/hooks/useActiveSection.test.tsx tests/components/MenuSection.test.tsx tests/components/CourseNav.test.tsx tests/components/AboutSection.test.tsx tests/components/GallerySection.test.tsx tests/components/VisitSection.test.tsx tests/components/GalleryGrid.test.tsx tests/app/page.test.tsx tests/config/redirects.test.ts tests/components/Header.test.tsx tests/components/Footer.test.tsx tests/components/SmoothScrollProvider.test.tsx
```

Expected: no output, exit code 0.

- [ ] **Step 3: Build**

Run: `npx next build`
Expected: compiles, TypeScript passes, route table lists only `○ /` and `○ /_not-found`.

- [ ] **Step 4: Scan for leftovers**

Run: `git grep -n "PageTransition\|transitionTypes\|usePathname\|next/link" -- src tests`
Expected: no output.

Run: `git grep -n -i "ember\|chef" -- src`
Expected: no output. (Only `src` is scanned: `AboutSection.test.tsx` deliberately contains `/chef/i` to assert the section has no chef details.)

- [ ] **Step 5: Hand the browser checklist to the user**

These need a real browser; jsdom cannot scroll or lay out. Start the dev server with `npx next dev` and report this list to the user rather than ticking it yourself:

1. Header links Menu, Gallery, About, Contact smooth-scroll, and each section's heading stops just below the header.
2. The active header link follows the scroll: none over the hero, statement, and signatures; then Menu, Gallery, About, Contact in turn.
3. In the menu, the course nav highlights the course in view.
4. Visiting `/menu`, `/gallery`, `/about`, and `/contact` directly lands on the matching section after the page loads, not short of it.
5. With the gallery lightbox open, the mouse wheel does not scroll the page behind it; closing it restores scrolling.
6. With reduced motion emulated (DevTools → Rendering → `prefers-reduced-motion: reduce`), header links jump straight to the right place.
7. From a 404 page (for example `/nope`), header and footer links go to the matching section on `/`.
8. The footer shows the brand, the four section links, and the copyright line, with no hours or address.
