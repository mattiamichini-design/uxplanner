"use client";

import { memo } from "react";
import { FileUp, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

export const EmptyStateOverlay = memo(function EmptyStateOverlay({
  onImport,
  startColumn,
  onAddColumn,
  onImportFromPersona,
  hasOtherPersonas,
}: {
  onImport?: () => void;
  startColumn: number;
  onAddColumn?: () => void;
  onImportFromPersona?: () => void;
  hasOtherPersonas?: boolean;
}) {
  return (
    <div
      className="flex min-h-[400px] items-center justify-center bg-ux-board/50"
      style={{
        gridColumn: `${startColumn} / -1`,
        gridRow: "1 / -1",
      }}
      role="gridcell"
      aria-colspan={100}
    >
      <div className="flex max-w-sm flex-col items-center gap-3 p-8 text-center">
        <div className="bg-ux-soft rounded-full p-4">
          <FileUp className="text-ux-muted size-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Start your journey</h3>
          <p className="text-ux-muted mt-1 text-sm">
            Add a column to define a new step, import a CSV, or copy from another persona.
          </p>
        </div>
        <div className="mt-2 flex w-full flex-col gap-2">
          <Button onClick={onAddColumn} className="w-full">
            <Plus className="mr-2 size-4" /> Add Column
          </Button>
          <Button variant="outline" onClick={onImport} className="w-full">
            <FileUp className="mr-2 size-4" /> Import CSV
          </Button>
          {hasOtherPersonas ? (
            <Button variant="outline" onClick={onImportFromPersona} className="w-full">
              <Users className="mr-2 size-4" /> Import from Persona
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
});
