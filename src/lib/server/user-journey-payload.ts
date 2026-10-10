import "server-only";

import type {
  JourneyCell,
  JourneyColumn,
  JourneyData,
  JourneyItem,
  JourneyMeta,
  JourneyRow,
} from "@/lib/user-journey/types";
import { assertSafePathSegment } from "@/lib/server/resolve-inside-root";
import {
  assertBoundedArray,
  assertBoundedBoolean,
  assertBoundedIndex,
  assertBoundedRecord,
  assertBoundedString,
  optionalBoundedString,
} from "@/lib/server/action-payload";

const MAX_JOURNEY_COLUMNS = 100;
const MAX_JOURNEY_ROWS = 100;
const MAX_JOURNEY_CELLS_PER_ROW = 100;
const MAX_JOURNEY_ITEMS_PER_CELL = 100;
const MAX_JOURNEY_ITEMS = 5_000;

export function parseJourneySlug(value: unknown, field = "journey slug"): string {
  const slug = assertBoundedString(value, field, {
    minLength: 1,
    maxLength: 120,
    singleLine: true,
  });
  assertSafePathSegment(slug);
  return slug;
}

export function parseJourneyIdentifier(value: unknown, field: string): string {
  return assertBoundedString(value, field, {
    minLength: 1,
    maxLength: 160,
    singleLine: true,
  });
}

export function parseJourneyText(value: unknown, field: string, maxLength = 10_000): string {
  return assertBoundedString(value, field, { maxLength });
}

export function parseJourneyBoolean(value: unknown, field: string): boolean {
  return assertBoundedBoolean(value, field);
}

export function parseJourneyIndex(value: unknown, field: string): number {
  return assertBoundedIndex(value, field);
}

export function parseOptionalJourneyIdentifier(value: unknown, field: string): string | undefined {
  return value === undefined ? undefined : parseJourneyIdentifier(value, field);
}

export function parseJourneyItemUpdate(value: unknown): JourneyItem {
  const item = assertBoundedRecord(value, "journey item", {
    maxKeys: 3,
    allowedKeys: ["text", "emoji", "emphasis"],
  });
  const text = parseJourneyText(item.text, "journey item text");
  const emoji = optionalBoundedString(item.emoji, "journey item emoji", { maxLength: 32 });
  const emphasis = item.emphasis;

  if (emphasis !== undefined && emphasis !== "positive" && emphasis !== "neutral" && emphasis !== "negative") {
    throw new Error("Invalid journey item emphasis");
  }

  return { text, ...(emoji === undefined ? {} : { emoji }), ...(emphasis === undefined ? {} : { emphasis }) };
}

export function parseJourneyData(value: unknown): JourneyData {
  const data = assertBoundedRecord(value, "journey data", {
    maxKeys: 8,
    allowedKeys: ["title", "meta", "columns", "rows", "notes", "actors", "content", "uxArtifact"],
  });
  const title = parseJourneyText(data.title, "journey title", 500);
  const meta = parseJourneyMeta(data.meta);
  let itemCount = 0;
  const columns = assertBoundedArray(data.columns, "journey columns", {
    maxLength: MAX_JOURNEY_COLUMNS,
    itemName: "journey column",
    parseItem: parseJourneyColumn,
  });
  const rows = assertBoundedArray(data.rows, "journey rows", {
    maxLength: MAX_JOURNEY_ROWS,
    itemName: "journey row",
    parseItem: (row) => {
      const parsed = parseJourneyRow(row);
      itemCount += parsed.cells.reduce((count, cell) => count + cell.items.length, 0);
      if (itemCount > MAX_JOURNEY_ITEMS) throw new Error("Invalid journey data");
      return parsed;
    },
  });
  if (new Set(columns.map(c => c.id)).size !== columns.length || new Set(rows.map(r => r.id)).size !== rows.length) throw new Error("Duplicate journey IDs");
  const columnIds = new Set(columns.map(c => c.id));
  for (const row of rows) {
    if (new Set(row.cells.map(c => c.columnId)).size !== row.cells.length || row.cells.some(c => !columnIds.has(c.columnId))) throw new Error("Invalid journey cell reference");
  }
  const notes =
    data.notes === undefined
      ? undefined
      : assertBoundedArray(data.notes, "journey notes", {
          maxLength: 100,
          itemName: "journey note",
          parseItem: (note, field) => parseJourneyText(note, field, 4_000),
        });
  const actors =
    data.actors === undefined
      ? undefined
      : assertBoundedArray(data.actors, "journey actors", {
          maxLength: 100,
          itemName: "journey actor",
          parseItem: parseJourneyActor,
        });
  const content =
    data.content === undefined ? undefined : parseJourneyText(data.content, "journey content", 100_000);

  let uxArtifact: JourneyData["uxArtifact"];
  if (data.uxArtifact !== undefined) {
    const artifact = assertBoundedRecord(data.uxArtifact, "UX artifact", {maxKeys:4, allowedKeys:["id","canonicalRecord","role","stepIds"]});
    uxArtifact = {
      id: parseJourneyIdentifier(artifact.id,"artifact id"),
      canonicalRecord: parseJourneyText(artifact.canonicalRecord,"canonical record",500),
      role: parseJourneyText(artifact.role,"artifact role",100),
      stepIds: assertBoundedArray(artifact.stepIds,"artifact steps",{maxLength:100,itemName:"step",parseItem:(id,field)=>parseJourneyIdentifier(id,field)}),
    };
  }
  return { title, meta, columns, rows, notes, actors, content, ...(uxArtifact ? {uxArtifact} : {}) };
}

