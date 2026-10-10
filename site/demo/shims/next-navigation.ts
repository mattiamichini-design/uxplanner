'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { getLocationSnapshot, getServerLocationSnapshot, navigate, splitLocation, subscribeLocation } from '../location';

// Client-side stand-in for next/navigation inside the static demo. Product components call these unchanged;
// the demo resolves the virtual location itself (demo/demo-app.tsx).
function useLocation() {
  return useSyncExternalStore(subscribeLocation, getLocationSnapshot, getServerLocationSnapshot);
}

export function usePathname() {
  return splitLocation(useLocation()).pathname;
}

export function useSearchParams() {
  const { search } = splitLocation(useLocation());
  return useMemo(() => new URLSearchParams(search), [search]);
}

const router = {
  push: (href: string) => navigate(href, 'push'),
  replace: (href: string) => navigate(href, 'replace'),
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  // Server data does not exist here: the workspace store already re-renders every reader after a write.
  refresh: () => {},
  prefetch: () => {},
};

export function useRouter() {
  return router;
}
