"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

import type { Persona } from "@/lib/user-journey/types";

import { AVAILABLE_ICONS } from "./available-journey-icons";
import { resolveLucideIcon } from "./lucide-icon-resolver";

export function JourneyIconPicker({
  selectedIcon,
  onSelect,
}: {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}) {
  return (
    <div className="border-ux-input bg-ux-canvas relative max-h-ux-chip-list overflow-hidden rounded-xl border">
      <div className="grid max-h-ux-chip-list grid-cols-6 gap-2 overflow-y-auto p-3 pb-10 sm:grid-cols-8">
        {AVAILABLE_ICONS.map((iconName) => {
          const Icon = resolveLucideIcon(iconName);
          return (
            <button
              key={iconName}
              type="button"
              aria-label={iconName}
              aria-pressed={selectedIcon === iconName}
              onClick={() => onSelect(iconName)}
              className={clsx(
                "flex h-12 items-center justify-center rounded-lg border transition-colors",
                selectedIcon === iconName
                  ? "border-ux-primary bg-ux-primary text-ux-on-primary"
                  : "border-ux-border bg-ux-canvas text-ux-muted hover:border-ux-muted/60 hover:text-ux-text",
              )}
              title={iconName}
            >
              {Icon ? <Icon className="size-5" /> : <span className="text-xs">{iconName}</span>}
            </button>
          );
        })}
      </div>
      <div className="from-transparent to-ux-canvas pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b" />
    </div>
  );
}

export function JourneyPersonaPicker({
  personas,
  selectedPersonas,
  onToggle,
}: {
  personas: Persona[];
  selectedPersonas: string[];
  onToggle: (slug: string) => void;
}) {
  return (
    <div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
      {personas.map((persona) => {
        const selected = selectedPersonas.includes(persona.slug);
        return (
          <button
            key={persona.slug}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(persona.slug)}
            className={clsx(
              "flex h-ux-toolbar min-w-0 items-center gap-3 rounded-xl border p-4 text-left transition-colors",
              selected
                ? "border-ux-primary bg-ux-primary text-ux-on-primary"
                : "border-ux-input bg-ux-canvas hover:border-ux-muted/60",
            )}
          >
            <span className={clsx("flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-semibold", selected ? "bg-ux-on-primary/15" : "bg-ux-soft")}>{persona.initials}</span>
            <span className="min-w-0 flex-1 truncate text-base font-medium leading-5">{persona.name}</span>
            <span className={clsx("flex size-6 shrink-0 items-center justify-center rounded-md border", selected ? "border-ux-on-primary/50 text-ux-on-primary" : "border-ux-input")}>
              {selected ? <Check className="size-4" aria-hidden="true" /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
