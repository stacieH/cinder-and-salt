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
