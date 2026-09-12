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
