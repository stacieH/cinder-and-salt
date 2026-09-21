import { useSyncExternalStore } from 'react';

// The ordering portal has the same three helpers for its tracking tokens
// (src/lib/ordering/fragment.ts and orderTokens.ts). They stay separate so
// neither feature's storage key or fragment name moves when the other changes.
const PREFIX = 'cs-manage-token:';

/**
 * Reads `token` from a "#token=…" fragment. The fragment never reaches the
 * site's server, its logs, or a Referer header.
 */
export function readFragmentToken(hash: string): string | null {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  const token = new URLSearchParams(fragment).get('token')?.trim();
  return token ? token : null;
}

function subscribeToLocation(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  window.addEventListener('popstate', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener('popstate', onChange);
  };
}

/** The token in the address bar; undefined until hydrated, null when there is none. */
export function useManageToken(): string | null | undefined {
  return useSyncExternalStore(
    subscribeToLocation,
    () => readFragmentToken(window.location.hash),
    () => undefined,
  );
}

/** Keeps the token for this tab, so a reload after booking still finds it. */
export function rememberManageToken(reference: string, token: string): void {
  try {
    window.sessionStorage.setItem(`${PREFIX}${reference}`, token);
  } catch {
    // Storage is blocked: the confirmation still shows the link itself.
  }
}

export function recallManageToken(reference: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(`${PREFIX}${reference}`);
  } catch {
    return null;
  }
}
