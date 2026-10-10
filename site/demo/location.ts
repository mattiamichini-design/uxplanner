import { demoLocationStorageKey } from './storage';
import { isEmbedded } from './embed';

// The demo has one static page, so its "routes" live in the URL hash: /demo#/ux-planner/user-journeys/<slug>?persona=<slug>.
// Hash navigation needs no server, survives reloads, works inside an iframe and keeps the browser Back button useful.
export const defaultDemoLocation = '/ux-planner/user-journeys/onboarding?persona=persona-1';

const listeners = new Set<() => void>();
let attached = false;

function notify() { listeners.forEach(listener => listener()); }

export function subscribeLocation(listener: () => void) {
  listeners.add(listener);
  if (!attached) {
    window.addEventListener('hashchange', notify);
    window.addEventListener('popstate', notify);
    attached = true;
  }
  return () => { listeners.delete(listener); };
}

const lastLocationKey = demoLocationStorageKey;

function readLastLocation() {
  try {
    return window.sessionStorage.getItem(lastLocationKey);
  } catch {
    return null;
  }
}

/** Current virtual location (path and query); embedded, an empty hash resumes where the visitor left the demo. */
export function getLocationSnapshot() {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash.startsWith('/')) return hash;
  const last = isEmbedded() ? readLastLocation() : null;
  return last?.startsWith('/') ? last : defaultDemoLocation;
}

export function rememberLocation(location: string) {
  try {
    window.sessionStorage.setItem(lastLocationKey, location);
  } catch {
    // Without storage the demo reopens on the default journey.
  }
}

export function getServerLocationSnapshot() { return defaultDemoLocation; }

export function hrefFor(location: string) { return `#${location}`; }

// Inside the landing's dialog every step replaces history, so the page's Back button never stops on demo states.
export function navigate(location: string, mode: 'push' | 'replace' = 'push') {
  if (mode === 'replace' || isEmbedded()) {
    window.history.replaceState(null, '', hrefFor(location));
    notify();
  } else {
    window.location.hash = hrefFor(location);
  }
}

export function splitLocation(location: string) {
  const index = location.indexOf('?');
  return { pathname: index === -1 ? location : location.slice(0, index), search: index === -1 ? '' : location.slice(index + 1) };
}
