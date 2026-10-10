import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import { DemoLink, DemoProvider, WindowExpand } from './demo-dialog';
import { FloatingNav } from './floating-nav';
import {
  BrowserIcon, CodeIcon, DownArrow, FlowsDial, GitHubMark, JourneysDial, Logo, LogoMark,
  PersonasDial, PlayIcon, PluginIcon, StoriesDial,
} from './icons';
import { JourneyBoard } from './journey-board';
import { authorUrl, readmeUrl, repositoryUrl } from './links';
import { navigation } from './navigation';
import { RevealController } from './reveal';

// Position in a staggered entrance; CSS turns it into a delay.
const order = (index: number) => ({ '--i': index }) as CSSProperties;

// Reveal targets stay visible when scripts never run.
const noScriptReveal = '[data-reveal],[data-reveal]>*,.dial-ring,.dial-core{opacity:1!important;transform:none!important}';

function Actions({ className, style }: { className: string; style?: CSSProperties }) {
  return (
    <div className={`actions ${className}`} style={style}>
      <a className="button button-primary" href={repositoryUrl}>
        <span className="button-github"><GitHubMark /></span>
        Clone on GitHub
      </a>
      <DemoLink className="button button-secondary">
        <PlayIcon />
        Try the demo
      </DemoLink>
    </div>
  );
}

function SectionHeading({ id, title, children, titleClass }: { id: string; title: string; children: ReactNode; titleClass?: string }) {
  return (
    <div className="section-heading" data-reveal="">
      <h2 id={id} className={titleClass} style={order(0)}>{title}</h2>
      <p style={order(1)}>{children}</p>
    </div>
  );
}

function Hero() {
  return (
    <div className="hero-wrap">
      <header className="hero">
        <nav className="nav" id="hero-nav" aria-label="Main">
          <a className="brand" href="#top" aria-label="UX Planner home">
            <Logo />
          </a>
          <ul className="nav-links">
            {navigation.map(item => <li key={item.href}><a href={item.href}>{item.label}</a></li>)}
          </ul>
          <div className="nav-action">
            <a className="pill" href={repositoryUrl}>
              <GitHubMark />
              <span className="pill-wide">Clone on GitHub</span>
              <span className="pill-narrow">GitHub</span>
            </a>
          </div>
        </nav>
        <div className="hero-copy">
          <h1>Plan the user experience in the same repo as the code.</h1>
          <p>
            UX Planner is a local app that reads your personas, journeys, flows and stories from Markdown and JSON files in your
            project. Edit a journey on the board and the file changes with it.
          </p>
          <Actions className="hero-actions" />
        </div>
        <figure className="window">
          <div className="window-bar">
            <span className="window-lights"><i aria-hidden="true" /><i aria-hidden="true" /><WindowExpand /></span>
            <span className="window-title" aria-hidden="true">UX Planner</span>
          </div>
          <Image
            className="window-shot"
            src="/brand/journey-board.webp"
            width={2396}
            height={1368}
            priority
            alt="The Getting started journey in UX Planner: phases as columns, with user actions, goals and pain points as rows of cards."
          />
        </figure>
      </header>
    </div>
  );
}

const documents = [
  {
    kind: 'Personas', format: '.md', art: <PersonasDial />, question: 'Who are we designing for?',
    body: 'Goals, needs and context for each person, in Markdown. Edit them in the app or in your editor.', path: 'personas/*.md',
  },
  {
    kind: 'Journeys', format: '.json', art: <JourneysDial />, question: 'Where does it break?',
    body: 'A board for each persona, with phases as columns and every card marked positive, neutral or negative.', path: 'user-journeys/<journey>/*.json',
  },
  {
    kind: 'Flows', format: '.md + Mermaid', art: <FlowsDial />, question: 'What happens, step by step?',
    body: 'The path through a feature as a Mermaid diagram, with the reasoning written underneath.', path: 'user-flows/<flow>/*.md',
  },
  {
    kind: 'Stories', format: '.story.md', art: <StoriesDial />, question: 'What do we build next?',
    body: 'User stories with acceptance criteria, written from the risks and opportunities on the board.', path: 'user-stories/*.story.md',
  },
];

