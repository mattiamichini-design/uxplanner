'use client';
'use no memo';

// The routes read the in-browser workspace (an external store) while rendering; the React Compiler must not
// memoize those reads by their arguments, or edits would not show until the next navigation.

import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import Link from '@site/demo/shims/next-link';
import { demoPersistenceNote } from '@site/demo/embed';
import { Button } from '@/components/ui/button';
import { MarkdownDisplay } from '@/components/ui/markdown-display';
import { FlowViewer } from '@/components/user-flow/flow-viewer';
import { CreateJourneyDialog } from '@/components/user-journey/create-journey-dialog';
import { JourneyPageContent } from '@/components/user-journey/journey-page-content';
import { CreatePersonaDialog } from '@/components/user-persona/create-dialog';
import { PersonaDetail } from '@/components/user-persona/persona-detail';
import { CreateStoryDialog } from '@/components/user-story/create-story-dialog';
import { StoryCategoryFilter } from '@/components/user-story/story-category-filter';
import {
  StudioSidebar,
  StudioSidebarLabel,
  StudioSidebarLink,
  StudioSidebarToggle,
  StudioWorkspace,
} from '@/components/ux-planner/studio-shell';
import { personaInitials } from '@/lib/personas/initials';
import { getAllPersonas as getAllPersonaDocuments, getPersonaBySlug } from '@/lib/personas/registry';
import { parseJourneyData } from '@/lib/server/user-journey-payload';
import { readJSON } from '@/lib/server/workspace.mjs';
import { getAllStories, getStoryBySlug } from '@/lib/stories/registry';
import { getAllFlowTypes, getFlowsByType, getFlowTypeBySlug } from '@/lib/user-flow/registry';
import {
  getAllJourneyTypes,
  getAllPersonas,
  getJourneyTypeBySlug,
  getJourneysByType,
} from '@/lib/user-journey/registry';

// Client-side counterparts of src/app/ux-planner/**/page.tsx. Same product components and registries; only the
// server-only parts (params, redirect, notFound, async loading) are replaced by the demo's virtual location.

export type DemoRoute = { pathname: string; params: URLSearchParams };

function DemoNote() {
  return (
    <p className="demo-note" role="note">
      <strong>Demo workspace</strong>
      <span>{demoPersistenceNote} Nothing is written to disk.</span>
    </p>
  );
}

function Message({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="grid w-full gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </main>
  );
}

function NotFoundMessage({ what }: { what: string }) {
  return (
    <Message title={`${what} not found`}>
      <p className="text-muted-foreground">It may have been deleted in this demo session.</p>
      <div>
        <Button asChild><Link href="/ux-planner/user-journeys">Back to journeys</Link></Button>
      </div>
    </Message>
  );
}

/** Where a section root or a missing selection lands, mirroring the product's redirects. */
export function redirectFor({ pathname }: DemoRoute): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'ux-planner') return null;
  if (segments.length === 1) return '/ux-planner/user-journeys';
  if (segments.length > 2) return null;
  if (segments[1] === 'user-journeys') { const first = getAllJourneyTypes()[0]; return first ? `/ux-planner/user-journeys/${first.slug}` : null; }
  if (segments[1] === 'user-personas') { const first = getAllPersonaDocuments()[0]; return first ? `/ux-planner/user-personas/${first.slug}` : null; }
  if (segments[1] === 'user-flows') { const first = getAllFlowTypes()[0]; return first ? `/ux-planner/user-flows/${first.slug}` : null; }
  return null;
}

