'use client';

import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { isEmbedded } from '../embed';
import { hrefFor, navigate } from '../location';

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string | { pathname?: string; query?: Record<string, string> };
  replace?: boolean;
  prefetch?: boolean;
  scroll?: boolean;
};

// Client-side stand-in for next/link inside the static demo: renders a real anchor to the hash location.
const Link = forwardRef<HTMLAnchorElement, LinkProps>(function DemoLink({ href, replace, prefetch, scroll, onClick, ...rest }, ref) {
  void prefetch;
  void scroll;
  const location = typeof href === 'string' ? href : `${href.pathname ?? ''}${href.query ? `?${new URLSearchParams(href.query)}` : ''}`;
  return (
    <a
      {...rest}
      ref={ref}
      href={hrefFor(location)}
      onClick={event => {
        onClick?.(event);
        if (event.defaultPrevented || !(replace || isEmbedded()) || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        navigate(location, 'replace');
      }}
    />
  );
});

export default Link;
