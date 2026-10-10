"use client";

import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function StorySwitcher({
  currentSlug,
  stories,
}: {
  currentSlug: string;
  stories: { slug: string; title: string }[];
}) {
  const router = useRouter();
  return (
    <Select value={currentSlug} onValueChange={(slug) => router.push(`/ux-planner/user-stories/${slug}`)}>
      <SelectTrigger className="h-9 w-auto min-w-48 max-w-[min(24rem,50vw)] !rounded-lg bg-ux-surface shadow-none" aria-label="Cambia user story">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {stories.map((story) => (
          <SelectItem key={story.slug} value={story.slug}>{story.title}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
