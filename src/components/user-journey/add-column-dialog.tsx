"use client";

import { useEffect, useReducer, useState } from "react";
import type { FormEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";

interface AddColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, label: string, subtitle?: string, applyToAll?: boolean) => Promise<boolean>;
  showApplyToAll?: boolean;
  mode?: "add" | "edit";
  initialValues?: {
    id: string;
    label: string;
    subtitle?: string;
  };
  onDelete?: () => Promise<boolean>;
}

interface ColumnFormState {
  id: string;
  label: string;
  subtitle: string;
  applyToAll: boolean;
}

type ColumnFormAction =
  | { type: "reset"; values?: AddColumnDialogProps["initialValues"] }
  | { type: "setId"; value: string }
  | { type: "setLabel"; value: string }
  | { type: "setSubtitle"; value: string }
  | { type: "setApplyToAll"; value: boolean };

const emptyColumnForm: ColumnFormState = {
  id: "",
  label: "",
  subtitle: "",
  applyToAll: false,
};

function columnFormReducer(state: ColumnFormState, action: ColumnFormAction): ColumnFormState {
  switch (action.type) {
    case "reset":
      return action.values
        ? {
            id: action.values.id,
            label: action.values.label,
            subtitle: action.values.subtitle || "",
            applyToAll: false,
          }
        : emptyColumnForm;
    case "setId":
      return { ...state, id: action.value };
    case "setLabel":
      return { ...state, label: action.value };
    case "setSubtitle":
      return { ...state, subtitle: action.value };
    case "setApplyToAll":
      return { ...state, applyToAll: action.value };
    default:
      return state;
  }
}

export function AddColumnDialog({
  open,
  onOpenChange,
  onSubmit,
  showApplyToAll = true,
  mode = "add",
  initialValues,
  onDelete,
}: AddColumnDialogProps) {
  const [form, dispatchForm] = useReducer(columnFormReducer, emptyColumnForm);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    const finalId = form.id || form.label.toLowerCase().replace(/\s+/g, "-");
    const saved = await onSubmit(finalId, form.label, form.subtitle, form.applyToAll);
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
          <DialogTitle>{mode === "edit" ? "Edit Column" : "Add Column"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={form.label}
              onChange={(e) => dispatchForm({ type: "setLabel", value: e.target.value })}
              required
              placeholder="e.g. Phase 1"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="id">ID (Optional)</Label>
            <Input
              id="id"
              value={form.id}
              onChange={(e) => dispatchForm({ type: "setId", value: e.target.value })}
              placeholder="fase-1"
              disabled={mode === "edit"}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subtitle">Subtitle (Optional)</Label>
            <Input
              id="subtitle"
              value={form.subtitle}
              onChange={(e) => dispatchForm({ type: "setSubtitle", value: e.target.value })}
            />
          </div>
          {mode === "add" && showApplyToAll && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="applyToAll"
                checked={form.applyToAll}
                onCheckedChange={(c) => dispatchForm({ type: "setApplyToAll", value: c === true })}
              />
              <Label htmlFor="applyToAll">Apply to all personas in this category</Label>
            </div>
          )}
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