function JourneysRoute({ slug, params }: { slug: string; params: URLSearchParams }) {
  const journeyType = getJourneyTypeBySlug(slug);
  const journeysForType = journeyType ? getJourneysByType(slug) : [];
  if (!journeyType || journeysForType.length === 0) return <NotFoundMessage what="Journey" />;

  const allPersonas = getAllPersonas();
  const journeyPersonaSlugs = new Set(journeysForType.map(journey => journey.personaSlug));
  const availablePersonas = allPersonas.filter(persona => journeyPersonaSlugs.has(persona.slug));

  const compareMode = params.get('compare') === 'true';
  const personasParam = params.get('personas');
  const persona = params.get('persona');
  const requested = compareMode && personasParam
    ? personasParam.split(',')
    : persona ? [persona] : [availablePersonas[0]?.slug ?? journeysForType[0].personaSlug];
  const selectedPersonaSlugs = Array.from(new Set(requested.filter(candidate => journeyPersonaSlugs.has(candidate))));
  if (selectedPersonaSlugs.length === 0) selectedPersonaSlugs.push(availablePersonas[0]?.slug ?? journeysForType[0].personaSlug);

  const journeys = selectedPersonaSlugs.map(personaSlug => parseJourneyData(readJSON('user-journeys', slug, `${personaSlug}.json`)));

  return (
    <StudioWorkspace
      section="Journeys"
      current={journeyType.title}
      sidebar={
        <StudioSidebar
          title="Journeys"
          action={
            <CreateJourneyDialog availablePersonas={allPersonas}>
              <Button variant="ghost" size="icon" className="size-8 rounded-ux-control" aria-label="New Journey">
                <Plus className="size-4" aria-hidden="true" />
              </Button>
            </CreateJourneyDialog>
          }
        >
          {getAllJourneyTypes().map(type => (
            <StudioSidebarLink key={type.slug} href={`/ux-planner/user-journeys/${type.slug}`} active={type.slug === slug} label={type.title} iconName={type.icon || 'Map'} />
          ))}
          <DemoNote />
        </StudioSidebar>
      }
    >
      <JourneyPageContent
        journeyType={journeyType}
        availablePersonas={availablePersonas}
        currentPersonaSlug={!compareMode ? selectedPersonaSlugs[0] : undefined}
        journeys={journeys}
        compareMode={compareMode}
        selectedPersonas={selectedPersonaSlugs}
        allPersonas={allPersonas}
      />
    </StudioWorkspace>
  );
}

