'use client';

import { useEffect } from 'react';

// Marks each [data-reveal] block once it enters the viewport; CSS owns every transition.
// Without JavaScript the <noscript> rule in the landing keeps all content visible.
// A block reveals once it is this far inside the viewport.
const revealMargin = '0px 0px -12% 0px';

export function RevealController() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-revealed', '');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: revealMargin },
    );
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return null;
}
