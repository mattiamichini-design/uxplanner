import React from 'react';
import { Button } from '../src/components/ui/button';

export default function WorkspaceSelector({ context, busy, error, onRefresh, onOpen }) {
  const repository = context?.mode === 'repository';
  // A repository panel never substitutes the global registry for its pinned root.
  const projects = (context?.projects || []).filter(project => (!repository || (project.registered && project.root === context.root)));
  const message = error || context?.error;
  return (
    <main className="dev-theme bg-ux-canvas text-ux-text min-h-screen p-4" aria-busy={busy}>
      <section className="border-ux-border bg-ux-surface rounded-ux-panel border" style={{ maxWidth: 832, margin: '0 auto', overflow: 'hidden' }} aria-labelledby="workspace-title">
        <header className="border-ux-border bg-ux-sidebar border-b p-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'calc(var(--spacing) * 4)' }}>
          <div className="min-w-0">
            <p className="text-ux-muted text-xs">UX Planner</p>
            <h1 id="workspace-title" className="text-lg font-semibold">{repository ? 'Repository workspace' : 'Open a project'}</h1>
          </div>
          <Button variant="outline" size="sm" disabled={busy} onClick={onRefresh}>Refresh</Button>
        </header>
        <div className="p-6" style={{ display: 'grid', gap: 'calc(var(--spacing) * 5)' }}>
          <p className="text-ux-muted text-sm">{repository ? 'This panel uses the repository attached to this conversation.' : 'Choose a registered project to load its planning documents.'}</p>
          {repository && context.root && <code className="text-ux-muted text-xs" style={{ fontFamily: 'var(--font-family-mono)', overflowWrap: 'anywhere' }}>{context.root}</code>}
          {message && <p role="alert" className="text-ux-danger text-sm">{message}</p>}
          {busy && <p role="status" className="text-ux-muted text-sm">Loading workspace…</p>}
          {context && !projects.length && !message && <p className="text-ux-muted text-sm">{repository ? 'UX Planner is not registered in this repository.' : 'No registered projects. Run ux-planner init in a repository, then refresh.'}</p>}
          {repository && !projects.length && context.startCommand && <div className="bg-ux-sidebar rounded-ux-control p-3" style={{ display: 'grid', gap: 'calc(var(--spacing) * 2)' }}>
            <p className="text-ux-muted text-xs">Run ux-planner init in this repository, start it with this command, then refresh.</p>
            <code className="text-xs" style={{ fontFamily: 'var(--font-family-mono)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{context.startCommand}</code>
          </div>}
          <ul style={{ display: 'grid', gap: 'calc(var(--spacing) * 3)', listStyle: 'none', margin: 0, padding: 0 }}>
            {projects.map(project => (
              <li key={project.id} className="border-ux-border rounded-ux-control border p-4" style={{ display: 'grid', gap: 'calc(var(--spacing) * 3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'calc(var(--spacing) * 3)' }}>
                  <h2 className="text-sm font-semibold">{project.name}</h2>
                  <span className="text-ux-muted text-xs">{project.running ? 'Running' : 'Stopped'}</span>
                </div>
                <code className="text-ux-muted text-xs" style={{ fontFamily: 'var(--font-family-mono)', overflowWrap: 'anywhere' }}>{project.root}</code>
                {project.error && <p className="text-ux-danger text-sm">{project.error}</p>}
                {!project.running && project.startCommand && <div className="bg-ux-sidebar rounded-ux-control p-3" style={{ display: 'grid', gap: 'calc(var(--spacing) * 2)' }}>
                  <p className="text-ux-muted text-xs">Start this workspace in a terminal, then refresh.</p>
                  <code className="text-xs" style={{ fontFamily: 'var(--font-family-mono)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{project.startCommand}</code>
                </div>}
                {project.running && <div><Button size="sm" disabled={busy || Boolean(context?.error)} aria-label={`Open ${project.name}`} onClick={() => onOpen(project)}>Open</Button></div>}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
