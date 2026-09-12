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