function Files() {
  return (
    <section className="section section-files" aria-labelledby="files">
      <div className="panel">
        <SectionHeading id="files" title="Everything lives in one folder of your repo." titleClass="measure-600">
          Four kinds of document, each a plain file in docs/ux. Open them in any editor and review them in a pull request.
        </SectionHeading>
        <ul className="documents">
          {documents.map((doc, index) => (
            <li className="document" key={doc.kind} data-reveal="" style={order(index)}>
              <div className="document-head">
                <h3>{doc.kind}</h3>
                <span className="mono">{doc.format}</span>
              </div>
              {doc.art}
              <div className="document-copy">
                <p className="document-question">{doc.question}</p>
                <p className="document-body">{doc.body}</p>
              </div>
              <code className="document-path">{doc.path}</code>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Journeys() {
  return (
    <section className="section section-journeys" aria-labelledby="journeys">
      <div className="panel">
        <SectionHeading id="journeys" title="Zoom into one phase of a journey." titleClass="measure-480">
          Each column is a phase. Each row is what the person does, wants, risks and what you could build. Switch persona to compare the
          same phase.
        </SectionHeading>
        <JourneyBoard />
      </div>
    </section>
  );
}

const planned = ['Landing with the price', 'Create account', 'Choose a plan', 'Pay'];
const built = [
  { title: 'Landing shows the monthly price', file: 'example/landing.tsx', thumb: 'landing' },
  { title: 'Account form', file: 'example/sign-up/form.tsx', thumb: 'form' },
  { title: 'Plan picker', file: 'example/sign-up/plans.tsx', thumb: 'plans' },
  { title: 'Pay screen, same price as step 1', file: 'example/sign-up/pay.tsx', thumb: 'pay' },
];

function Thumb({ kind }: { kind: string }) {
  if (kind === 'plans') return <span className="thumb thumb-plans" aria-hidden="true"><i /><i /></span>;
  return <span className={`thumb thumb-${kind}`} aria-hidden="true"><i /><i /><i /></span>;
}

function Agents() {
  return (
    <section className="section section-agents" aria-labelledby="agents">
      <SectionHeading id="agents" title="Ask for a flow, get the one you planned.">
        Your coding agent reads the flow and the story from docs/ux, then builds those steps in that order, against the criteria in the
        story.
      </SectionHeading>
      <div className="compare" data-reveal="">
        <div className="compare-side compare-planned">
          <div className="compare-head">
            <h3>What you planned</h3>
            <span>Flow · Sign-up</span>
          </div>
          <ol className="planned-steps">
            {planned.map((step, index) => (
              <li key={step} style={order(index)}>
                {index > 0 && <span className="step-arrow"><DownArrow /></span>}
                <span className="step-number" aria-hidden="true">{index + 1}</span>
                <span className="step-box">{step}</span>
              </li>
            ))}
          </ol>
          <div className="criteria">
            <p className="criteria-title">Story · As a new user, I want to see the price before I sign up</p>
            <ul>
              <li><span className="criterion-key">A</span>The price is visible on the landing step</li>
              <li><span className="criterion-key">B</span>The pay screen shows the same price</li>
            </ul>
          </div>
        </div>
        <ol className="compare-match" aria-hidden="true">
          {planned.map((step, index) => <li key={step} style={order(index)}><span>{index + 1}</span></li>)}
        </ol>
        <div className="compare-side compare-built">
          <div className="compare-head">
            <h3>What your agent built</h3>
            <span>Pull request #42</span>
          </div>
          <ol className="built-steps">
            {built.map((item, index) => (
              <li key={item.file} style={order(index)}>
                <span className="step-number" aria-hidden="true">{index + 1}</span>
                <Thumb kind={item.thumb} />
                <span className="built-copy">
                  <span>{item.title}</span>
                  <code>{item.file}</code>
                </span>
              </li>
            ))}
          </ol>
          <div className="criteria criteria-tests">
            <p className="criteria-title">Tests your agent can write from the criteria</p>
            <ul>
              <li style={order(0)}><span className="criterion-key">A</span><span className="criterion-text">Shows the price on landing</span><span className="criterion-status">Passing</span></li>
              <li style={order(1)}><span className="criterion-key">B</span><span className="criterion-text"><span className="copy-long">Pay screen price matches landing</span><span className="copy-short">Pay price matches landing</span></span><span className="criterion-status">Passing</span></li>
            </ul>
          </div>
        </div>
      </div>
      <p className="import-line" data-reveal="">
        <span className="tag">Import</span>
        <span>If your team already mapped a journey in a spreadsheet, import it as CSV. Export it back whenever someone needs the sheet.</span>
      </p>
    </section>
  );
}

const commands = [
  'git clone https://github.com/mattiamichini-design/uxplanner.git',
  'cd uxplanner && npm ci && npm run build',
  'node bin/ux-planner.mjs init --root ../your-project',
  'node bin/ux-planner.mjs start --root ../your-project --port 4311',
];

// Each command types out after the previous one, then the output appears.
const typeSpeed = 7;
const linePause = 160;
const typing = commands.reduce<{ start: number; duration: number }[]>((lines, line) => {
  const previous = lines.at(-1);
  const start = previous ? previous.start + previous.duration + linePause : 0;
  return [...lines, { start, duration: (line.length + 2) * typeSpeed }];
}, []);
const outputStart = typing.at(-1)!.start + typing.at(-1)!.duration + linePause;
const outputStagger = 120;

const output = [
  'Planning folders ready: /path/to/your-project/docs/ux',
  'UX Planner: http://127.0.0.1:4311/ux-planner',
  'Workspace: /path/to/your-project',
];

const surfaces = [
  {
    title: 'In your browser', icon: <BrowserIcon />, address: '127.0.0.1:4311/ux-planner',
    body: 'Edit journeys and personas on the board, and read your flows and stories.',
  },
  { title: 'Inside your AI client', icon: <PluginIcon />, body: 'A local MCP server opens the same app in clients that support MCP Apps, so there’s nothing to deploy.' },
  {
    title: 'With any coding agent', icon: <CodeIcon />,
    body: 'The bundled skill explains the file format, so your agent can write flows and stories in the same folder.',
  },
];

function Local() {
  return (
    <section className="section section-local" aria-labelledby="local">
      <div className="local-inner">
        <SectionHeading id="local" title="Run it locally, then open it where you work.">
          Clone the repo, build it once and point it at a project you already have. The server only listens on 127.0.0.1 and you
          don&apos;t need an account.
        </SectionHeading>
        <div className="local-row">
          <figure className="terminal" data-reveal="">
            <div className="terminal-bar">
              <span className="terminal-lights" aria-hidden="true"><i /><i /><i /></span>
              <figcaption className="mono">~/code — zsh</figcaption>
              <span className="terminal-spacer" aria-hidden="true" />
            </div>
            <div className="terminal-body" tabIndex={0} role="region" aria-label="Install and start commands">
              <pre className="terminal-commands">
                <code>
                  {commands.map((line, index) => (
                    <span
                      className="terminal-line"
                      key={line}
                      style={{ '--chars': line.length + 2, '--start': `${typing[index].start}ms`, '--duration': `${typing[index].duration}ms` } as CSSProperties}
                    >
                      $ {line}
                    </span>
                  ))}
                </code>
              </pre>
              <pre className="terminal-output">
                <samp>
                  {output.map((line, index) => (
                    <span className="terminal-line" key={line} style={{ '--start': `${outputStart + index * outputStagger}ms` } as CSSProperties}>{line}</span>
                  ))}
                </samp>
              </pre>
            </div>
            <div className="terminal-foot mono">
              <span>docs/ux/</span>
              <span>personas · user-journeys · <br className="mobile-break" />user-flows · user-stories</span>
            </div>
          </figure>
          <ul className="surfaces">
            {surfaces.map((surface, index) => (
              <li key={surface.title} data-reveal="" style={order(index)}>
                <span className="surface-icon">{surface.icon}</span>
                <div className="surface-copy">
                  <h3>{surface.title}</h3>
                  <p>{surface.body}</p>
                  {surface.address && <code>{surface.address}</code>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FinalCall() {
  return (
    <section className="final-wrap" aria-labelledby="start">
      <div className="final" data-reveal="">
        <span className="final-mark" style={order(0)}><LogoMark /></span>
        <h2 id="start" style={order(1)}>Start planning in your own repo.</h2>
        <p style={order(2)}>
          Clone UX Planner, point it at your project and start with the journey you’re working on. The files stay in docs/ux, next to the
          code.
        </p>
        <Actions className="final-actions" style={order(3)} />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <span className="footer-logo" role="img" aria-label="UX Planner"><Logo /></span>
        <span>A local app for personas, journeys, flows and stories.</span>
      </div>
      <ul className="footer-links">
        <li><a href={repositoryUrl}>GitHub</a></li>
        <li><a href={readmeUrl}>README</a></li>
        <li><a href={authorUrl} target="_blank" rel="noopener">Made by Mattia</a></li>
      </ul>
    </footer>
  );
}

export function Landing() {
  return (
    <DemoProvider>
      <noscript><style>{noScriptReveal}</style></noscript>
      <div className="page" id="top">
        <FloatingNav />
        <Hero />
        <main>
          <Files />
          <Journeys />
          <Agents />
          <Local />
          <FinalCall />
        </main>
        <Footer />
      </div>
      <RevealController />
    </DemoProvider>
  );
}
