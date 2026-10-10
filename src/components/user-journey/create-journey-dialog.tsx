"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createNewJourney } from "@/app/actions/user-journey";
import type { Persona } from "@/lib/user-journey/types";
import { Plus } from "lucide-react";
import { AVAILABLE_ICONS } from "./available-journey-icons";
import { JourneyIconPicker, JourneyPersonaPicker } from "./journey-form-controls";
import { ActionError } from "@/components/action-error";

type CreateJourneyDialogProps = {
  availablePersonas: Persona[];
  children?: React.ReactNode;
};

export { AVAILABLE_ICONS };

export function CreateJourneyDialog({ availablePersonas, children }: CreateJourneyDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState("Map");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();
  const resetOnNextOpen = useRef(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && resetOnNextOpen.current) {
      setTitle("");
      setSubtitle("");
      setSelectedPersonas([]);
      setSelectedIcon("Map");
      resetOnNextOpen.current = false;
    }
    setOpen(nextOpen);
  };

  const handleCreate = () => {
    if (!title || selectedPersonas.length === 0) return;

    startTransition(async () => {
      try {
        const result = await createNewJourney(title, subtitle, selectedPersonas, selectedIcon);
        if (!result.success) {
          setActionError(result.error);
          return;
        }
        setActionError(null);
        resetOnNextOpen.current = true;
        setOpen(false);
        router.push(`/ux-planner/user-journeys/${result.slug}`);
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "The journey could not be created.");
      }
    });
  };

  const togglePersona = (slug: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug],
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button
            variant="ghost"
            className="text-ux-muted hover:bg-ux-soft/30 hover:text-ux-text h-auto shrink-0 gap-2 rounded-none border-b-2 border-transparent px-6 py-4"
          >
            <Plus className="size-5" />
            <span className="text-base font-semibold">New Journey</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent mobilePlacement="bottom-sheet" className="dev-theme font-sans md:max-w-ux-dialog-wide md:p-8">
        <DialogHeader>
          <DialogTitle>Create New User Journey</DialogTitle>
          <DialogDescription>
            Enter the title, an optional subtitle, select an icon, and choose user personas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-2">
          <ActionError message={actionError} />
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Order Management"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subtitle">Subtitle (optional)</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Purchase and checkout flow"
            />
          </div>

          <div className="grid gap-2">
            <Label>Icon</Label>
            <JourneyIconPicker selectedIcon={selectedIcon} onSelect={setSelectedIcon} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-4">
              <Label>Select personas</Label>
              <span className="text-ux-muted text-xs">{selectedPersonas.length} selected</span>
            </div>
            <JourneyPersonaPicker personas={availablePersonas} selectedPersonas={selectedPersonas} onToggle={togglePersona} />
          </div>
        </div>
        <DialogFooter className="border-ux-border border-t pt-6">
          <Button type="button" variant="outline" shape={null} onClick={() => setOpen(false)} disabled={isPending} className="h-11 rounded-ux-button">Cancel</Button>
          <Button
            type="submit"
            variant="inverse"
            shape={null}
            onClick={handleCreate}
            disabled={isPending || !title || selectedPersonas.length === 0}
            className="h-11 rounded-ux-button"
          >
            {isPending ? "Creating..." : "Create Journey"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
