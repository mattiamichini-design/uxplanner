'use client';
'use no memo';

import NextLink from 'next/link';
import { Component, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { StudioFrame, StudioPrimaryRail } from '@/components/ux-planner/studio-shell';
import { LayoutProvider } from '@/context/layout-context';
import { repositoryUrl } from '@site/components/links';
import { demoMessages, demoPersistenceNote, isEmbedded, notifyParent } from './embed';
import { getLocationSnapshot, getServerLocationSnapshot, navigate, rememberLocation, splitLocation, subscribeLocation } from './location';
import { DemoPage, redirectFor } from './routes';
import { getWorkspaceVersion, initializeWorkspace, subscribeWorkspace, type DemoSeed } from './workspace-store';

class RouteBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null; key: string }> {
  state = { error: null as Error | null, key: this.props.resetKey };
  static getDerivedStateFromError(error: Error) { return { error }; }
  static getDerivedStateFromProps(props: { resetKey: string }, state: { key: string }) {
    return props.resetKey === state.key ? null : { error: null, key: props.resetKey };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="demo-error" role="alert">
        <h1>This planning file could not be read.</h1>
        <p>{this.state.error.message}</p>
        <button type="button" onClick={() => this.setState({ error: null })}>Retry</button>
      </main>
    );
  }
}

const noStore = () => () => {};

// Opened as a page (new tab, no-JS link, slow-load fallback), the demo needs its own way back and to GitHub.
function StandaloneBar() {
  const standalone = useSyncExternalStore(noStore, () => !isEmbedded(), () => false);
  if (!standalone) return null;
  return (
    <div className="demo-standalone">
      <NextLink href="/">← UX Planner</NextLink>
      <span>Demo workspace · {demoPersistenceNote}</span>
      <a href={repositoryUrl}>Clone on GitHub</a>
    </div>
  );
}

export function DemoApp({ seed }: { seed: DemoSeed }) {
  const version = useSyncExternalStore(subscribeWorkspace, getWorkspaceVersion, () => 0);
  const location = useSyncExternalStore(subscribeLocation, getLocationSnapshot, getServerLocationSnapshot);

  useEffect(() => { initializeWorkspace(seed); }, [seed]);

  const ready = version > 0;
  useEffect(() => { if (ready) notifyParent(demoMessages.ready); }, [ready]);
  // Only real navigation is remembered; a fresh iframe has an empty hash and must not overwrite the last place.
  useEffect(() => { if (isEmbedded() && window.location.hash.startsWith('#/')) rememberLocation(location); }, [location]);

  // Escape inside the iframe never reaches the landing's dialog; pass it up once the demo's own layers have had it.
  useEffect(() => {
    if (!isEmbedded()) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      // In a field with text, the first Escape leaves the field; the next one leaves the demo.
      const field = (event.target as HTMLElement | null)?.closest<HTMLElement>('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
      if (field && ((field as HTMLInputElement).value || field.isContentEditable)) {
        field.blur();
        return;
      }
      notifyParent(demoMessages.escape);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const { pathname, search } = splitLocation(location);
  const route = { pathname, params: new URLSearchParams(search) };
  const redirect = version > 0 ? redirectFor(route) : null;
  // Render the redirect target right away so the frame never shows an empty step between section root and item.
  const target = redirect ? (() => { const next = splitLocation(redirect); return { pathname: next.pathname, params: new URLSearchParams(next.search) }; })() : route;
  useEffect(() => { if (redirect) navigate(redirect, 'replace'); }, [redirect]);

  if (version === 0) return <div className="demo-loading" role="status">Loading demo workspace…</div>;

  return (
    <LayoutProvider>
      <StandaloneBar />
      <div className="dev-theme bg-ux-canvas text-ux-text flex min-h-screen flex-col antialiased md:flex-row">
        <StudioPrimaryRail />
        <div className="min-w-0 flex-1">
          <StudioFrame>
            <RouteBoundary resetKey={location}>
              <DemoPage route={target} />
            </RouteBoundary>
          </StudioFrame>
        </div>
        <p className="demo-pill" role="note">Demo · {demoPersistenceNote}</p>
      </div>
    </LayoutProvider>
  );
}
