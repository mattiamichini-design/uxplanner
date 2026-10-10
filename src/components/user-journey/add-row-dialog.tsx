"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";

interface AddRowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, label: string, description?: string) => Promise<boolean>;
  mode?: "add" | "edit";
  initialValues?: {
    id: string;
    label: string;
    description?: string;
  };
  onDelete?: () => Promise<boolean>;
}

export function AddRowDialog({
  open,
  onOpenChange,
  onSubmit,
  mode = "add",
  initialValues,
  onDelete,
}: AddRowDialogProps) {
  const [id, setId] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const formSeed = open
    ? `${mode}:${initialValues?.id ?? ""}:${initialValues?.label ?? ""}:${initialValues?.description ?? ""}`
    : "closed";
  const [appliedFormSeed, setAppliedFormSeed] = useState(formSeed);

  if (formSeed !== appliedFormSeed) {
    setAppliedFormSeed(formSeed);
    if (open) {
      setId(initialValues?.id ?? "");
      setLabel(initialValues?.label ?? "");
      setDescription(initialValues?.description ?? "");
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const finalId = id || label.toLowerCase().replace(/\s+/g, "-");
    const saved = await onSubmit(finalId, label, description);
    setLoading(false);
    if (!saved) return;
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    const deleted = await onDelete();
    setIsDeleting(false);
    if (!deleted) return;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobilePlacement="bottom-sheet" className="dev-theme font-sans md:max-w-ux-dialog md:p-8">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Row" : "Add Row"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="row-label">Label</Label>
            <Input
              id="row-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              placeholder="e.g. Pain Points"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="row-id">ID (Optional)</Label>
            <Input
              id="row-id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="pain-points"
              disabled={mode === "edit"}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="row-description">Subtitle (Optional)</Label>
            <Input
              id="row-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter className="flex w-full items-center justify-between sm:justify-between">
            {mode === "edit" && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading || isDeleting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="inverse" disabled={loading || isDeleting}>
                {!loading && mode === "add" ? <Plus aria-hidden="true" /> : null}
                {loading ? "Saving..." : mode === "edit" ? "Save" : "Add"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
