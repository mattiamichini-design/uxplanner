"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useEffect, useReducer, useState } from "react";
import type { FormEvent } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Label } from "@radix-ui/react-label";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type JourneyItemEmphasis = "positive" | "neutral" | "negative";

const emphasisOptions = [
  "positive",
  "neutral",
  "negative",
] as const satisfies readonly JourneyItemEmphasis[];

function parseEmphasis(value: string): JourneyItemEmphasis | undefined {
  return emphasisOptions.find((option) => option === value);
}

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (text: string, emoji?: string, emphasis?: JourneyItemEmphasis) => Promise<boolean>;
  mode?: "add" | "edit";
  initialValues?: {
    text: string;
    emphasis?: JourneyItemEmphasis;
  };
  onDelete?: () => Promise<boolean>;
  onDuplicate?: () => Promise<boolean>;
}

interface ItemFormState {
  text: string;
  emphasis: JourneyItemEmphasis | "";
}

type ItemFormAction =
  | { type: "reset"; values?: AddItemDialogProps["initialValues"] }
  | { type: "setText"; value: string }
  | { type: "setEmphasis"; value: JourneyItemEmphasis | "" };

const emptyItemForm: ItemFormState = {
  text: "",
  emphasis: "",
};

function itemFormReducer(state: ItemFormState, action: ItemFormAction): ItemFormState {
  switch (action.type) {
    case "reset":
      return action.values
        ? {
            text: action.values.text,
            emphasis: action.values.emphasis || "",
          }
        : emptyItemForm;
    case "setText":
      return { ...state, text: action.value };
    case "setEmphasis":
      return { ...state, emphasis: action.value };
    default:
      return state;
  }
}

export function AddItemDialog({
  open,
  onOpenChange,
  onSubmit,
  mode = "add",
  initialValues,
  onDelete,
  onDuplicate,
}: AddItemDialogProps) {
  const [form, dispatchForm] = useReducer(itemFormReducer, emptyItemForm);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (open && initialValues) {
      dispatchForm({ type: "reset", values: initialValues });
    } else if (open && mode === "add") {
      dispatchForm({ type: "reset" });
    }
  }, [open, initialValues, mode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const saved = await onSubmit(form.text, undefined, parseEmphasis(form.emphasis));
    setLoading(false);
    if (!saved) return;
    onOpenChange(false);
  };

  const handleDeleteClick = () => {
    if (!onDelete) return;
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    const deleted = await onDelete();
    setIsDeleting(false);
    if (!deleted) return;
    onOpenChange(false);
  };

  const handleDuplicate = async () => {
    if (!onDuplicate) return;
    setIsDuplicating(true);
    const duplicated = await onDuplicate();
    setIsDuplicating(false);
    if (!duplicated) return;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobilePlacement="bottom-sheet" className="dev-theme gap-6 font-sans md:max-w-ux-dialog md:p-8">
        <DialogHeader className="min-h-11 items-center">
          <DialogTitle>{mode === "edit" ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="text">Text</Label>
            <textarea
              id="text"
              aria-label="Text"
              className="border-ux-input ring-offset-ux-canvas placeholder:text-ux-muted focus-visible:ring-ux-primary flex min-h-ux-field-min w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={form.text}
              onChange={(e) => dispatchForm({ type: "setText", value: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emphasis">Emphasis</Label>
            <Select value={form.emphasis || "none"} onValueChange={(value) => dispatchForm({ type: "setEmphasis", value: parseEmphasis(value) ?? "" })}><SelectTrigger id="emphasis" aria-label="Emphasis" className="bg-ux-surface h-11 md:h-11 shadow-none"><SelectValue /></SelectTrigger><SelectContent position="popper"><SelectItem value="none">None</SelectItem><SelectItem value="positive">Positive</SelectItem><SelectItem value="neutral">Neutral</SelectItem><SelectItem value="negative">Negative</SelectItem></SelectContent></Select>
          </div>
          <DialogFooter className="flex w-full items-center justify-between gap-4 sm:justify-between">
            {mode === "edit" && (onDelete || onDuplicate) && (
              <div className="flex items-center gap-1">
                {onDuplicate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleDuplicate}
                    disabled={loading || isDeleting || isDuplicating}
                    title="Duplicate"
                    className="size-11"
                  >
                    <Copy className="size-4" />
                    <span className="sr-only">
                      {isDuplicating ? "Duplicating..." : "Duplicate"}
                    </span>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleDeleteClick}
                    disabled={loading || isDeleting || isDuplicating}
                    title="Delete"
                    className="bg-ux-danger/10 text-ux-danger hover:bg-ux-danger/15 hover:text-ux-danger size-11"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">{isDeleting ? "Deleting..." : "Delete"}</span>
                  </Button>
                )}
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading || isDeleting || isDuplicating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="inverse"
                disabled={loading || isDeleting || isDuplicating}
              >
                {!loading && mode === "add" ? <Plus aria-hidden="true" /> : null}
                {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Add"}
              </Button>
            </div>
          </DialogFooter>
        </form>
        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={handleDeleteConfirm}
          title="Delete item"
          description="Delete this item?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
        />
      </DialogContent>
    </Dialog>
  );
}
