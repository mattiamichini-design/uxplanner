"use client";

import { memo } from "react";
import { Pencil } from "lucide-react";

import type { JourneyColumn, Persona } from "@/lib/user-journey/types";
import { getJourneyPhaseColor } from "@/lib/user-journey/phase-color";

export const ColumnHeader = memo(function ColumnHeader({
  column,
  phaseIndex,
  onEdit,
}: {
  column: JourneyColumn;
  phaseIndex: number;
  onEdit?: () => void;
}) {
  return (
    <div
      className="border-border group sticky top-0 z-(--z-ux-sticky) border px-5 py-4"
      style={{ backgroundClip: "padding-box", backgroundColor: getJourneyPhaseColor(phaseIndex) }}
      role="columnheader"
      data-journey-phase-header
    >
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="grid flex-1 gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">{column.label}</h2>
              {onEdit ? (
                <button type="button"
                  onClick={onEdit}
                  className="text-muted-foreground hover:text-foreground opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                  aria-label="Edit column"
                >
                  <Pencil className="size-3" />
                </button>
              ) : null}
            </div>
            {column.subtitle ? (
              <p className="text-muted-foreground text-xs">{column.subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
});

export const ColumnHeaderComparison = memo(function ColumnHeaderComparison({
  column,
  persona,
  personaIndex,
  phaseIndex,
  onEdit,
}: {
  column: JourneyColumn;
  persona?: Persona;
  personaIndex: number;
  phaseIndex: number;
  onEdit?: () => void;
}) {
  return (
    <div
      className="border-border group sticky top-0 z-(--z-ux-sticky) border px-5 py-4"
      style={{ backgroundClip: "padding-box", backgroundColor: getJourneyPhaseColor(phaseIndex) }}
      role="columnheader"
      data-journey-phase-header
    >
      <div className="grid gap-2">
        <div className="flex items-start gap-2">
          {persona ? (
            <span
              className={`inline-flex size-8 items-center justify-center rounded-ux-button border text-xs font-medium ${
                personaIndex === 0
                  ? "border-ux-primary bg-ux-primary text-ux-on-primary"
                  : "border-ux-border-quiet bg-ux-surface text-ux-text"
              }`}
              title={persona.name}
            >
              {persona.initials}
            </span>
          ) : null}
          <div className="grid flex-1 gap-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">{column.label}</h2>
              {onEdit ? (
                <button type="button"
                  onClick={onEdit}
                  className="text-muted-foreground hover:text-foreground opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                  aria-label="Edit column"
                >
                  <Pencil className="size-3" />
                </button>
              ) : null}
            </div>
            {persona ? <p className="text-muted-foreground text-xs">{persona.name}</p> : null}
          </div>
        </div>
        {column.subtitle && !persona ? (
          <p className="text-muted-foreground text-xs">{column.subtitle}</p>
        ) : null}
      </div>
    </div>
  );
});
