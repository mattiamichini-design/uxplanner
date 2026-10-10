"use client";
import { memo, useMemo } from "react";
import type { MouseEvent } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import clsx from "clsx";
import { ChevronDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { JourneyColumn, JourneyData, JourneyItem, JourneyRow } from "@/lib/user-journey/types";

import { ROW_HEADER_CLASS } from "./journey-board-section-constants";
import { DroppableCell } from "./droppable-cell";
import { RowEditButton } from "./row-edit-button";
import { SortableItem } from "./sortable-item";
import { StickyNote } from "./sticky-note";
import { NoteCount } from "./note-count";

interface RowSectionProps {
  row: JourneyRow;
  columns: JourneyColumn[];
  compareIndices: number[];
  journeys: JourneyData[];
  compareMode: boolean;
  getItemId: (journey: JourneyData, rowId: string, columnId: string, index: number) => string;
  onAddItem: (journey: JourneyData, columnId: string) => void;
  onEditItem: (
    journey: JourneyData,
    columnId: string,
    itemIndex: number,
    item: JourneyItem,
  ) => void;
  onContextMenu: (
    e: MouseEvent,
    journey: JourneyData,
    columnId: string,
    itemIndex: number,
    item: JourneyItem,
  ) => void;
  searchQuery: string;
  rowIndex: number;
  getCellId?: (journey: JourneyData, rowId: string, columnId: string) => string;
  isRowEditable?: boolean;
  onEditRow?: (rowId: string) => void;
  collapsed?: boolean;
  recalled?: boolean;
  onToggleCollapsed?: (rowId: string) => void;
}

export const RowSection = memo(function RowSection({
  row,
  columns,
  compareIndices,
  journeys,
  compareMode,
  getItemId,
  onAddItem,
  onEditItem,
  onContextMenu,
  searchQuery,
  rowIndex,
  getCellId,
  isRowEditable = false,
  onEditRow,
  collapsed = false,
  recalled = false,
  onToggleCollapsed,
}: RowSectionProps) {
  const journeyRowsMap = useMemo(() => {
    const map = new Map<string, JourneyRow>();
    journeys.forEach((journey) => {
      const journeyRow = journey.rows.find((candidate) => candidate.id === row.id);
      if (journeyRow) {
        map.set(journey.meta.persona, journeyRow);
      }
    });
    return map;
  }, [journeys, row.id]);

  return (
    <>
      <div
        className={clsx(
          "group sticky left-0 z-(--z-ux-lifted) px-5",
          ROW_HEADER_CLASS,
          "bg-ux-row-header",
          collapsed ? "h-12 py-0" : "py-4",
        )}
        style={{ gridRow: rowIndex + 2, gridColumn: 1 }}
        role="rowheader"
        data-journey-row={row.id}
      >
        <div
          aria-hidden={recalled || undefined}
          inert={recalled || undefined}
          className={clsx(
            "grid transition-opacity duration-(--ux-duration-fast) ease-[var(--ux-ease-out)] motion-reduce:transition-none",
            collapsed ? "h-full items-center" : "content-start gap-2",
            recalled && "pointer-events-none opacity-0",
          )}
        >
          <div className="flex items-center gap-2">
            <p className="text-ux-text min-w-0 flex-1 truncate text-sm font-semibold">
              {row.label}
            </p>
            {isRowEditable && onEditRow ? (
              <RowEditButton label={row.label} rowId={row.id} onEdit={onEditRow} />
            ) : null}
            <button
              type="button"
              onClick={() => onToggleCollapsed?.(row.id)}
              data-journey-row-toggle={row.id}
              className="focus-visible:ring-ux-primary -mr-1 flex size-7 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2"
              aria-expanded={!collapsed}
              aria-label={`${collapsed ? "Expand" : "Collapse"} ${row.label}`}
            >
              <ChevronDown
                className={clsx(
                  "size-4 text-ux-recall transition-transform duration-(--ux-duration-fast) ease-[var(--ux-ease-out)] motion-reduce:transition-none",
                  collapsed && "-rotate-90",
                )}
                aria-hidden="true"
              />
            </button>
          </div>
          {!collapsed && row.description ? (
            <p className="text-ux-muted text-xs">{row.description}</p>
          ) : null}
        </div>
      </div>

      {!compareMode
        ? columns.map((column) => {
            const primaryJourney = journeys[0];
            const journeyRow = journeyRowsMap.get(primaryJourney.meta.persona);
            const cell = journeyRow?.cells.find(
              (candidate) => candidate.columnId === column.id,
            ) || {
              columnId: column.id,
              items: [],
            };
            const itemIds = cell.items.map((_, index) =>
              getItemId(primaryJourney, row.id, column.id, index),
            );

            return (
              <JourneyCell
                key={`${row.id}-${column.id}`}
                cellId={
                  getCellId
                    ? getCellId(primaryJourney, row.id, column.id)
                    : `cell-${row.id}-${column.id}-${primaryJourney.meta.persona}`
                }
                items={cell.items}
                itemIds={itemIds}
                journey={primaryJourney}
                columnId={column.id}
                rowId={row.id}
                searchQuery={searchQuery}
                onAddItem={onAddItem}
                onEditItem={onEditItem}
                onContextMenu={onContextMenu}
                getItemId={getItemId}
                collapsed={collapsed}
                onExpand={() => onToggleCollapsed?.(row.id)}
              />
            );
          })
        : compareIndices.flatMap((columnIndex) =>
            journeys.map((journey) => {
              const column = journey.columns[columnIndex];
              if (!column) {
                return (
                  <div
                    key={`empty-cell-${row.id}-${columnIndex}-${journey.meta.persona}`}
                    className={clsx(
                      "border-ux-border hover:bg-ux-soft/30 border px-5 transition-colors max-md:rounded-ux-control",
                      collapsed ? "h-12 py-0" : "py-4",
                    )}
                  />
                );
              }

              const journeyRow = journeyRowsMap.get(journey.meta.persona);
              const cell = journeyRow?.cells.find(
                (candidate) => candidate.columnId === column.id,
              ) || {
                columnId: column.id,
                items: [],
              };
              const itemIds = cell.items.map((_, index) =>
                getItemId(journey, row.id, column.id, index),
              );
              const cellId = getCellId ? getCellId(journey, row.id, column.id) : undefined;

              return (
                <DroppableCell
                  key={`${row.id}-${column.id}-${journey.meta.persona}`}
                  cellId={cellId || `cell-${row.id}-${column.id}-${journey.meta.persona}`}
                  className={clsx(
                    "border-ux-border hover:bg-ux-soft/30 group relative cursor-pointer border px-5 transition-colors max-md:rounded-ux-control",
                    collapsed ? "h-12 py-0" : "py-4",
                  )}
                  onClick={() =>
                    collapsed ? onToggleCollapsed?.(row.id) : onAddItem(journey, column.id)
                  }
                >
                  <JourneyCellContent
                    emptyLabel="Not defined yet"
                    items={cell.items}
                    itemIds={itemIds}
                    journey={journey}
                    columnId={column.id}
                    rowId={row.id}
                    searchQuery={searchQuery}
                    onAddItem={onAddItem}
                    onEditItem={onEditItem}
                    onContextMenu={onContextMenu}
                    getItemId={getItemId}
                    collapsed={collapsed}
                  />
                </DroppableCell>
              );
            }),
          )}
    </>
  );
});

export function MobileJourneyRow({
  row,
  column,
  journey,
  collapsed,
  searchQuery,
  getItemId,
  getCellId,
  onAddItem,
  onEditItem,
  onContextMenu,
  onEditRow,
  onToggleCollapsed,
}: {
  row: JourneyRow;
  column: JourneyColumn;
  journey: JourneyData;
  collapsed: boolean;
  searchQuery: string;
  getItemId: RowSectionProps["getItemId"];
  getCellId?: RowSectionProps["getCellId"];
  onAddItem: RowSectionProps["onAddItem"];
  onEditItem: RowSectionProps["onEditItem"];
  onContextMenu: RowSectionProps["onContextMenu"];
  onEditRow?: RowSectionProps["onEditRow"];
  onToggleCollapsed: (rowId: string) => void;
}) {
  const journeyRow = journey.rows.find((candidate) => candidate.id === row.id);
  const cell = journeyRow?.cells.find((candidate) => candidate.columnId === column.id) ?? {
    columnId: column.id,
    items: [],
  };
  const itemIds = cell.items.map((_, index) => getItemId(journey, row.id, column.id, index));

  return (
    <section className="grid min-w-0 gap-3 border-b border-ux-border py-4 last:border-b-0">
      <div className="flex min-h-11 items-center gap-2">
        <button type="button" onClick={() => onToggleCollapsed(row.id)} aria-expanded={!collapsed} className="focus-visible:ring-ux-primary flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 rounded-ux-control text-start focus-visible:outline-none focus-visible:ring-2">
          <span className="min-w-0"><span className="block truncate text-sm font-semibold">{row.label}</span>{row.description ? <span className="text-ux-muted block truncate text-xs">{row.description}</span> : null}</span>
          <ChevronDown className={clsx("text-ux-recall size-4 shrink-0 transition-transform motion-reduce:transition-none", collapsed && "-rotate-90")} aria-hidden="true" />
        </button>
        {onEditRow ? <RowEditButton label={row.label} rowId={row.id} onEdit={onEditRow} /> : null}
      </div>
      {!collapsed ? (
        <JourneyCell
          cellId={getCellId?.(journey, row.id, column.id) ?? `cell-${row.id}-${column.id}-${journey.meta.persona}`}
          items={cell.items}
          itemIds={itemIds}
          journey={journey}
          columnId={column.id}
          rowId={row.id}
          searchQuery={searchQuery}
          onAddItem={onAddItem}
          onEditItem={onEditItem}
          onContextMenu={onContextMenu}
          getItemId={getItemId}
        />
      ) : <NoteCount count={cell.items.length} />}
    </section>
  );
}

function JourneyCell({
  cellId,
  items,
  itemIds,
  journey,
  columnId,
  rowId,
  searchQuery,
  onAddItem,
  onEditItem,
  onContextMenu,
  getItemId,
  collapsed = false,
  onExpand,
}: JourneyCellContentProps & { cellId: string; onExpand?: () => void }) {
  const handleAddItem = () => (collapsed ? onExpand?.() : onAddItem(journey, columnId));

  return (
    <DroppableCell
      cellId={cellId}
      className={clsx(
        "border-ux-border hover:bg-ux-soft/30 group relative cursor-pointer border px-5 transition-colors max-md:rounded-ux-control",
        collapsed ? "h-12 py-0" : "py-4",
      )}
      onClick={handleAddItem}
    >
      <JourneyCellContent
        emptyLabel="Not defined yet"
        items={items}
        itemIds={itemIds}
        journey={journey}
        columnId={columnId}
        rowId={rowId}
        searchQuery={searchQuery}
        onAddItem={onAddItem}
        onEditItem={onEditItem}
        onContextMenu={onContextMenu}
        getItemId={getItemId}
        collapsed={collapsed}
      />
    </DroppableCell>
  );
}

interface JourneyCellContentProps {
  emptyLabel?: string;
  items: JourneyItem[];
  itemIds: string[];
  journey: JourneyData;
  columnId: string;
  rowId: string;
  searchQuery: string;
  onAddItem: (journey: JourneyData, columnId: string) => void;
  onEditItem: (
    journey: JourneyData,
    columnId: string,
    itemIndex: number,
    item: JourneyItem,
  ) => void;
  onContextMenu: (
    e: MouseEvent,
    journey: JourneyData,
    columnId: string,
    itemIndex: number,
    item: JourneyItem,
  ) => void;
  getItemId: (journey: JourneyData, rowId: string, columnId: string, index: number) => string;
  collapsed?: boolean;
}

function JourneyCellContent({
  emptyLabel = "Not defined yet",
  items,
  itemIds,
  journey,
  columnId,
  rowId,
  searchQuery,
  onAddItem,
  onEditItem,
  onContextMenu,
  getItemId,
  collapsed = false,
}: JourneyCellContentProps) {
  if (collapsed) {
    return (
      <div className="flex h-12 items-center text-xs">
        <NoteCount count={items.length} />
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-3">
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {items.length === 0 ? (
          <div className="border-ux-muted/40 text-ux-muted hover:bg-ux-soft/50 cursor-pointer rounded-xl border border-dashed px-4 py-3 text-xs transition-colors">
            {emptyLabel}
          </div>
        ) : (
          items.map((item, index) => {
            const id = getItemId(journey, rowId, columnId, index);
            return (
              <SortableItem key={id} id={id}>
                <StickyNote
                  item={item}
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditItem(journey, columnId, index, item);
                  }}
                  onContextMenu={(event) => onContextMenu(event, journey, columnId, index, item)}
                  searchQuery={searchQuery}
                />
              </SortableItem>
            );
          })
        )}
      </SortableContext>

      <Button
        type="button"
        size="icon"
        className="border-ux-border bg-ux-canvas text-ux-text hover:bg-ux-soft hover:text-ux-text absolute bottom-2 right-2 size-11 border shadow-none transition-colors md:size-7 md:opacity-0 md:focus:opacity-100 md:group-hover:opacity-100"
        onClick={(event) => {
          event.stopPropagation();
          onAddItem(journey, columnId);
        }}
        aria-label="Add item"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
