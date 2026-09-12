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
