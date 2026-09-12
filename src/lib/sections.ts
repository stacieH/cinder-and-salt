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
