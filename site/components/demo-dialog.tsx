'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { GitHubMark, LogoTile, ResetIcon } from './icons';
import { demoMessages, demoPersistenceNote } from '@site/demo/embed';
import { clearDemoStorage } from '@site/demo/storage';
import { demoPath, repositoryUrl } from './links';
import { durationToken, easingToken, numberToken } from './motion';

type OpenDemo = (trigger: HTMLElement, origin?: HTMLElement | null) => void;

const DemoContext = createContext<OpenDemo | null>(null);

// A demo that has not loaded after this long gets a way out instead of an endless message.
const slowLoadMs = 8000;

function prefersReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// The dialog grows out of whatever opened it: a button, or the hero window around the screenshot.
function clipFrom(origin: DOMRect, box: DOMRect, radius: number) {
  const top = Math.max(0, origin.top - box.top);
  const right = Math.max(0, box.right - origin.right);
  const bottom = Math.max(0, box.bottom - origin.bottom);
  const left = Math.max(0, origin.left - box.left);
  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${radius}px)`;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [session, setSession] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const frame = useRef<HTMLIFrameElement>(null);
  const resetting = useRef(false);

  // A demo that has not loaded after a while gets a way out instead of an endless message.
  useEffect(() => {
    if (!open || loaded) return;
    const timer = setTimeout(() => setSlow(true), slowLoadMs);
    return () => clearTimeout(timer);
  }, [open, loaded, session]);

  const openDemo = useCallback<OpenDemo>((source, origin) => {
    const element = dialog.current;
    if (!element || element.open) return;
    trigger.current = source;
    const from = (origin ?? source).getBoundingClientRect();
    setLoaded(false);
    setSlow(false);
    setOpen(true);
    element.showModal();
    const box = element.getBoundingClientRect();
    const radius = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
    if (prefersReducedMotion()) {
      element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: durationToken('ux-duration-base', 200), easing: 'ease' });
      return;
    }
    element.animate(
      [
        { clipPath: clipFrom(from, box, numberToken('dialog-origin-radius', 12)) },
        { clipPath: `inset(0px 0px 0px 0px round ${radius}px)` },
      ],
      { duration: durationToken('dur-dialog-open', 440), easing: easingToken('ease-out', 'cubic-bezier(0.22, 1, 0.36, 1)') },
    );
  }, []);

  const close = useCallback(() => {
    const element = dialog.current;
    if (!element?.open || closing.current) return;
    closing.current = true;
    element.classList.add('is-closing');
    const finish = () => {
      element.classList.remove('is-closing');
      element.close();
      closing.current = false;
    };
    const keyframes = prefersReducedMotion()
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(${numberToken('dialog-exit-shift', 12)}px) scale(${numberToken('dialog-exit-scale', 0.985)})` }];
    element.animate(keyframes, { duration: durationToken('dur-dialog-close', 200), easing: easingToken('ease-out', 'cubic-bezier(0.22, 1, 0.36, 1)'), fill: 'forwards' }).finished.then(finish, finish);
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const onCancel = (event: Event) => {
      event.preventDefault();
      close();
    };
    const onClose = () => {
      element.getAnimations().forEach(animation => animation.cancel());
      setOpen(false);
      trigger.current?.focus({ preventScroll: true });
    };
    element.addEventListener('cancel', onCancel);
    element.addEventListener('close', onClose);
    return () => {
      element.removeEventListener('cancel', onCancel);
      element.removeEventListener('close', onClose);
    };
  }, [close]);

  // The demo reports when its workspace is ready (an iframe load event also fires for error pages) and relays Escape.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const type = (event.data as { type?: string } | null)?.type;
      if (type === demoMessages.ready) {
        setLoaded(true);
        if (resetting.current) {
          resetting.current = false;
          setAnnouncement('Demo reset to the sample workspace.');
        }
      }
      if (type === demoMessages.escape) close();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [close]);

  const reload = () => {
    setLoaded(false);
    setSlow(false);
    setAnnouncement('');
    setSession(value => value + 1);
  };

  const reset = () => {
    clearDemoStorage();
    resetting.current = true;
    reload();
  };

  return (
    <DemoContext.Provider value={openDemo}>
      {children}
      <dialog ref={dialog} className="demo-dialog" aria-labelledby="demo-title" aria-describedby="demo-description">
        <div className="demo-toolbar">
          <div className="demo-toolbar-start">
            <span className="demo-lights">
              <button type="button" className="demo-light demo-light-close" aria-label="Close the demo" onClick={close} />
              <i aria-hidden="true" />
              <i aria-hidden="true" />
            </span>
            <button type="button" className="demo-back" onClick={close} autoFocus>
              Back to the page
            </button>
          </div>
          <div className="demo-address">
            <LogoTile size={18} />
            <p>
              <span id="demo-title">
                <span className="demo-title-long">UX Planner demo</span>
                <span className="demo-title-short">Demo</span>
              </span>
              <span className="demo-note">
                <span className="demo-note-long">{demoPersistenceNote}</span>
                <span className="demo-note-short">Edits stay in this tab</span>
              </span>
            </p>
          </div>
          <div className="demo-toolbar-end">
            <button type="button" className="demo-tool" onClick={reset}>
              <ResetIcon />
              <span className="demo-tool-label">Reset demo</span>
              <span className="demo-tool-short">Reset</span>
            </button>
            <a className="demo-tool demo-tool-primary" href={repositoryUrl}>
              <GitHubMark />
              <span className="demo-tool-label">Clone on GitHub</span>
            </a>
          </div>
        </div>
        <p id="demo-description" className="visually-hidden">
          The real interface on a sample workspace you can edit. {demoPersistenceNote} Press Escape to return to the page.
        </p>
        <div className={`demo-stage${loaded ? ' is-loaded' : ''}`} aria-busy={!loaded}>
          <p className="demo-loading" role="status">
            {slow ? (
              <>
                The demo is taking a while.&nbsp;
                <button type="button" onClick={reload}>Try again</button>&nbsp;or&nbsp;<a href={demoPath}>open it as a page</a>.
              </>
            ) : (
              'Loading the demo…'
            )}
          </p>
          <p className="visually-hidden" role="status">{announcement}</p>
          {open && (
            <iframe
              ref={frame}
              key={session}
              className="demo-frame"
              src={demoPath}
              title="Interactive UX Planner demo"
            />
          )}
        </div>
      </dialog>
    </DemoContext.Provider>
  );
}

function useOpenDemo() {
  const open = useContext(DemoContext);
  return (event: MouseEvent<HTMLElement>, origin?: HTMLElement | null) => {
    // Modified clicks keep the link behaviour and open the demo on its own page.
    if (!open || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    open(event.currentTarget, origin);
  };
}

export function DemoLink({ className, children }: { className: string; children: ReactNode }) {
  const openDemo = useOpenDemo();
  return (
    <a className={className} href={demoPath} onClick={event => openDemo(event)}>
      {children}
    </a>
  );
}

// The green light of the hero window expands the screenshot into the live demo.
export function WindowExpand() {
  const openDemo = useOpenDemo();
  return (
    <a
      className="window-expand"
      href={demoPath}
      aria-label="Open the demo"
      onClick={event => openDemo(event, event.currentTarget.closest<HTMLElement>('.window'))}
    >
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d="M3.5 3.5h3.2L3.5 6.7Z M8.5 8.5H5.3l3.2-3.2Z" />
      </svg>
      <span className="window-expand-hint" aria-hidden="true">Open the demo</span>
    </a>
  );
}
