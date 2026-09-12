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
