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
