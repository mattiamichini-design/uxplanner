"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users } from "lucide-react";
import type { Persona } from "@/lib/user-journey/types";

interface ImportFromPersonaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availablePersonas: Persona[];
  currentPersonaName: string;
  onImport: (sourcePersonaSlug: string) => Promise<boolean>;
}

export function ImportFromPersonaDialog({
  open,
  onOpenChange,
  availablePersonas,
  currentPersonaName,
  onImport,
}: ImportFromPersonaDialogProps) {
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(open);
  if (open !== previousOpen) {
    setPreviousOpen(open);
    if (open) setSelectedPersona(null);
  }

  const handleImport = async () => {
    if (!selectedPersona) return;
    setIsImporting(true);
    try {
      if (await onImport(selectedPersona)) {
        onOpenChange(false);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent mobilePlacement="bottom-sheet" className="dev-theme font-sans md:max-w-ux-dialog md:p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2">
            <Users className="size-5 shrink-0" />
            Import from Persona
          </DialogTitle>
          <DialogDescription>
            Copy the entire journey from another persona to <strong>{currentPersonaName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Warning */}
          <div className="bg-ux-danger/10 text-ux-danger flex items-start gap-3 rounded-lg p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>This will overwrite all existing data for this persona.</p>
          </div>

          {/* Persona selection */}
          <div className="grid gap-2">
            <p className="text-sm font-medium">Select source persona:</p>
            <div className="grid gap-2">
              {availablePersonas.map((persona) => (
                <button
                  key={persona.slug}
                  type="button"
                  onClick={() => setSelectedPersona(persona.slug)}
                  className={`border-ux-input hover:bg-ux-soft flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selectedPersona === persona.slug
                      ? "border-ux-primary bg-ux-primary/5 ring-ux-primary ring-1"
                      : ""
                  }`}
                >
                  <span
                    className={`flex size-8 items-center justify-center rounded-full text-xs font-medium ${persona.color || "bg-ux-soft"}`}
                  >
                    {persona.initials}
                  </span>
                  <span className="font-medium">{persona.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedPersona || isImporting}
            variant="destructive"
          >
            {isImporting ? "Importing..." : "Import & Overwrite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
