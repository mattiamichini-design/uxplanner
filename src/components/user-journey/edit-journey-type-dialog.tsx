"use client";

import { useState, useTransition, useReducer } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateJourneyType, deleteJourneyType } from "@/app/actions/user-journey";
import { Trash2 } from "lucide-react";
import type { JourneyType, Persona } from "@/lib/user-journey/types";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { JourneyIconPicker, JourneyPersonaPicker } from "./journey-form-controls";
import { ActionError } from "@/components/action-error";

type EditJourneyTypeDialogProps = {
  journeyType: JourneyType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allPersonas: Persona[];
  existingPersonas: Persona[];
};

interface JourneyTypeFormState {
  title: string;
  subtitle: string;
  selectedIcon: string;
  selectedPersonas: string[];
}

type JourneyTypeFormAction =
  | { type: "reset"; journeyType: JourneyType; personas: Persona[] }
  | { type: "setTitle"; value: string }
  | { type: "setSubtitle"; value: string }
  | { type: "setIcon"; value: string }
  | { type: "togglePersona"; slug: string };

const emptyJourneyTypeForm: JourneyTypeFormState = {
  title: "",
  subtitle: "",
  selectedIcon: "Map",
  selectedPersonas: [],
};

function createJourneyTypeForm(
  journeyType: JourneyType | null,
  personas: Persona[],
): JourneyTypeFormState {
  if (!journeyType) return emptyJourneyTypeForm;

  return {
    title: journeyType.title,
    subtitle: journeyType.description || "",
    selectedIcon: journeyType.icon || "Map",
    selectedPersonas: personas.map((persona) => persona.slug),
  };
}

function journeyTypeFormReducer(
  state: JourneyTypeFormState,
  action: JourneyTypeFormAction,
): JourneyTypeFormState {
  switch (action.type) {
    case "reset":
      return createJourneyTypeForm(action.journeyType, action.personas);
    case "setTitle":
      return { ...state, title: action.value };
    case "setSubtitle":
      return { ...state, subtitle: action.value };
    case "setIcon":
      return { ...state, selectedIcon: action.value };
    case "togglePersona":
      return {
        ...state,
        selectedPersonas: state.selectedPersonas.includes(action.slug)
          ? state.selectedPersonas.filter((personaSlug) => personaSlug !== action.slug)
          : [...state.selectedPersonas, action.slug],
      };
    default:
      return state;
  }
}

export function EditJourneyTypeDialog({
  journeyType,
  open,
  onOpenChange,
  allPersonas,
  existingPersonas,
}: EditJourneyTypeDialogProps) {
  const [form, dispatchForm] = useReducer(
    journeyTypeFormReducer,
    createJourneyTypeForm(journeyType, existingPersonas),
  );
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && journeyType) {
      dispatchForm({ type: "reset", journeyType, personas: existingPersonas });
    }
    onOpenChange(nextOpen);
  };

  const togglePersona = (slug: string) => {
    dispatchForm({ type: "togglePersona", slug });
  };

  const handleUpdate = () => {
    if (!journeyType || !form.title) return;

    startTransition(async () => {
      try {
        const result = await updateJourneyType(
          journeyType.slug,
          form.title,
          form.subtitle,
          form.selectedIcon,
          form.selectedPersonas,
        );
        if (!result.success) {
          setActionError(result.error);
          return;
        }
        setActionError(null);
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "The journey could not be updated.");
      }
    });
  };

  const handleDeleteClick = () => {
    if (!journeyType) return;
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (!journeyType) return;
    startTransition(async () => {
      try {
        const result = await deleteJourneyType(journeyType.slug);
        if (!result.success) {
          setActionError(result.error);
          return;
        }
        setActionError(null);
        setShowDeleteConfirm(false);
        onOpenChange(false);
        router.push("/ux-planner/user-journeys");
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "The journey could not be deleted.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent mobilePlacement="bottom-sheet" className="dev-theme max-h-[calc(100vh-2rem)] overflow-y-auto px-4 font-sans md:max-w-ux-dialog-wide md:p-8">
        <DialogHeader>
          <DialogTitle>Edit User Journey</DialogTitle>
          <DialogDescription>
            Edit the title, subtitle, icon and user personas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-2">
          <ActionError message={actionError} />
          <div className="grid gap-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={form.title}
              onChange={(e) => dispatchForm({ type: "setTitle", value: e.target.value })}
              placeholder="e.g. Order management"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-subtitle">Subtitle</Label>
            <Input
              id="edit-subtitle"
              value={form.subtitle}
              onChange={(e) => dispatchForm({ type: "setSubtitle", value: e.target.value })}
              placeholder="e.g. Checkout flow"
            />
          </div>

          <div className="grid gap-2">
            <Label>Icon</Label>
            <JourneyIconPicker selectedIcon={form.selectedIcon} onSelect={(value) => dispatchForm({ type: "setIcon", value })} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-4">
              <Label>Select Personas</Label>
              <span className="text-ux-muted text-xs">{form.selectedPersonas.length} selected</span>
            </div>
            <JourneyPersonaPicker personas={allPersonas} selectedPersonas={form.selectedPersonas} onToggle={togglePersona} />
          </div>
        </div>
        <DialogFooter className="border-ux-border gap-2 border-t pt-6 sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="icon"
            shape={null}
            onClick={handleDeleteClick}
            disabled={isPending}
            className="size-11 rounded-ux-button border-ux-danger-border bg-ux-danger-soft text-ux-danger hover:bg-ux-danger/15 hover:text-ux-danger"
            aria-label="Delete User Journey"
          >
            <Trash2 className="size-4" />
          </Button>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Button
              variant="outline"
              shape={null}
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-11 w-full rounded-ux-button sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="inverse"
              shape={null}
              onClick={handleUpdate}
              disabled={isPending || !form.title}
              className="h-11 w-full rounded-ux-button sm:w-auto"
            >
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        title="Delete User Journey"
        description={`Delete the "${journeyType?.title}" journey? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        contentClassName="dev-theme font-sans"
      />
    </Dialog>
  );
}
