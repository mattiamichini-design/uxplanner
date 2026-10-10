"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { StudioSidebar, StudioSidebarButton, StudioSidebarToggle, StudioWorkspace } from "@/components/ux-planner/studio-shell";
import { CreateStoryDialog } from "./create-story-dialog";

type Story = {
  slug: string;
  title: string;
  sourcePath: string;
  category: string;
};

export function StoryCategoryFilter({ stories }: { stories: Story[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const categories = [...new Set(stories.map((story) => story.category))];
  const categoryStories = category === null ? stories : stories.filter((story) => story.category === category);
  const visibleStories = query.trim()
    ? categoryStories.filter((story) => `${story.title} ${story.category}`.toLowerCase().includes(query.trim().toLowerCase()))
    : categoryStories;

  return (
    <StudioWorkspace
      section="Stories"
      current={category ?? "All stories"}
      sidebar={
        <StudioSidebar title="Stories" label="Filter user stories by category" action={<CreateStoryDialog categories={categories} defaultCategory={category ?? undefined} />}>
          <StudioSidebarButton active={category === null} onClick={() => setCategory(null)} label="All stories" iconName="FileText" count={stories.length} />
          {categories.map((option) => (
            <StudioSidebarButton key={option} active={category === option} onClick={() => setCategory(option)} label={option} iconName="Folder" count={stories.filter((story) => story.category === option).length} />
          ))}
        </StudioSidebar>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
      <header className="border-ux-border flex shrink-0 min-h-16 items-center justify-between gap-3 border-b px-4 md:h-ux-header md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <StudioSidebarToggle className="max-w-52" />
          <h1 className="hidden truncate text-lg font-semibold ux-wide:block">{category ?? "All stories"}</h1>
        </div>
        <p className="text-ux-muted hidden text-xs sm:block">{visibleStories.length} stories · {categories.length} categories</p>
      </header>
      <main className="grid flex-1 min-h-0 content-start gap-3 overflow-y-auto p-3 md:p-6">
      <label className="relative block md:max-w-sm"><span className="sr-only">Search stories</span><Search className="text-ux-muted absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden="true"/><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories…" className="border-ux-input focus-visible:ring-ux-primary h-11 w-full rounded-ux-control border bg-ux-surface pl-10 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2" /></label>
      <div className="border-ux-border divide-ux-border bg-ux-surface divide-y overflow-hidden rounded-ux-panel border">
        {visibleStories.map((story) => (
          <Link key={story.slug} href={`/ux-planner/user-stories/${story.slug}`} className="hover:bg-ux-soft/60 focus-visible:ring-ux-primary focus-visible:ring-offset-ux-surface flex min-h-ux-toolbar items-center justify-between gap-3 px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset md:gap-6 md:px-5 md:py-4">
            <span className="min-w-0">
              <span className="block truncate font-medium">{story.title}</span>
              <span className="text-ux-muted flex min-w-0 items-center gap-2 pt-1 text-xs">
                <span className="bg-ux-soft text-ux-muted shrink-0 rounded px-1.5 py-0.5 font-medium">{story.category}</span>
                <span className="hidden truncate font-mono md:inline">{story.sourcePath}</span>
              </span>
            </span>
            <span className="border-ux-border bg-ux-surface flex size-11 shrink-0 items-center justify-center rounded-ux-badge border text-xs font-medium md:h-9 md:w-auto md:gap-2 md:px-3">
              <span className="hidden md:inline">Open story</span> <ChevronRight className="size-4" aria-hidden="true" />
            </span>
          </Link>
        ))}
        {visibleStories.length === 0 ? <p className="text-ux-muted p-6 text-center text-sm">No stories match this search.</p> : null}
      </div>
      </main>
      </div>
    </StudioWorkspace>
  );
}
