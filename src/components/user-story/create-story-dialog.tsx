"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { createStory } from "@/app/actions/user-story";
import { ActionError } from "@/components/action-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateStoryDialog({ categories, defaultCategory }: { categories: string[]; defaultCategory?: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const fallbackCategory = defaultCategory && categories.includes(defaultCategory) ? defaultCategory : categories[0] ?? "Activities";
  const [category, setCategory] = useState(fallbackCategory);
  const [journey, setJourney] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setCategory(fallbackCategory);
      setError(null);
    }
    setOpen(nextOpen);
  }

  function handleCreate() {
    startTransition(async () => {
      const result = await createStory(title, category, journey);
      if (!result.success) return setError(result.error);
      setError(null);
      setOpen(false);
      router.push(`/ux-planner/user-stories/${result.slug}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className="text-ux-text hover:bg-ux-selected focus-visible:ring-ux-primary focus-visible:ring-offset-ux-sidebar flex size-8 items-center justify-center rounded-ux-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" aria-label="New story">
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent mobilePlacement="bottom-sheet" className="dev-theme font-sans md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create user story document</DialogTitle>
          <DialogDescription>Create a local Markdown document with a draft acceptance outcome.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <ActionError message={error} />
          <div className="grid gap-2">
            <Label htmlFor="story-title">Title</Label>
            <Input id="story-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Session preparation" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="story-category">Category</Label>
            <Select value={category || undefined} onValueChange={setCategory}><SelectTrigger id="story-category" className="bg-ux-surface h-11 md:h-11"><SelectValue placeholder="Choose a category" /></SelectTrigger><SelectContent position="popper">{categories.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="story-journey">Journey slug <span className="text-ux-muted font-normal">(optional)</span></Label>
            <Input id="story-journey" value={journey} onChange={(event) => setJourney(event.target.value)} placeholder="e.g. activities" />
          </div>
        </div>
        <DialogFooter className="border-ux-border border-t pt-5">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button type="button" variant="inverse" onClick={handleCreate} disabled={pending || !title.trim() || !category.trim()}>{pending ? "Creating…" : "Create story"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
