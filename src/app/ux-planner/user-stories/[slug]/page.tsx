import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { MarkdownDisplay } from "@/components/ui/markdown-display";
import { CreateStoryDialog } from "@/components/user-story/create-story-dialog";
import { StudioSidebar, StudioSidebarLabel, StudioSidebarLink, StudioSidebarToggle, StudioWorkspace } from "@/components/ux-planner/studio-shell";
import { getAllStories, getStoryBySlug } from "@/lib/stories/registry";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const story = getStoryBySlug((await params).slug);
  return story ? { title: story.title } : { title: "Story not found" };
}

export default async function UserStoryPage({ params }: Props) {
  const story = getStoryBySlug((await params).slug);
  if (!story) notFound();
  const stories = getAllStories();

  const categories = [...new Set(stories.map((item) => item.category))];
  const storyIndex = stories.findIndex((item) => item.slug === story.slug);
  const nextStory = stories[(storyIndex + 1) % stories.length];

  return (
    <StudioWorkspace
      section="Stories"
      current={story.title}
      sidebar={
        <StudioSidebar title="Stories" action={<CreateStoryDialog categories={categories} defaultCategory={story.category} />}>
          <StudioSidebarLink href="/ux-planner/user-stories" label="All stories" iconName="ArrowLeft" />
          {categories.map((category) => (
            <div key={category} className="grid shrink-0 gap-1">
              <StudioSidebarLabel>{category}</StudioSidebarLabel>
              {stories.filter((item) => item.category === category).map((item) => (
                <StudioSidebarLink key={item.slug} href={`/ux-planner/user-stories/${item.slug}`} active={item.slug === story.slug} label={item.title} />
              ))}
            </div>
          ))}
        </StudioSidebar>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
      <header className="border-ux-border flex shrink-0 min-h-16 items-center gap-2 border-b px-4 text-sm md:h-ux-header md:px-6">
        <Link href="/ux-planner/user-stories" aria-label="Back to all stories" className="focus-visible:ring-ux-primary flex size-11 shrink-0 items-center justify-center rounded-ux-control focus-visible:outline-none focus-visible:ring-2 md:hidden"><ArrowLeft className="size-5" /></Link>
        <StudioSidebarToggle className="me-3 max-w-52" />
        <span className="truncate font-medium ux-wide:hidden">{story.title}</span>
        <span className="text-ux-muted hidden ux-wide:inline">{story.category}</span><span className="text-ux-muted hidden px-2 ux-wide:inline">/</span><span className="hidden truncate font-medium ux-wide:inline">{story.title}</span>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-7">
        <article className="bg-ux-surface mx-auto grid w-full max-w-ux-story gap-6">
          <header className="border-ux-border grid gap-2 border-b pb-5">
            <h1 className="text-2xl font-semibold tracking-tight">{story.title}</h1>
            <p className="text-ux-muted font-mono text-xs">{story.sourcePath}</p>
          </header>
          <MarkdownDisplay content={story.content} />
          {nextStory ? <footer className="border-ux-border flex justify-end border-t pt-5"><Link href={`/ux-planner/user-stories/${nextStory.slug}`} className="border-ux-border focus-visible:ring-ux-primary flex min-h-11 items-center gap-2 rounded-ux-control border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"><span className="max-w-52 truncate">Next: {nextStory.title}</span><ArrowRight className="size-4" /></Link></footer> : null}
        </article>
      </main>
      </div>
    </StudioWorkspace>
  );
}