function PersonaRoute({ slug, params }: { slug: string; params: URLSearchParams }) {
  const persona = getPersonaBySlug(slug);
  if (!persona) return <NotFoundMessage what="Persona" />;
  return (
    <StudioWorkspace
      section="Personas"
      current={persona.name}
      sidebar={
        <StudioSidebar
          title="Personas"
          action={
            <CreatePersonaDialog>
              <Button variant="ghost" size="icon" className="size-8 rounded-ux-control" aria-label="New Persona">
                <Plus className="size-4" aria-hidden="true" />
              </Button>
            </CreatePersonaDialog>
          }
        >
          {getAllPersonaDocuments().map(item => (
            <StudioSidebarLink key={item.slug} href={`/ux-planner/user-personas/${item.slug}`} active={item.slug === slug} label={item.name} badge={personaInitials(item.name)} />
          ))}
          <DemoNote />
        </StudioSidebar>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="border-ux-border hidden h-ux-header shrink-0 items-center gap-3 border-b px-6 md:flex">
          <StudioSidebarToggle className="max-w-52" />
          <h1 className="hidden truncate text-base font-semibold ux-wide:block">{persona.name}</h1>
        </header>
        <div className="min-h-0 w-full flex-1">
          <PersonaDetail key={`${slug}:${persona.updated ?? ''}`} persona={persona} initialEditing={params.get('edit') === '1'} />
        </div>
      </div>
    </StudioWorkspace>
  );
}

function FlowRoute({ slug, params }: { slug: string; params: URLSearchParams }) {
  const flowType = getFlowTypeBySlug(slug);
  const allFlows = flowType ? getFlowsByType(slug) : [];
  if (!flowType || allFlows.length === 0) return <NotFoundMessage what="Flow" />;
  const persona = params.get('persona');
  const currentFlow = persona ? (allFlows.find(flow => flow.slug === persona) ?? allFlows[0]) : allFlows[0];
  return (
    <StudioWorkspace
      section="Flows"
      current={flowType.title}
      sidebar={
        <StudioSidebar title="Flows">
          {getAllFlowTypes().map(type => (
            <StudioSidebarLink key={type.slug} href={`/ux-planner/user-flows/${type.slug}`} active={type.slug === slug} label={type.title} iconName={type.icon || 'Map'} />
          ))}
          <DemoNote />
        </StudioSidebar>
      }
    >
      <FlowViewer slug={slug} flowType={flowType} allFlows={allFlows} currentFlow={currentFlow} allPersonas={getAllPersonas()} />
    </StudioWorkspace>
  );
}

function StoriesRoute() {
  const stories = getAllStories();
  if (stories.length === 0) return <main className="p-6 text-sm text-muted-foreground">No user stories found in this project.</main>;
  return <StoryCategoryFilter stories={stories.map(({ slug, title, sourcePath, category }) => ({ slug, title, sourcePath, category }))} />;
}

function StoryRoute({ slug }: { slug: string }) {
  const story = getStoryBySlug(slug);
  if (!story) return <NotFoundMessage what="Story" />;
  const stories = getAllStories();
  const categories = [...new Set(stories.map(item => item.category))];
  const nextStory = stories[(stories.findIndex(item => item.slug === story.slug) + 1) % stories.length];

  return (
    <StudioWorkspace
      section="Stories"
      current={story.title}
      sidebar={
        <StudioSidebar title="Stories" action={<CreateStoryDialog categories={categories} defaultCategory={story.category} />}>
          <StudioSidebarLink href="/ux-planner/user-stories" label="All stories" iconName="ArrowLeft" />
          {categories.map(category => (
            <div key={category} className="grid shrink-0 gap-1">
              <StudioSidebarLabel>{category}</StudioSidebarLabel>
              {stories.filter(item => item.category === category).map(item => (
                <StudioSidebarLink key={item.slug} href={`/ux-planner/user-stories/${item.slug}`} active={item.slug === story.slug} label={item.title} />
              ))}
            </div>
          ))}
          <DemoNote />
        </StudioSidebar>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="border-ux-border flex min-h-16 shrink-0 items-center gap-2 border-b px-4 text-sm md:h-ux-header md:px-6">
          <Link href="/ux-planner/user-stories" aria-label="Back to all stories" className="focus-visible:ring-ux-primary flex size-11 shrink-0 items-center justify-center rounded-ux-control focus-visible:outline-none focus-visible:ring-2 md:hidden"><ArrowLeft className="size-5" /></Link>
          <StudioSidebarToggle className="me-3 max-w-52" />
          <span className="truncate font-medium ux-wide:hidden">{story.title}</span>
          <span className="text-ux-muted hidden ux-wide:inline">{story.category}</span><span className="text-ux-muted hidden px-2 ux-wide:inline">/</span><span className="hidden truncate font-medium ux-wide:inline">{story.title}</span>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-7">
          <article className="bg-ux-surface mx-auto grid w-full max-w-ux-story gap-6">
            <header className="border-ux-border grid gap-2 border-b pb-5">
              <h1 className="text-2xl font-semibold tracking-tight">{story.title}</h1>
              <p className="text-muted-foreground font-mono text-xs">{story.sourcePath}</p>
            </header>
            <MarkdownDisplay content={story.content} />
            {nextStory ? <footer className="border-ux-border flex justify-end border-t pt-5"><Link href={`/ux-planner/user-stories/${nextStory.slug}`} className="border-ux-border focus-visible:ring-ux-primary flex min-h-11 items-center gap-2 rounded-ux-control border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"><span className="max-w-52 truncate">Next: {nextStory.title}</span><ArrowRight className="size-4" /></Link></footer> : null}
          </article>
        </main>
      </div>
    </StudioWorkspace>
  );
}

export function DemoPage({ route }: { route: DemoRoute }) {
  const segments = route.pathname.split('/').filter(Boolean);
  const [, section, slug] = segments;
  if (segments[0] !== 'ux-planner') return <NotFoundMessage what="Page" />;
  const id = slug ? decodeURIComponent(slug) : undefined;
  if (section === 'user-journeys' && id) return <JourneysRoute slug={id} params={route.params} />;
  if (section === 'user-personas' && id) return <PersonaRoute slug={id} params={route.params} />;
  if (section === 'user-flows' && id) return <FlowRoute slug={id} params={route.params} />;
  if (section === 'user-stories') return id ? <StoryRoute slug={id} /> : <StoriesRoute />;
  return <Message title="Nothing here yet"><p className="text-muted-foreground">This demo workspace has no items in this section.</p></Message>;
}
