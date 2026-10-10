import React, { useEffect, useEffectEvent, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { app, bridge, callTool, getWorkspaceContext, setSnapshot, setWorkspace } from './runtime.mjs';
import WorkspaceSelector from './workspace-selector.jsx';
import { RouterContext, workspaceHref } from './navigation.jsx';
import Layout from '../src/app/ux-planner/layout';
import ErrorPage from '../src/app/ux-planner/error';
import NotFound from '../src/app/ux-planner/user-journeys/[slug]/not-found';
import Journeys from '../src/app/ux-planner/user-journeys/page';
import Journey from '../src/app/ux-planner/user-journeys/[slug]/page';
import Personas from '../src/app/ux-planner/user-personas/page';
import Persona from '../src/app/ux-planner/user-personas/[slug]/page';
import Flows from '../src/app/ux-planner/user-flows/page';
import Flow from '../src/app/ux-planner/user-flows/[slug]/page';
import Stories from '../src/app/ux-planner/user-stories/page';
import Story from '../src/app/ux-planner/user-stories/[slug]/page';
const sections = { 'user-journeys': [Journeys, Journey], 'user-personas': [Personas, Persona], 'user-flows': [Flows, Flow], 'user-stories': [Stories, Story] };
let render;
let sequence = 0;
let current = '/ux-planner/user-journeys';
let requested = current;
let history = [current];
let position = 0;
async function navigate(href, opening = false) {
  const ticket = ++sequence;
  try {
    requested = workspaceHref(href);
    let target = requested;
    // Existing root pages redirect once to their first available document.
    for (let redirects = 0; redirects < 5; redirects++) {
      const data = await callTool('workspace_snapshot', { path: target });
      if (ticket !== sequence) return;
      setSnapshot(data);
      const url = new URL(target, 'https://ux-planner.invalid');
      const [, root, section = 'user-journeys', slug] = url.pathname.split('/');
      if (root !== 'ux-planner' || !sections[section]) throw Object.assign(new Error('Page not found'), { notFound: true });
      try {
        const page = sections[section][slug ? 1 : 0];
        const content = await page({ params: Promise.resolve({ slug: slug && decodeURIComponent(slug) }), searchParams: Promise.resolve(Object.fromEntries(url.searchParams)) });
        if (ticket !== sequence) return;
        current = `${url.pathname}${url.search}${url.hash}`;
        requested = current;
        history[position] = current;
        render({ url, content });
        return;
      } catch (error) {
        if (!error.redirect) throw error;
        target = workspaceHref(error.redirect);
      }
    }
    throw new Error('Too many workspace redirects.');
  } catch (error) {
    if (ticket !== sequence) return;
    if (opening) throw error;
    render({ url: new URL(current, 'https://ux-planner.invalid'), content: React.createElement(error.notFound ? NotFound : ErrorPage, { error, reset: () => void navigate(current) }) });
  }
}
const router = {
  push(href) { const safe = workspaceHref(href); history = history.slice(0, position + 1); history.push(safe); position++; void navigate(safe); },
  replace(href) { const safe = workspaceHref(href); history[position] = safe; void navigate(safe); },
  refresh() { void navigate(requested); },
  back() { if (position > 0) void navigate(history[--position]); },
  forward() { if (position + 1 < history.length) void navigate(history[++position]); },
  prefetch() {},
};
class RenderBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() { return this.state.error ? React.createElement(ErrorPage, { error: this.state.error, reset: () => { this.setState({ error: null }); router.refresh(); } }) : this.props.children; }
}
function Workspace() {
  const [page, setPage] = useState(null);
  const [context, setContext] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  render = setPage;
  async function open(project) {
    setBusy(true);
    setError('');
    try {
      setWorkspace(project);
      await navigate(current, true);
    } catch (error) {
      setError(error.message || 'Unable to open this project.');
    } finally { setBusy(false); }
  }
  async function refresh() {
    setBusy(true);
    setError('');
    try {
      const next = await getWorkspaceContext();
      setContext(next);
      if (next.mode === 'repository' && !next.error) {
        const project = next.projects.length === 1 ? next.projects[0] : null;
        if (project?.registered && project.running && project.root === next.root) await open(project);
      }
    } catch (error) {
      setError(error.message || 'Unable to load registered projects.');
    } finally { setBusy(false); }
  }
  const loadInitialContext = useEffectEvent(refresh);
  useEffect(() => { void loadInitialContext(); }, []);
  if (!page) return React.createElement(WorkspaceSelector, { context, busy, error, onRefresh: refresh, onOpen: open });
  return React.createElement(RouterContext.Provider, { value: { router, url: page.url } },
    React.createElement(RenderBoundary, null, React.createElement(Layout, null, page.content)));
}
try {
  await app.connect();
  window.UX_PLANNER_BRIDGE = bridge;
  const root = createRoot(document.getElementById('root'));
  // Commit the initial loading render before resolving the async page functions.
  const { flushSync } = await import('react-dom');
  flushSync(() => root.render(React.createElement(Workspace)));
  app.ontoolresult = () => window.dispatchEvent(new Event('ux-planner:changed'));
  await app.sendSizeChanged({ height: Math.max(620, window.innerHeight), width: window.innerWidth });
} catch (error) { document.getElementById('root').textContent = `Conversation bridge unavailable: ${error.message}`; }
