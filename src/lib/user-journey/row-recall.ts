export const COLLAPSED_ROW_HEIGHT = 48;
export const MAX_VISIBLE_RECALLED_ROWS = 4;

export function getRecalledRowIds(
  rows: ReadonlyArray<{ id: string; top: number }>,
  cutoff: number,
  stackStep = 0,
) {
  const recalled: string[] = [];
  for (const row of rows) {
    const stackOffset = Math.min(recalled.length, MAX_VISIBLE_RECALLED_ROWS) * stackStep;
    if (row.top < cutoff + stackOffset - 1) recalled.push(row.id);
  }
  return recalled;
}

export function getRecallOffset(rowIndex: number, zoom: number) {
  return (
    Math.min(Math.max(rowIndex, 0), MAX_VISIBLE_RECALLED_ROWS) *
    COLLAPSED_ROW_HEIGHT *
    zoom
  );
}
