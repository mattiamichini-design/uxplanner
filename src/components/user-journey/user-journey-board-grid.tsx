"use client";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import clsx from "clsx";
import { ArrowRight, ArrowUp, ChevronLeft, ChevronRight, Copy, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import type { JourneyData } from "@/lib/user-journey/types";
import { getJourneyPhaseColor } from "@/lib/user-journey/phase-color";
import {
  getHorizontalScrollMetrics,
  getScrollProgressFromPointer,
} from "@/lib/user-journey/horizontal-scroll";
import {
  COLLAPSED_ROW_HEIGHT,
  MAX_VISIBLE_RECALLED_ROWS,
  getRecalledRowIds,
  getRecallOffset,
} from "@/lib/user-journey/row-recall";

import {
  ColumnHeader,
  ColumnHeaderComparison,
  EmptyStateOverlay,
  ROW_HEADER_CLASS,
  RowSection,
  MobileJourneyRow,
  StickyNote,
  TrashDropZone,
} from "./user-journey-board-sections";
import type { UserJourneyBoardState } from "./use-user-journey-board-state";
import { NoteCount } from "./note-count";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FileDown, FileUp, MoreHorizontal, Search } from "lucide-react";
import { UserJourneyBoardNotes } from "./user-journey-board-notes";

const mobileQuery = "(max-width: 47.999rem)";
const subscribeMobile = (callback: () => void) => {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const getMobileSnapshot = () => window.matchMedia(mobileQuery).matches;
const getMobileServerSnapshot = () => false;

interface UserJourneyBoardGridProps {
  compareMode: boolean;
  journeys: JourneyData[];
  state: UserJourneyBoardState;
  zoom: number;
}

const JOURNEY_BOARD_FOOTER_HEIGHT = 84;

export function UserJourneyBoardGrid({
  compareMode,
  journeys,
  state,
  zoom,
}: UserJourneyBoardGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollMetrics, setScrollMetrics] = useState(() =>
    getHorizontalScrollMetrics(0, 0, 0),
  );
  const [scrollViewportHeight, setScrollViewportHeight] = useState<number>();
  const [collapsedRowIds, setCollapsedRowIds] = useState<Set<string>>(() => new Set());
  const [recalledRowIds, setRecalledRowIds] = useState<string[]>([]);
  const [phaseHeaderHeight, setPhaseHeaderHeight] = useState(0);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const isMobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);

  const scrollToPhase = useCallback((phaseIndex: number) => {
    const scrollElement = scrollRef.current;
    const headers = contentRef.current?.querySelectorAll<HTMLElement>("[data-journey-phase-header]");
    const target = headers?.[phaseIndex + 1];
    if (!scrollElement || !target) return;
    const firstHeader = headers?.[0];
    scrollElement.scrollTo({
      left: Math.max(0, target.offsetLeft - (firstHeader?.offsetWidth ?? 0)),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
    setActivePhaseIndex(phaseIndex);
  }, []);

  const updateRecalledRows = useCallback(() => {
    const scrollElement = scrollRef.current;
    const contentElement = contentRef.current;
    if (!scrollElement || !contentElement) return;

    const scrollBounds = scrollElement.getBoundingClientRect();
    const nextHeaderHeight = Math.max(
      0,
      ...Array.from(
        contentElement.querySelectorAll<HTMLElement>("[data-journey-phase-header]"),
      ).map((element) => element.getBoundingClientRect().height),
    );
    const cutoff = scrollBounds.top + nextHeaderHeight;
    const nextIds = getRecalledRowIds(
      Array.from(contentElement.querySelectorAll<HTMLElement>("[data-journey-row]"))
        .map((element) => ({
          id: element.dataset.journeyRow,
          top: element.getBoundingClientRect().top,
        }))
        .filter((row): row is { id: string; top: number } => Boolean(row.id)),
      cutoff,
      COLLAPSED_ROW_HEIGHT * zoom,
    );

    setPhaseHeaderHeight((current) =>
      Math.abs(current - nextHeaderHeight) < 0.5 ? current : nextHeaderHeight,
    );
    setRecalledRowIds((current) =>
      current.length === nextIds.length && current.every((id, index) => id === nextIds[index])
        ? current
        : nextIds,
    );
  }, [zoom]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    const contentElement = contentRef.current;
    if (!scrollElement || !contentElement) return;

    const updateOverflow = () => {
      setScrollViewportHeight(
        Math.max(
          160,
          window.innerHeight -
            scrollElement.getBoundingClientRect().top -
            (state.hasEmptyState ? 0 : JOURNEY_BOARD_FOOTER_HEIGHT),
        ),
      );
      setScrollMetrics(
        getHorizontalScrollMetrics(
          scrollElement.scrollWidth,
          scrollElement.clientWidth,
          scrollElement.scrollLeft,
        ),
      );
      updateRecalledRows();
    };
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(scrollElement);
    observer.observe(contentElement);
    window.addEventListener("resize", updateOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, [compareMode, journeys, state.dynamicOffset, state.hasEmptyState, updateRecalledRows, zoom]);

  const toggleCollapsedRow = useCallback((rowId: string) => {
    setCollapsedRowIds((current) => {
      const next = new Set(current);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  const scrollToRow = useCallback(
    (rowId: string, smooth = true) => {
      if (!smooth) {
        setRecalledRowIds((current) => current.filter((id) => id !== rowId));
      }
      setCollapsedRowIds((current) => {
        if (!current.has(rowId)) return current;
        const next = new Set(current);
        next.delete(rowId);
        return next;
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const scrollElement = scrollRef.current;
          const rowElement = contentRef.current?.querySelector<HTMLElement>(
            `[data-journey-row="${CSS.escape(rowId)}"]`,
          );
          if (!scrollElement || !rowElement) return;
          const rowIndex = state.visualRows.findIndex((row) => row.id === rowId);
          const recallOffset = getRecallOffset(rowIndex, zoom);
          const scrollBounds = scrollElement.getBoundingClientRect();
          const rowBounds = rowElement.getBoundingClientRect();
          const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          scrollElement.scrollTo({
            top:
              scrollElement.scrollTop +
              rowBounds.top -
              scrollBounds.top -
              phaseHeaderHeight -
              recallOffset,
            behavior: reduceMotion || !smooth ? "auto" : "smooth",
          });
          if (!smooth) {
            contentRef.current
              ?.querySelector<HTMLElement>(
                `[data-journey-row-toggle="${CSS.escape(rowId)}"]`,
              )
              ?.focus({ preventScroll: true });
          }
        });
      });
    },
    [phaseHeaderHeight, state.visualRows, zoom],
  );

  return (
    <DndContext
      id="user-journey-board-dnd-context"
      sensors={state.sensors}
      collisionDetection={closestCenter}
      onDragStart={state.handleDragStart}
      onDragEnd={state.handleDragEnd}
      onDragCancel={state.handleDragCancel}
    >
      {isMobile && !compareMode ? (
        <MobileJourneyBoard
          activePhaseIndex={activePhaseIndex}
          setActivePhaseIndex={setActivePhaseIndex}
          state={state}
          collapsedRowIds={collapsedRowIds}
          onToggleCollapsed={toggleCollapsedRow}
        />
      ) : <div className="border-ux-border min-w-0 overflow-hidden rounded-2xl border bg-ux-board/50">
        {!compareMode && !state.hasEmptyState ? (
          <div className="border-ux-border bg-ux-surface flex min-h-14 items-center justify-between gap-3 border-b px-3 md:hidden">
            <button type="button" onClick={() => scrollToPhase(Math.max(0, activePhaseIndex - 1))} disabled={activePhaseIndex === 0} className="focus-visible:ring-ux-primary flex size-11 items-center justify-center rounded-ux-control focus-visible:outline-none focus-visible:ring-2 disabled:opacity-35" aria-label="Previous phase"><ChevronLeft className="size-5" /></button>
            <p className="min-w-0 text-center text-sm font-semibold"><span className="block truncate">{state.visibleColumns[activePhaseIndex]?.label}</span><span className="text-ux-muted text-xs font-normal">{activePhaseIndex + 1} of {state.visibleColumns.length}</span></p>
            <button type="button" onClick={() => scrollToPhase(Math.min(state.visibleColumns.length - 1, activePhaseIndex + 1))} disabled={activePhaseIndex === state.visibleColumns.length - 1} className="focus-visible:ring-ux-primary flex size-11 items-center justify-center rounded-ux-control focus-visible:outline-none focus-visible:ring-2 disabled:opacity-35" aria-label="Next phase"><ChevronRight className="size-5" /></button>
          </div>
        ) : null}
        <div
          id="journey-board-scroll-region"
          ref={scrollRef}
          className="journey-board-scroll relative min-w-0 overflow-auto overscroll-contain"
          style={{
            maxHeight: scrollViewportHeight
              ? `${scrollViewportHeight}px`
              : `calc(100vh - ${state.hasEmptyState ? 16 : 21.25}rem)`,
          }}
          onWheel={state.handleWheel}
          onScroll={() => {
            const element = scrollRef.current;
            if (!element) return;
            setScrollMetrics(
              getHorizontalScrollMetrics(element.scrollWidth, element.clientWidth, element.scrollLeft),
            );
            updateRecalledRows();
          }}
        >
          <div
            ref={contentRef}
            data-testid="journey-board-scale-wrapper"
            className="origin-top-left transition-transform motion-reduce:transition-none"
            style={{ zoom, minWidth: "100%", width: "fit-content" }}
          >
            {recalledRowIds.length > 0 ? (
              <JourneyRecallRows
                compareMode={compareMode}
                journeys={journeys}
                state={state}
                rowIds={recalledRowIds}
                top={zoom ? phaseHeaderHeight / zoom : phaseHeaderHeight}
                scrollLeft={scrollMetrics.progress * scrollMetrics.maxScroll}
                zoom={zoom}
                onActivate={scrollToRow}
              />
            ) : null}
            <JourneyGrid
              compareMode={compareMode}
              journeys={journeys}
              state={state}
              collapsedRowIds={collapsedRowIds}
              recalledRowIds={recalledRowIds}
              onToggleCollapsed={toggleCollapsedRow}
            />
          </div>
        </div>
        {!state.hasEmptyState ? (
          <JourneyBoardFooter
            state={state}
            scrollMetrics={scrollMetrics}
            onScrollTo={(progress) => {
              const element = scrollRef.current;
              if (element) element.scrollLeft = progress * scrollMetrics.maxScroll;
            }}
          />
        ) : null}
      </div>}
      <BoardDragOverlay state={state} />
      <div
        className={clsx(
          "pointer-events-none fixed inset-0 z-(--z-ux-scrim) bg-ux-scrim/40 transition-opacity duration-(--ux-duration-scrim) motion-reduce:transition-none",
          state.activeId ? "opacity-100" : "opacity-0",
        )}
      />
      <TrashDropZone active={!!state.activeId} />
    </DndContext>
  );
}

function MobileJourneyBoard({
  activePhaseIndex,
  setActivePhaseIndex,
  state,
  collapsedRowIds,
  onToggleCollapsed,
}: {
  activePhaseIndex: number;
  setActivePhaseIndex: (index: number) => void;
  state: UserJourneyBoardState;
  collapsedRowIds: Set<string>;
  onToggleCollapsed: (rowId: string) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const column = state.visibleColumns[activePhaseIndex] ?? state.visibleColumns[0];
  const journey = state.primaryJourney;
  if (!column) return null;

  const openAddItem = (rowId: string) => {
    setAddNoteOpen(false);
    requestAnimationFrame(() => state.setActiveCell({
      journeyType: journey.meta.journeyType || "onboarding",
      personaSlug: state.getPersonaSlug(journey.meta.persona),
      rowId,
      columnId: column.id,
    }));
  };

  return (
    <div className="border-ux-border bg-ux-surface flex h-full min-h-0 flex-col overflow-hidden rounded-ux-panel border">
      <div className="bg-[var(--journey-phase-1)] flex min-h-ux-header items-center justify-between gap-3 px-3">
        <button type="button" onClick={() => setActivePhaseIndex(Math.max(0, activePhaseIndex - 1))} disabled={activePhaseIndex === 0} className="bg-ux-canvas focus-visible:ring-ux-primary flex size-11 items-center justify-center rounded-ux-control focus-visible:outline-none focus-visible:ring-2 disabled:opacity-35" aria-label="Previous phase"><ChevronLeft className="size-5" /></button>
        <p className="min-w-0 text-center"><span className="block truncate text-base font-semibold">{column.label}</span><span className="text-ux-muted block truncate text-xs">{activePhaseIndex + 1} of {state.visibleColumns.length}{column.subtitle ? ` · ${column.subtitle}` : ""}</span></p>
        <button type="button" onClick={() => setActivePhaseIndex(Math.min(state.visibleColumns.length - 1, activePhaseIndex + 1))} disabled={activePhaseIndex === state.visibleColumns.length - 1} className="bg-ux-canvas focus-visible:ring-ux-primary flex size-11 items-center justify-center rounded-ux-control focus-visible:outline-none focus-visible:ring-2 disabled:opacity-35" aria-label="Next phase"><ChevronRight className="size-5" /></button>
      </div>
      {searchOpen ? <div className="border-ux-border border-b p-3"><label className="relative block"><span className="sr-only">Search journey</span><Search className="text-ux-muted absolute left-3 top-1/2 size-4 -translate-y-1/2"/><input type="search" autoFocus value={state.searchQuery} onChange={(event) => state.setSearchQuery(event.target.value)} placeholder="Search journey…" className="border-ux-input focus-visible:ring-ux-primary h-11 w-full rounded-ux-control border bg-transparent pl-10 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2" /></label></div> : null}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
        {state.visualRows.map((row) => (
          <MobileJourneyRow
            key={row.id}
            row={row}
            column={column}
            journey={journey}
            collapsed={collapsedRowIds.has(row.id)}
            searchQuery={state.searchQuery}
            getItemId={state.getItemId}
            getCellId={state.getCellId}
            onAddItem={(targetJourney, columnId) => state.setActiveCell({ journeyType: targetJourney.meta.journeyType || "onboarding", personaSlug: state.getPersonaSlug(targetJourney.meta.persona), rowId: row.id, columnId })}
            onEditItem={(targetJourney, columnId, itemIndex, item) => state.setEditingItem({ journeyType: targetJourney.meta.journeyType || "onboarding", personaSlug: state.getPersonaSlug(targetJourney.meta.persona), rowId: row.id, columnId, itemIndex, initialValues: { text: item.text, emphasis: item.emphasis } })}
            onContextMenu={(event, targetJourney, columnId, itemIndex, item) => state.setContextMenu({ position: { x: event.clientX, y: event.clientY }, journeyType: targetJourney.meta.journeyType || "onboarding", personaSlug: state.getPersonaSlug(targetJourney.meta.persona), rowId: row.id, columnId, itemIndex, text: item.text, emphasis: item.emphasis })}
            onEditRow={state.handleEditRow}
            onToggleCollapsed={onToggleCollapsed}
          />
        ))}
        <div className="py-4"><UserJourneyBoardNotes journey={journey} /></div>
      </div>
      <div className="border-ux-border flex shrink-0 items-center gap-2 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Sheet open={addNoteOpen} onOpenChange={setAddNoteOpen}>
          <SheetTrigger asChild><Button variant="inverse" className="h-11 min-w-0 flex-1"><Plus className="size-4" /> Add note</Button></SheetTrigger>
          <SheetContent side="bottom" className="dev-theme font-sans"><SheetHeader className="text-left"><SheetTitle>Add note</SheetTitle><SheetDescription>Choose a journey section for {column.label}.</SheetDescription></SheetHeader><SheetBody className="grid gap-2">{state.visualRows.map((row) => <Button key={row.id} variant="outline" className="h-11 justify-start" onClick={() => openAddItem(row.id)}>{row.label}</Button>)}</SheetBody></SheetContent>
        </Sheet>
        <Button variant="outline" size="icon" className="size-11" onClick={() => setSearchOpen((open) => !open)} aria-pressed={searchOpen} aria-label="Search journey"><Search className="size-5" /></Button>
        <Sheet>
          <SheetTrigger asChild><Button variant="outline" size="icon" className="size-11" aria-label="Journey actions"><MoreHorizontal className="size-5" /></Button></SheetTrigger>
          <SheetContent side="bottom" className="dev-theme font-sans"><SheetHeader className="text-left"><SheetTitle>Journey actions</SheetTitle><SheetDescription>Manage content, import and export.</SheetDescription></SheetHeader><SheetBody className="grid gap-5"><div className="grid gap-2"><p className="text-ux-muted text-xs font-medium">Content</p><Button variant="outline" className="h-11 justify-start" onClick={() => state.setIsAddColumnOpen(true)}><Plus className="size-4"/> Add column</Button><Button variant="outline" className="h-11 justify-start" onClick={() => state.setIsAddRowOpen(true)}><Plus className="size-4"/> Add row</Button></div><div className="grid grid-cols-2 gap-2"><Button variant="outline" className="h-11" onClick={state.handleExportCsv}><FileDown className="size-4"/> Export</Button><Button variant="outline" className="h-11" onClick={state.handleImportClick}><FileUp className="size-4"/> Import</Button></div></SheetBody></SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

function JourneyGrid({
  compareMode,
  journeys,
  state,
  collapsedRowIds,
  recalledRowIds,
  onToggleCollapsed,
}: {
  compareMode: boolean;
  journeys: JourneyData[];
  state: UserJourneyBoardState;
  collapsedRowIds: Set<string>;
  recalledRowIds: string[];
  onToggleCollapsed: (rowId: string) => void;
}) {
  return (
    <div
      className="journey-responsive-grid isolate grid gap-0 text-left"
      role="grid"
      aria-label="User Journey Board"
      style={{
        "--journey-columns-desktop": getGridTemplateColumns(compareMode, journeys, state),
        "--journey-columns-mobile": getMobileGridTemplateColumns(compareMode, journeys, state),
      } as React.CSSProperties}
    >
      {!state.hasEmptyState && <JourneySectionsHeader />}
      <JourneyColumnHeaders compareMode={compareMode} journeys={journeys} state={state} />
      {state.hasEmptyState && (
        <EmptyStateOverlay
          onImport={state.handleImportClick}
          startColumn={1}
          onAddColumn={() => state.setIsAddColumnOpen(true)}
          onImportFromPersona={() => state.setIsImportFromPersonaOpen(true)}
          hasOtherPersonas={state.otherPersonas.length > 0}
        />
      )}
      {!state.hasEmptyState && (
        <JourneyRows
          compareMode={compareMode}
          journeys={journeys}
          state={state}
          collapsedRowIds={collapsedRowIds}
          recalledRowIds={recalledRowIds}
          onToggleCollapsed={onToggleCollapsed}
        />
      )}
    </div>
  );
}

function JourneyBoardFooter({
  state,
  scrollMetrics,
  onScrollTo,
}: {
  state: UserJourneyBoardState;
  scrollMetrics: ReturnType<typeof getHorizontalScrollMetrics>;
  onScrollTo: (progress: number) => void;
}) {
  const grabOffsetRef = useRef(0);
  const handleTrackPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    onScrollTo(getScrollProgressFromPointer(
      bounds.width,
      event.clientX - bounds.left,
      scrollMetrics.thumbRatio,
      grabOffsetRef.current,
    ));
  };

  return (
    <div className="border-ux-border bg-ux-surface flex h-[84px] w-full flex-col border-t px-4 py-2">
      <div className="flex h-11 items-center justify-between gap-4">
        <Button variant="outline" onClick={() => state.setIsAddRowOpen(true)} className="h-11 gap-2">
          <Plus className="size-4" /> Add Row
        </Button>
        {scrollMetrics.hasOverflow ? (
          <p className="text-ux-muted flex items-center gap-2 text-sm">
            Scroll to compare all phases <ArrowRight className="size-4" aria-hidden="true" />
          </p>
        ) : null}
      </div>
      {scrollMetrics.hasOverflow ? (
        <div
          role="scrollbar"
          aria-label="Scroll user journey phases"
          aria-controls="journey-board-scroll-region"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(scrollMetrics.progress * 100)}
          tabIndex={0}
          onPointerDown={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const localX = event.clientX - bounds.left;
            const thumbWidth = bounds.width * scrollMetrics.thumbRatio;
            const thumbLeft = (bounds.width - thumbWidth) * scrollMetrics.progress;
            grabOffsetRef.current = localX >= thumbLeft && localX <= thumbLeft + thumbWidth
              ? localX - thumbLeft
              : thumbWidth / 2;
            event.currentTarget.setPointerCapture(event.pointerId);
            handleTrackPointer(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) handleTrackPointer(event);
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Home") onScrollTo(0);
            else if (event.key === "End") onScrollTo(1);
            else if (event.key === "ArrowLeft") onScrollTo(Math.max(0, scrollMetrics.progress - 0.1));
            else if (event.key === "ArrowRight") onScrollTo(Math.min(1, scrollMetrics.progress + 0.1));
            else return;
            event.preventDefault();
          }}
          className="focus-visible:ring-ux-primary relative h-6 touch-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
        >
          <span className="absolute inset-x-0 top-2.5 h-1 rounded-full bg-ux-track" />
          <span
            className="absolute top-2.5 h-1 rounded-full bg-ux-thumb"
            style={{
              left: `${scrollMetrics.progress * (1 - scrollMetrics.thumbRatio) * 100}%`,
              width: `${scrollMetrics.thumbRatio * 100}%`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function JourneySectionsHeader() {
  return (
    <div
      className={clsx("sticky left-0 top-0 z-(--z-ux-board) px-5 py-4", ROW_HEADER_CLASS, "bg-ux-row-header")}
      style={{ backgroundClip: "padding-box" }}
      role="columnheader"
      aria-label="Journey Sections"
      data-journey-phase-header
    >
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="grid flex-1 gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Journey Sections</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneyColumnHeaders({
  compareMode,
  journeys,
  state,
}: {
  compareMode: boolean;
  journeys: JourneyData[];
  state: UserJourneyBoardState;
}) {
  if (!compareMode) {
    return (
      <>
        {state.visibleColumns.map((column, phaseIndex) => (
          <ColumnHeader
            key={column.id}
            column={column}
            phaseIndex={phaseIndex}
            onEdit={() =>
              state.setEditingColumn({
                id: column.id,
                label: column.label,
                subtitle: column.subtitle || "",
                personaSlug: state.getPersonaSlug(state.primaryJourney.meta.persona),
              })
            }
          />
        ))}
      </>
    );
  }

  return (
    <>
      {state.compareIndices.flatMap((colIndex) =>
        journeys.map((journey, personaIndex) => {
          const column = journey.columns[colIndex];
          const personaSlug = journey.meta.persona.toLowerCase().replace(/\s+/g, "-");
          const persona =
            state.personaMap.get(personaSlug) || state.personaMap.get(journey.meta.persona);

          if (!column) {
            return (
              <div
                key={`empty-${colIndex}-${journey.meta.persona}`}
                className="border-ux-border sticky top-0 z-(--z-ux-sticky) border px-5 py-4"
                style={{ backgroundColor: getJourneyPhaseColor(colIndex) }}
                role="presentation"
              />
            );
          }

          return (
            <ColumnHeaderComparison
              key={`${column.id}-${journey.meta.persona}`}
              column={column}
              persona={persona}
              personaIndex={personaIndex}
              phaseIndex={colIndex}
              onEdit={() =>
                state.setEditingColumn({
                  id: column.id,
                  label: column.label,
                  subtitle: column.subtitle || "",
                  personaSlug: state.getPersonaSlug(journey.meta.persona),
                })
              }
            />
          );
        }),
      )}
    </>
  );
}

function JourneyRows({
  compareMode,
  journeys,
  state,
  collapsedRowIds,
  recalledRowIds,
  onToggleCollapsed,
}: {
  compareMode: boolean;
  journeys: JourneyData[];
  state: UserJourneyBoardState;
  collapsedRowIds: Set<string>;
  recalledRowIds: string[];
  onToggleCollapsed: (rowId: string) => void;
}) {
  return (
    <>
      {state.visualRows.map((row, index) => (
        <RowSection
          key={row.id}
          row={row}
          rowIndex={index}
          columns={state.visibleColumns}
          compareIndices={state.compareIndices}
          journeys={journeys}
          compareMode={compareMode}
          getItemId={state.getItemId}
          onAddItem={(journey, columnId) => {
            state.setActiveCell({
              journeyType: journey.meta.journeyType || "onboarding",
              personaSlug: state.getPersonaSlug(journey.meta.persona),
              rowId: row.id,
              columnId,
            });
          }}
          onEditItem={(journey, columnId, itemIndex, item) => {
            state.setEditingItem({
              journeyType: journey.meta.journeyType || "onboarding",
              personaSlug: state.getPersonaSlug(journey.meta.persona),
              rowId: row.id,
              columnId,
              itemIndex,
              initialValues: {
                text: item.text,
                emphasis: item.emphasis,
              },
            });
          }}
          onContextMenu={(e, journey, columnId, itemIndex, item) => {
            state.setContextMenu({
              position: { x: e.clientX, y: e.clientY },
              journeyType: journey.meta.journeyType || "onboarding",
              personaSlug: state.getPersonaSlug(journey.meta.persona),
              rowId: row.id,
              columnId,
              itemIndex,
              text: item.text,
              emphasis: item.emphasis,
            });
          }}
          onEditRow={state.handleEditRow}
          isRowEditable
          searchQuery={state.searchQuery}
          getCellId={state.getCellId}
          collapsed={collapsedRowIds.has(row.id)}
          recalled={recalledRowIds.includes(row.id)}
          onToggleCollapsed={onToggleCollapsed}
        />
      ))}
    </>
  );
}

function getGridTemplateColumns(
  compareMode: boolean,
  journeys: JourneyData[],
  state: UserJourneyBoardState,
) {
  if (compareMode) {
    return `240px repeat(${state.maxColumnsLength * journeys.length}, minmax(280px, 1fr))`;
  }
  if (state.hasEmptyState) return "1fr";
  return `240px repeat(${state.visibleColumns.length}, minmax(280px, 1fr))`;
}

function getMobileGridTemplateColumns(
  compareMode: boolean,
  journeys: JourneyData[],
  state: UserJourneyBoardState,
) {
  if (compareMode) return getGridTemplateColumns(compareMode, journeys, state);
  if (state.hasEmptyState) return "1fr";
  return `minmax(9rem, 40vw) repeat(${state.visibleColumns.length}, minmax(calc(100vw - 13rem), 1fr))`;
}

function JourneyRecallRows({
  compareMode,
  journeys,
  state,
  rowIds,
  top,
  scrollLeft,
  zoom,
  onActivate,
}: {
  compareMode: boolean;
  journeys: JourneyData[];
  state: UserJourneyBoardState;
  rowIds: string[];
  top: number;
  scrollLeft: number;
  zoom: number;
  onActivate: (rowId: string, smooth?: boolean) => void;
}) {
  const rows = useMemo(
    () => rowIds.flatMap((id) => state.visualRows.filter((row) => row.id === id)),
    [rowIds, state.visualRows],
  );

  return (
    <div className="pointer-events-none sticky z-(--z-ux-recall) h-0" style={{ top }}>
      <div
        className="border-ux-border pointer-events-auto min-w-full w-fit overflow-y-auto border-b bg-ux-surface"
        style={{ maxHeight: COLLAPSED_ROW_HEIGHT * MAX_VISIBLE_RECALLED_ROWS }}
      >
        <div
          className="journey-responsive-grid isolate grid min-w-full w-fit gap-0"
          style={{
            "--journey-columns-desktop": getGridTemplateColumns(compareMode, journeys, state),
            "--journey-columns-mobile": getMobileGridTemplateColumns(compareMode, journeys, state),
          } as React.CSSProperties}
          aria-label="Journey sections"
        >
          {rows.map((row) => (
            <JourneyRecallRow
              key={row.id}
              row={row}
              compareMode={compareMode}
              journeys={journeys}
              state={state}
              scrollLeft={scrollLeft}
              zoom={zoom}
              onActivate={onActivate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function JourneyRecallRow({
  row,
  compareMode,
  journeys,
  state,
  scrollLeft,
  zoom,
  onActivate,
}: {
  row: UserJourneyBoardState["visualRows"][number];
  compareMode: boolean;
  journeys: JourneyData[];
  state: UserJourneyBoardState;
  scrollLeft: number;
  zoom: number;
  onActivate: (rowId: string, smooth?: boolean) => void;
}) {
  const cells = compareMode
    ? state.compareIndices.flatMap((columnIndex) =>
        journeys.map((journey) => ({ journey, column: journey.columns[columnIndex] })),
      )
    : state.visibleColumns.map((column) => ({ journey: journeys[0], column }));
  const getCount = (journey: JourneyData, columnId?: string) =>
    columnId
      ? journey.rows
          .find((candidate) => candidate.id === row.id)
          ?.cells.find((cell) => cell.columnId === columnId)?.items.length ?? 0
      : 0;

  return (
    <>
      <button
        type="button"
        onClick={(event) => onActivate(row.id, event.detail !== 0)}
        className={clsx(
          "pointer-events-auto sticky left-0 z-(--z-ux-raised) flex h-12 items-center justify-between gap-3 px-5 text-left",
          ROW_HEADER_CLASS,
          "journey-recall-cell bg-ux-row-header",
        )}
        style={{ transform: `translateX(${scrollLeft / zoom}px)` }}
        aria-label={`Back to ${row.label}`}
      >
        <span className="truncate text-sm font-semibold">{row.label}</span>
        <ArrowUp className="size-4 shrink-0 text-ux-recall" aria-hidden="true" />
      </button>
      {cells.map(({ journey, column }, index) => {
        const count = getCount(journey, column?.id);
        return (
          <button
            key={`${journey.meta.persona}-${column?.id ?? index}`}
            type="button"
            onClick={(event) => onActivate(row.id, event.detail !== 0)}
            className="journey-recall-cell border-ux-border text-ux-muted pointer-events-auto flex h-12 items-center gap-2 border bg-ux-surface px-5 text-left text-xs hover:bg-ux-board"
            aria-label={`Back to ${row.label}, ${count} ${count === 1 ? "note" : "notes"}`}
          >
            <NoteCount count={count} />
          </button>
        );
      })}
    </>
  );
}
function BoardDragOverlay({ state }: { state: UserJourneyBoardState }) {
  return (
    <DragOverlay dropAnimation={null} className="z-(--z-ux-board)">
      {state.activeId ? (
        <div className="relative w-[280px] rotate-2 scale-105 cursor-grabbing opacity-90 shadow-2xl transition-transform">
          {state.isOptionPressed && (
            <div className="bg-ux-primary text-ux-on-primary absolute -top-8 left-1/2 z-(--z-ux-raised) flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium shadow-md">
              <Copy className="size-3" />
              <span>Duplicate</span>
            </div>
          )}
          <div
            className={clsx(
              state.isOptionPressed && "ring-ux-primary rounded-xl ring-2 ring-offset-2",
            )}
          >
            <StickyNote item={state.findActiveItem(state.activeId)!} />
          </div>
        </div>
      ) : null}
    </DragOverlay>
  );
}
