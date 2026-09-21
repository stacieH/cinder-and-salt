require('@testing-library/jest-dom');

// jsdom implements none of these; components under test rely on all three.
// Individual tests may override window.matchMedia to assert reduced-motion paths.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

if (typeof global.IntersectionObserver !== 'function') {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}

if (typeof global.ResizeObserver !== 'function') {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// The API client reads these at call time. Tests never reach a real network.
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://api.test/v1';
process.env.NEXT_PUBLIC_ORDERING_DATA_SOURCE = 'mock';
process.env.NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE = 'mock';

// next/link handles clicks through the App Router, which unit tests do not
// mount. Render it as the anchor it produces so tests can assert the href.
jest.mock('next/link', () => {
  const React = require('react');
  const ROUTER_ONLY_PROPS = ['href', 'children', 'prefetch', 'replace', 'scroll'];

  const Link = React.forwardRef(function Link(props, ref) {
    const anchorProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => !ROUTER_ONLY_PROPS.includes(key)),
    );
    const href = typeof props.href === 'string' ? props.href : props.href.pathname;
    return React.createElement('a', { ...anchorProps, ref, href }, props.children);
  });

  return { __esModule: true, default: Link };
});

// App Router hooks need a mounted router, which unit tests do not have. Every
// test shares this one mock router; tests/helpers/navigation.ts reads it.
jest.mock('next/navigation', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };

  return {
    __esModule: true,
    mockRouter,
    useRouter: () => mockRouter,
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  };
});
