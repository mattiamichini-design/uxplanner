'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DemoLink } from './demo-dialog';
import { GitHubMark, Logo, PlayIcon } from './icons';
import { repositoryUrl } from './links';
import { navigation } from './navigation';

// After a click the band ignores the sections passed on the way for at most this long, or until the smooth scroll settles.
const clickPinMs = 1200;
// A scroll that pauses this long hands the band back to the sections in view.
const scrollSettleMs = 160;
// A section counts as current while it crosses this band of the viewport, just under the floating bar.
const sectionBand = '-20% 0px -70% 0px';

// Appears once the hero navigation leaves the viewport, so every section stays one click away.
export function FloatingNav() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const links = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const heroNav = document.getElementById('hero-nav');
    if (!heroNav) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    observer.observe(heroNav);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Anchors point at the section headings; the band tracks the whole section around each one.
    const sections = new Map<Element, string>();
    for (const item of navigation) {
      const section = document.querySelector(item.href)?.closest('section');
      if (section) sections.set(section, item.href);
    }
    const inView = new Set<string>();
    const fromScroll = () => navigation.find(item => inView.has(item.href))?.href ?? null;
    // After a click the band jumps straight to the destination and ignores the sections passed on the way,
    // until the smooth scroll settles or the visitor takes over the scroll.
    let pinned: string | null = null;
    let settle = 0;
    const release = () => {
      if (pinned === null) return;
      pinned = null;
      window.clearTimeout(settle);
      setCurrent(fromScroll());
    };
    const onScroll = () => {
      if (pinned === null) return;
      window.clearTimeout(settle);
      settle = window.setTimeout(release, scrollSettleMs);
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const href = link?.getAttribute('href');
      if (!href || !navigation.some(item => item.href === href)) return;
      pinned = href;
      setCurrent(href);
      window.clearTimeout(settle);
      settle = window.setTimeout(release, clickPinMs);
    };
    // A section counts as current while it crosses a band just under the floating bar.
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const href = sections.get(entry.target);
          if (!href) continue;
          if (entry.isIntersecting) inView.add(href);
          else inView.delete(href);
        }
        if (pinned === null) setCurrent(fromScroll());
      },
      { rootMargin: sectionBand },
    );
    sections.forEach((_, section) => observer.observe(section));
    document.addEventListener('click', onClick);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', release);
    window.addEventListener('wheel', release, { passive: true });
    window.addEventListener('touchstart', release, { passive: true });
    return () => {
      observer.disconnect();
      window.clearTimeout(settle);
      document.removeEventListener('click', onClick);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', release);
      window.removeEventListener('wheel', release);
      window.removeEventListener('touchstart', release);
    };
  }, []);

  useLayoutEffect(() => {
    const list = links.current;
    const marker = indicator.current;
    if (!list || !marker) return;
    const place = () => {
      const link = current ? list.querySelector<HTMLElement>(`a[href="${current}"]`) : null;
      marker.classList.toggle('is-shown', link !== null);
      if (!link) return;
      marker.style.width = `${link.offsetWidth}px`;
      marker.style.transform = `translateX(${link.offsetLeft}px)`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [current]);

  return (
    <div className={`floating-nav${visible ? ' is-visible' : ''}`} inert={!visible}>
      <nav aria-label="Sections">
        <a className="floating-brand" href="#top" aria-label="UX Planner, back to the top">
          <Logo />
        </a>
        <div className="floating-links" ref={links}>
          <span className="floating-indicator" ref={indicator} aria-hidden="true" />
          <ul>
            {navigation.map(item => (
              <li key={item.href}>
                <a href={item.href} aria-current={current === item.href ? 'location' : undefined}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="floating-actions">
          <DemoLink className="floating-demo">
            <PlayIcon />
            <span>Demo</span>
          </DemoLink>
          <a className="floating-github" href={repositoryUrl} target="_blank" rel="noopener" aria-label="Clone on GitHub">
            <GitHubMark />
            <span>GitHub</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
