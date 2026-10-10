import React, { createContext, useContext } from 'react';
import { normalizeInternalAppHref } from '../src/lib/security/safe-url';
export const RouterContext = createContext(null);
export const useRouter = () => useContext(RouterContext).router;
export const usePathname = () => useContext(RouterContext).url.pathname;
export const useSearchParams = () => useContext(RouterContext).url.searchParams;
export function redirect(href) { throw Object.assign(new Error('Redirect'), { redirect: href }); }
export function notFound() { throw Object.assign(new Error('Page not found'), { notFound: true }); }
export function workspaceHref(href) {
  const safe = normalizeInternalAppHref(href);
  if (!safe || !/^\/ux-planner(?:\/|$)/.test(safe.split(/[?#]/)[0])) throw new Error('Unsupported workspace route.');
  return safe;
}
export default function Link({ href, children, onClick, prefetch: _prefetch, replace, scroll: _scroll, ...props }) {
  void _prefetch;
  void _scroll;
  const router = useRouter();
  const target = typeof href === 'string' ? href : `${href.pathname || ''}${href.query ? '?' + new URLSearchParams(href.query) : ''}`;
  return <a {...props} href={target} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    (replace ? router.replace : router.push)(target);
  }}>{children}</a>;
}
