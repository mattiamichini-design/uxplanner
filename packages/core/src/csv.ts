import type {
  JourneyCell,
  JourneyColumn,
  JourneyData,
  JourneyItem,
  JourneyRow,
} from "./types.js";

function escapeCsv(value: string): string {
  if (value === null || value === undefined) return "";
  return `"${value.replace(/"/g, '""')}"`;
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuote = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"') {
      if (inQuote && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuote = !inQuote;
      }
    } else if (char === "," && !inQuote) {
      currentRow.push(currentCell);
      currentCell = "";
    } else if ((char === "\r" || char === "\n") && !inQuote) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (inQuote) throw new Error("Unterminated quoted CSV field");

  if (currentRow.length > 0 || currentCell.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

export function journeyToCsv(journeys: JourneyData[]): string {
  if (!journeys.length) return "";

  const isMultiPersonaExport = journeys.length > 1;
  const maxColumns = Math.max(
    ...journeys.map((journey) => journey.columns.length),
  );
  const header = ["ID", "Section", "Description"];
  const subtitles = ["SUBTITLES", "", ""];

  for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 1) {
    for (const journey of journeys) {
      const column = journey.columns[columnIndex];
      if (!column) continue;

      header.push(
        isMultiPersonaExport
          ? `(${journey.meta.persona}) ${column.label}`
          : column.label,
      );
      subtitles.push(column.subtitle || "");
    }
  }

  const csvRows = [header, subtitles];

  const allRows = [...new Map(journeys.flatMap(journey => journey.rows).map(row => [row.id, row])).values()];
  for (const row of allRows) {
    const output = [row.id, row.label, row.description || ""];

    for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 1) {
      for (const journey of journeys) {
        const column = journey.columns[columnIndex];
        if (!column) continue;

        const journeyRow =
          journey.rows.find(
            (candidate: JourneyRow) => candidate.id === row.id,
          );
        const cell = journeyRow?.cells.find(
          (candidate: JourneyCell) => candidate.columnId === column.id,
        );
        output.push(
          cell
            ? cell.items
                .map((item: JourneyItem) =>
                  item.emoji ? `${item.emoji} ${item.text}` : item.text,
                )
                .join("\n")
            : "",
        );
      }
    }

    csvRows.push(output);
  }

  return `\uFEFF${csvRows.map((row) => row.map((value) => escapeCsv(value)).join(",")).join("\n")}`;
}

export function csvToJourney(
  csvContent: string,
  templateJourney: JourneyData,
): Map<string, JourneyData> {
  const cleanContent = csvContent.startsWith("\uFEFF")
    ? csvContent.slice(1)
    : csvContent;
  const rows = parseCsv(cleanContent);
  const resultMap = new Map<string, JourneyData>();

  if (rows.length < 2) {
    throw new Error("CSV must contain ID, Section, Description and at least one journey column");
  }

  const header = rows[0];
  if (header.slice(0, 3).join(",") !== "ID,Section,Description") throw new Error("Invalid journey CSV header");
  type ColumnInfo = { persona: string; colId: string };
  const columnMapping: Record<number, ColumnInfo> = {};
  const personaColumns = new Map<string, JourneyColumn[]>();

  for (let index = 3; index < header.length; index += 1) {
    const rawLabel = header[index]?.trim();
    if (!rawLabel) continue;

    const match = rawLabel.match(/^\((.*?)\)\s*(.*)$/);
    const personaName = match?.[1] || templateJourney.meta.persona || "default";
    const actualLabel = match?.[2] || rawLabel;
    const id = actualLabel
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    let columnId = id || `col-${index}`;
    const existing = personaColumns.get(personaName) || [];
    if (existing.some(column => column.id === columnId)) columnId = `${columnId}-${index}`;
    const nextColumn: JourneyColumn = {
      id: columnId,
      label: actualLabel,
      subtitle: "",
    };

    if (!personaColumns.has(personaName)) {
      personaColumns.set(personaName, []);
    }

    personaColumns.get(personaName)?.push(nextColumn);
    columnMapping[index] = {
      persona: personaName,
      colId: nextColumn.id,
    };
  }

  if (Object.keys(columnMapping).length === 0) {
    throw new Error("CSV must contain ID, Section, Description and at least one journey column");
  }

  for (const [personaName, columns] of personaColumns.entries()) {
    resultMap.set(personaName, {
      ...templateJourney,
      meta: {
        ...templateJourney.meta,
        persona:
          personaName === "default"
            ? templateJourney.meta.persona
            : personaName,
      },
      columns,
      rows: [],
    });
  }

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const csvRow = rows[rowIndex];
    if (csvRow.length < 2) continue;

    if (csvRow[0] === "SUBTITLES") {
      for (const [index, info] of Object.entries(columnMapping)) {
        const subtitle = csvRow[Number(index)]?.trim();
        if (!subtitle) continue;

        const journey = resultMap.get(info.persona);
        const column = journey?.columns.find(
          (candidate: JourneyColumn) => candidate.id === info.colId,
        );
        if (column) {
          column.subtitle = subtitle;
        }
      }
      continue;
    }

    const id = csvRow[0]?.trim() || `row-${rowIndex}`;
    const label = csvRow[1]?.trim() || "Untitled Section";
    const description = csvRow[2]?.trim() || "";

    for (const [personaName, journey] of resultMap.entries()) {
      const cells: JourneyCell[] = [];

      for (const [index, info] of Object.entries(columnMapping)) {
        if (info.persona !== personaName) continue;

        const cellContent = csvRow[Number(index)];
        if (!cellContent) continue;

        const items: JourneyItem[] = cellContent
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((text) => ({ text }));

        if (items.length > 0) {
          cells.push({ columnId: info.colId, items });
        }
      }

      journey.rows.push({ id, label, description, cells });
    }
  }

  return resultMap;
}
