"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Minus, Plus, Copy, MoreHorizontal, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JourneyType, Persona } from "@/lib/user-journey/types";
import { PersonaAvatar } from "./persona-avatar";
import * as LucideIcons from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { EditJourneyTypeDialog } from "./edit-journey-type-dialog";
import { getResponsiveControlLayout } from "@/lib/ux-planner/responsive-control-layout";
import { StudioSidebarToggle } from "@/components/ux-planner/studio-shell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AnchoredMenu, anchoredMenuItemClassName } from "@/components/ui/anchored-menu";

type JourneyControlsProps = {
  journeyType: JourneyType;
  availablePersonas: Persona[];
  currentPersonaSlug?: string;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  compareMode?: boolean;
  selectedPersonas?: string[];
  allPersonas: Persona[];
};

const EMPTY_SELECTED_PERSONAS: string[] = [];
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ux-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ux-surface";

export function JourneyControls({
  journeyType,
  availablePersonas,
  currentPersonaSlug,
  zoom,
  onZoomChange,
  compareMode = false,
  selectedPersonas = EMPTY_SELECTED_PERSONAS,
  allPersonas,
}: JourneyControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);

  // Get icon component dynamically - memoized to avoid recreation
  const IconComponent = useMemo(() => {
    if (!journeyType.icon) return null;
    return (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
      journeyType.icon
    ];
  }, [journeyType.icon]);

  const handlePersonaSelect = useCallback(
    (personaSlug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("persona", personaSlug);
      params.delete("compare");
      params.delete("personas");
      params.delete("focusColumn");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleCompareToggle = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (compareMode) {
      // Exit compare mode
      params.delete("compare");
      params.delete("personas");
      params.delete("focusColumn");
      if (currentPersonaSlug) {
        params.set("persona", currentPersonaSlug);
      }
    } else {
      // Enter compare mode with all available personas
      params.set("compare", "true");
      params.set("personas", availablePersonas.map((p) => p.slug).join(","));
      params.delete("persona");
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [compareMode, currentPersonaSlug, availablePersonas, pathname, router, searchParams]);

  const adjustZoom = useCallback(
    (delta: number) => {
      const newZoom = Math.max(0.5, Math.min(2, zoom + delta));
      onZoomChange(newZoom);
    },
    [zoom, onZoomChange],
  );
  const personaSelectorLayout = getResponsiveControlLayout({
    itemCount: availablePersonas.length,
    desktopAlignment: "center",
  });

  return (
    <div
      data-testid="journey-control-row"
      className="bg-ux-surface grid min-h-ux-header grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:px-6"
    >
      {/* Left: Journey Type Info */}
      <div
        data-testid="journey-title-block"
        className="group hidden min-w-0 items-center gap-2 md:col-start-1 md:row-start-1 md:flex md:w-full md:justify-self-start"
      >
        <StudioSidebarToggle className="max-w-52" />
        {IconComponent && (
          <div className="bg-ux-primary/10 text-ux-primary hidden size-8 shrink-0 items-center justify-center rounded-lg ux-wide:flex">
            <IconComponent className="size-4" />
          </div>
        )}
        <div className="hidden min-w-0 ux-wide:block">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold">{journeyType.title}</h2>
            <button type="button"
              onClick={() => setIsEditing(true)}
              className={cn("text-ux-muted hover:bg-ux-soft hover:text-ux-text flex size-7 items-center justify-center rounded-ux-badge transition-colors", focusRing)}
              title="Edit Journey"
              aria-label="Edit Journey"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
          {journeyType.description && (
            <p className="text-ux-muted truncate text-xs">{journeyType.description}</p>
          )}
        </div>
      </div>

      <EditJourneyTypeDialog
        journeyType={journeyType}
        open={isEditing}
        onOpenChange={setIsEditing}
        allPersonas={allPersonas}
        existingPersonas={availablePersonas}
      />

      {/* Center: Persona Selector / Compare Mode */}
      <div
        data-testid="journey-persona-selector-slot"
        className="col-start-1 row-start-1 min-w-0 md:col-start-2 md:justify-self-center"
      >
        {!compareMode && availablePersonas.length > 2 ? (
          <label className="relative block min-w-0">
            <span className="sr-only">Select persona</span>
            <Select value={currentPersonaSlug} onValueChange={handlePersonaSelect}><SelectTrigger aria-label="Select persona" size="sm" className="bg-ux-surface w-full min-w-0 max-w-52 shadow-none"><SelectValue /></SelectTrigger><SelectContent position="popper">{availablePersonas.map((persona) => <SelectItem key={persona.slug} value={persona.slug}>{persona.name}</SelectItem>)}</SelectContent></Select>
          </label>
        ) : !compareMode ? (
          <div
            data-testid="journey-persona-selector"
            className={personaSelectorLayout.outerClassName}
          >
            <div
              data-testid="journey-persona-selector-list"
              className={personaSelectorLayout.listClassName}
            >
              {availablePersonas.map((persona) => (
                <button type="button"
                  key={persona.slug}
                  onClick={() => handlePersonaSelect(persona.slug)}
                  className={cn(
                    "flex h-11 min-w-0 items-center gap-2 rounded-ux-button border px-3 text-ux-label transition-colors md:h-8",
                    focusRing,
                    personaSelectorLayout.itemClassName,
                    currentPersonaSlug === persona.slug
                      ? "border-ux-primary bg-ux-primary text-ux-on-primary font-medium"
                      : "border-ux-border hover:border-ux-muted/50",
                  )}
                >
                  <PersonaAvatar
                    persona={persona}
                    active={currentPersonaSlug === persona.slug}
                    size="xs"
                  />
                  <span className="truncate whitespace-nowrap">{persona.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-center">
            {availablePersonas
              .filter((persona) => selectedPersonas.includes(persona.slug))
              .slice(0, 2)
              .map((persona, index) => (
                <div key={persona.slug} className="contents">
                  {index > 0 ? <span className="text-ux-muted text-xs">vs</span> : null}
                  <span className={cn(
                    "flex h-11 min-w-0 items-center gap-2 rounded-ux-button border px-3 text-ux-label font-medium md:h-8",
                    index === 0
                      ? "border-ux-primary bg-ux-primary text-ux-on-primary"
                      : "border-ux-border bg-ux-surface text-ux-text",
                  )}>
                    <PersonaAvatar
                      persona={persona}
                      active={index === 0}
                      size="xs"
                      className={index === 0 ? undefined : "opacity-100"}
                    />
                    <span className="truncate whitespace-nowrap ux-narrow:sr-only">{persona.name}</span>
                  </span>
                </div>
              ))}
            {selectedPersonas.length > 2 ? (
              <span className="border-ux-border bg-ux-surface flex h-11 items-center rounded-ux-button border px-3 text-xs font-medium md:h-8">
                +{selectedPersonas.length - 2}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Right: Zoom + Compare Toggle */}
      <div
        data-testid="journey-actions-block"
        className="col-start-2 row-start-1 justify-self-end md:col-start-3"
      >
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" size="icon" className="size-11" aria-label="View options"><MoreHorizontal className="size-5" /></Button></SheetTrigger>
            <SheetContent side="bottom" className="dev-theme font-sans"><SheetHeader className="text-left"><SheetTitle>View options</SheetTitle><SheetDescription>Journey details, persona comparison, and canvas zoom.</SheetDescription></SheetHeader><SheetBody className="grid gap-5"><div className="grid gap-2"><p className="text-ux-muted text-xs font-medium">Journey</p><SheetClose asChild><Button variant="outline" className="h-11 justify-start" onClick={() => setIsEditing(true)}><Pencil className="size-4" />Edit journey</Button></SheetClose></div><div className="grid gap-2"><p className="text-ux-muted text-xs font-medium">View</p><SheetClose asChild><Button variant="outline" className="h-11 justify-start" onClick={handleCompareToggle}><Copy className="size-4" />{compareMode ? "Exit comparison" : "Compare personas"}</Button></SheetClose></div><div className="grid gap-2"><p className="text-ux-muted text-xs font-medium">Zoom</p><div className="border-ux-border flex h-11 items-center justify-between rounded-ux-control border"><Button variant="ghost" size="icon" className="size-11" onClick={() => adjustZoom(-0.1)} disabled={zoom <= 0.5} aria-label="Zoom out"><Minus className="size-4" /></Button><button type="button" onClick={() => onZoomChange(1)} className="min-h-11 px-4 text-sm font-medium">{Math.round(zoom * 100)}%</button><Button variant="ghost" size="icon" className="size-11" onClick={() => adjustZoom(0.1)} disabled={zoom >= 2} aria-label="Zoom in"><Plus className="size-4" /></Button></div></div></SheetBody></SheetContent>
          </Sheet>
        </div>
        <AnchoredMenu
          label="View options"
          align="end"
          className="hidden md:block ux-wide:hidden"
          trigger={<MoreHorizontal className="size-4" aria-hidden="true" />}
        >
          <button type="button" className={anchoredMenuItemClassName} onClick={() => setIsEditing(true)}><Pencil className="size-4" />Edit journey</button>
          <button type="button" className={anchoredMenuItemClassName} onClick={handleCompareToggle}><Copy className="size-4" />{compareMode ? "Exit comparison" : "Compare personas"}</button>
          <div data-anchored-menu-keep-open className="border-ux-border mt-1 flex h-10 items-center justify-between border-t pt-1">
            <Button variant="ghost" size="icon" className="size-9" onClick={() => adjustZoom(-0.1)} disabled={zoom <= 0.5} aria-label="Zoom out"><Minus className="size-4" /></Button>
            <button type="button" onClick={() => onZoomChange(1)} className="min-h-9 px-3 text-xs font-medium">{Math.round(zoom * 100)}%</button>
            <Button variant="ghost" size="icon" className="size-9" onClick={() => adjustZoom(0.1)} disabled={zoom >= 2} aria-label="Zoom in"><Plus className="size-4" /></Button>
          </div>
        </AnchoredMenu>
        <div className="hidden w-full flex-nowrap items-center justify-end gap-2 ux-wide:flex">
        <button type="button"
          onClick={handleCompareToggle}
          className={cn(
            "flex h-11 min-w-0 items-center justify-center gap-2 rounded-ux-button border px-3 text-sm transition-colors sm:justify-start md:h-8",
            focusRing,
            compareMode
              ? "border-ux-primary bg-ux-primary/5 text-ux-primary font-medium"
              : "border-ux-border hover:border-ux-muted/50",
          )}
        >
          <Copy className="size-3.5" />
          <span className="truncate whitespace-nowrap">
            {compareMode ? "Exit Comparison" : "Compare Personas"}
          </span>
        </button>

        <div className="border-ux-border bg-ux-surface flex h-11 shrink-0 items-center gap-1 rounded-ux-button border px-2 md:h-8">
          <button type="button"
            onClick={() => adjustZoom(-0.1)}
            disabled={zoom <= 0.5}
            className={cn("hover:bg-ux-soft flex size-7 items-center justify-center rounded-ux-xs disabled:opacity-40", focusRing)}
            aria-label="Zoom out"
          >
            <Minus className="size-3.5" />
          </button>
          <button type="button"
            onClick={() => onZoomChange(1)}
            disabled={zoom === 1}
            className={cn("hover:bg-ux-soft min-w-10 rounded-ux-xs px-1 text-center text-xs font-medium transition-colors disabled:cursor-default", focusRing)}
            aria-label="Reset zoom to 100%"
            title="Click to reset zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button type="button"
            onClick={() => adjustZoom(0.1)}
            disabled={zoom >= 2}
            className={cn("hover:bg-ux-soft flex size-7 items-center justify-center rounded-ux-xs disabled:opacity-40", focusRing)}
            aria-label="Zoom in"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
