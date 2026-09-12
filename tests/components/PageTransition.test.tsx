let capturedProps: Record<string, unknown> | null = null;

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    ViewTransition: (props: { children: React.ReactNode }) => {
      capturedProps = props;
      return props.children;
    },
  };
});

import { render, screen } from '@testing-library/react';
import PageTransition from '@/components/motion/PageTransition';

describe('PageTransition', () => {
  beforeEach(() => {
    capturedProps = null;
  });

  it('renders its children unchanged', () => {
    render(
      <PageTransition>
        <p>Menu content</p>
      </PageTransition>,
    );
    expect(screen.getByText('Menu content')).toBeInTheDocument();
  });

  // The enter/exit/default props are PageTransition's only real content -
  // everything else is passthrough. A mock that just returns `children`
  // (the previous version of this test) passes even if this mapping were
  // deleted entirely, so assert the actual shape of what's passed to
  // ViewTransition.
  it('maps nav-forward and nav-back directionally for both enter and exit, with default: none', () => {
    render(
      <PageTransition>
        <p>Menu content</p>
      </PageTransition>,
    );

    expect(capturedProps).not.toBeNull();
    expect(capturedProps).toMatchObject({
      default: 'none',
      enter: {
        'nav-forward': 'nav-forward',
        'nav-back': 'nav-back',
        default: 'none',
      },
      exit: {
        'nav-forward': 'nav-forward',
        'nav-back': 'nav-back',
        default: 'none',
      },
    });
  });
});
