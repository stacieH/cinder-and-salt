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

  it('shows the Google map of the venue area instead of a placeholder', () => {
    render(<VisitSection />);

    expect(screen.getByTitle(`Map of ${venue.name} in ${venue.mapArea}`)).toBeInTheDocument();
    expect(screen.queryByText('Map')).toBeNull();
  });
});