function parseJourneyMeta(value: unknown): JourneyMeta {
  const meta = assertBoundedRecord(value, "journey metadata", {
    maxKeys: 5,
    allowedKeys: ["persona", "journeyType", "updatedAt", "tags", "summary"],
  });
  const persona = parseJourneyText(meta.persona, "journey persona", 500);
  const journeyType = optionalBoundedString(meta.journeyType, "journey metadata type", {
    maxLength: 120,
    singleLine: true,
  });
  const updatedAt = optionalBoundedString(meta.updatedAt, "journey update timestamp", { maxLength: 80 });
  const tags =
    meta.tags === undefined
      ? undefined
      : assertBoundedArray(meta.tags, "journey tags", {
          maxLength: 30,
          itemName: "journey tag",
          parseItem: (tag, field) => assertBoundedString(tag, field, { maxLength: 100 }),
        });
  const summary = optionalBoundedString(meta.summary, "journey summary", { maxLength: 4_000 });

  return { persona, journeyType, updatedAt, tags, summary };
}

function parseJourneyColumn(value: unknown): JourneyColumn {
  const column = assertBoundedRecord(value, "journey column", {
    maxKeys: 3,
    allowedKeys: ["id", "label", "subtitle"],
  });

  return {
    id: parseJourneyIdentifier(column.id, "journey column id"),
    label: parseJourneyText(column.label, "journey column label", 500),
    subtitle: optionalBoundedString(column.subtitle, "journey column subtitle", { maxLength: 2_000 }),
  };
}

function parseJourneyRow(value: unknown): JourneyRow {
  const row = assertBoundedRecord(value, "journey row", {
    maxKeys: 4,
    allowedKeys: ["id", "label", "description", "cells"],
  });

  return {
    id: parseJourneyIdentifier(row.id, "journey row id"),
    label: parseJourneyText(row.label, "journey row label", 500),
    description: optionalBoundedString(row.description, "journey row description", {
      maxLength: 4_000,
    }),
    cells: assertBoundedArray(row.cells, "journey row cells", {
      maxLength: MAX_JOURNEY_CELLS_PER_ROW,
      itemName: "journey cell",
      parseItem: parseJourneyCell,
    }),
  };
}

function parseJourneyCell(value: unknown): JourneyCell {
  const cell = assertBoundedRecord(value, "journey cell", {
    maxKeys: 2,
    allowedKeys: ["columnId", "items"],
  });

  return {
    columnId: parseJourneyIdentifier(cell.columnId, "journey cell column id"),
    items: assertBoundedArray(cell.items, "journey cell items", {
      maxLength: MAX_JOURNEY_ITEMS_PER_CELL,
      itemName: "journey item",
      parseItem: parseJourneyItem,
    }),
  };
}

function parseJourneyItem(value: unknown): JourneyItem {
  return parseJourneyItemUpdate(value);
}

function parseJourneyActor(value: unknown): { id: string; label: string } {
  const actor = assertBoundedRecord(value, "journey actor", {
    maxKeys: 2,
    allowedKeys: ["id", "label"],
  });

  return {
    id: parseJourneyIdentifier(actor.id, "journey actor id"),
    label: parseJourneyText(actor.label, "journey actor label", 500),
  };
}
