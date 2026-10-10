"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { personaInitials } from "@/lib/personas/initials";
import type { PersonaData } from "@/lib/personas/types";

import { PersonaContent } from "./persona-content";
import { ResponsiveActionMenu, anchoredMenuItemClassName } from "@/components/ui/anchored-menu";

interface PersonaDetailViewProps {
  persona: PersonaData;
  showDeleteConfirm: boolean;
  onEdit: () => void;
  onDeleteClick: () => void;
  onDeleteOpenChange: (open: boolean) => void;
  onDeleteConfirm: () => Promise<void>;
}

export function PersonaDetailView({
  persona,
  showDeleteConfirm,
  onEdit,
  onDeleteClick,
  onDeleteOpenChange,
  onDeleteConfirm,
}: PersonaDetailViewProps) {
  return (
    <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)] xl:grid-cols-[var(--container-ux-profile)_minmax(0,1fr)]">
      <aside className="border-ux-border bg-ux-surface hidden min-h-0 overflow-y-auto content-start gap-6 border-r p-6 xl:grid">
          <PersonaIdentity persona={persona} />
          <PersonaAttributes persona={persona} />
          <PersonaActionsMenu onEdit={onEdit} onDeleteClick={onDeleteClick} showLabel />
      </aside>

      <div className="border-ux-border flex min-h-ux-header min-w-0 items-center gap-3 border-b px-4 py-3 xl:hidden">
        <div className="bg-ux-soft text-ux-text flex size-12 shrink-0 items-center justify-center rounded-ux-control text-base font-semibold">{personaInitials(persona.name)}</div>
        <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-semibold">{persona.name}</h2><p className="text-ux-muted truncate text-xs">{persona.role}</p></div>
        <PersonaActionsMenu onEdit={onEdit} onDeleteClick={onDeleteClick} />
      </div>

      <div className="grid min-h-0 min-w-0 content-start gap-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <section className="border-ux-border grid min-w-0 gap-4 border-b pb-5 xl:hidden" aria-labelledby="persona-attributes-title">
          <h2 id="persona-attributes-title" className="text-base font-semibold">Profile & attributes</h2>
          <PersonaAttributes persona={persona} compact />
        </section>
        <div className="prose prose-stone max-w-none">
          <PersonaContent content={persona.content} />
        </div>
      </div>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={onDeleteOpenChange}
        onConfirm={onDeleteConfirm}
        title="Delete Persona"
        description={`Delete the persona "${persona.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
}

function PersonaIdentity({ persona }: { persona: PersonaData }) {
  return <div className="grid gap-4"><div className="bg-ux-soft text-ux-text flex size-14 items-center justify-center rounded-2xl text-xl font-semibold">{personaInitials(persona.name)}</div><Typography as="h1" variant={null} className="text-2xl font-bold">{persona.name}</Typography><p className="text-ux-muted text-sm font-medium">{persona.role}</p></div>;
}

function PersonaAttributes({ persona, compact = false }: { persona: PersonaData; compact?: boolean }) {
  return <div className="grid min-w-0 gap-4"><div className={cn("grid min-w-0 gap-3", compact && "grid-cols-2")}><InfoTile label="Age" value={persona.ageRange} /><InfoTile label="Location" value={persona.location} /><InfoTile label="Tech Savvy" value={persona.techSavvy} /><InfoTile label="MVP priority" value={persona.mvpPriority ? "High" : "Normal"} valueClassName={persona.mvpPriority ? "text-ux-success font-medium" : ""} /></div><div className="flex min-w-0 flex-wrap gap-1.5">{persona.tags?.map((tag) => <Badge key={tag} variant="secondary" className="max-w-full [overflow-wrap:anywhere] whitespace-normal">{tag}</Badge>)}</div></div>;
}

function PersonaActionsMenu({ onEdit, onDeleteClick, showLabel = false }: { onEdit: () => void; onDeleteClick: () => void; showLabel?: boolean }) {
  return <ResponsiveActionMenu
    label="Persona actions"
    title="Persona actions"
    description="Edit or delete this persona."
    align="end"
    className={showLabel ? "w-full" : undefined}
    triggerClassName={showLabel ? "h-11 w-full justify-center text-sm" : "size-11 justify-center px-0"}
    trigger={<>{showLabel ? <><Pencil className="size-4" aria-hidden="true" />Persona actions</> : <MoreHorizontal className="size-5" aria-hidden="true" />}</>}
  >
    <button type="button" className={anchoredMenuItemClassName} onClick={onEdit}><Pencil className="size-4" />Edit persona</button>
    <button type="button" className={cn(anchoredMenuItemClassName, "text-ux-danger")} onClick={onDeleteClick}><Trash2 className="size-4" />Delete persona</button>
  </ResponsiveActionMenu>;
}

function InfoTile({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value?: string | boolean;
  valueClassName?: string;
}) {
  if (!value) return null;
  return (
    <div className="bg-ux-soft grid min-h-16 min-w-0 content-center gap-1 rounded-xl px-3.5 py-3 text-sm">
      <span className="text-ux-muted text-xs">{label}</span>
      <span className={cn("[overflow-wrap:anywhere] font-medium", valueClassName)}>{value.toString()}</span>
    </div>
  );
}
