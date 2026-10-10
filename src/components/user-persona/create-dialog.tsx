"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createPersona } from "@/actions/user-persona";
import { ActionError } from "@/components/action-error";

export function CreatePersonaDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();
  const resetOnNextOpen = useRef(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && resetOnNextOpen.current) {
      setName("");
      resetOnNextOpen.current = false;
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createPersona(name);

      if (result.success) {
        setActionError(null);
        resetOnNextOpen.current = true;
        setOpen(false);
        router.push(`/ux-planner/user-personas/${result.slug}?edit=1`);
        router.refresh();
      } else {
        setActionError(result.error);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The persona could not be created.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            className="text-ux-muted hover:bg-ux-soft/30 hover:text-ux-text h-auto shrink-0 gap-2 rounded-none border-b-2 border-transparent px-6 py-4"
          >
            <Plus className="size-5" />
            <span className="text-base font-semibold">New Persona</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent mobilePlacement="bottom-sheet" className="dev-theme font-sans md:max-w-ux-dialog md:p-8">
        <DialogHeader>
          <DialogTitle>New User Persona</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <ActionError message={actionError} />
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Alex Morgan"
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="inverse" disabled={loading}>
              {!loading ? <Plus aria-hidden="true" /> : null}
              {loading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
