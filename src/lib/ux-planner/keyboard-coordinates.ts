type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type HorizontalCellCoordinatesOptions = {
  code: string;
  activeId: string | number;
  collisionRect: Rect | null;
  candidates: Iterable<{ id: string | number; rect?: Rect }>;
};

export function getHorizontalCellCoordinates({
  code,
  activeId,
  collisionRect,
  candidates,
}: HorizontalCellCoordinatesOptions) {
  if (!collisionRect || (code !== "ArrowLeft" && code !== "ArrowRight")) return undefined;

  const [journeyType, persona, row, column] = String(activeId).split("::");
  if (!journeyType || !persona || !row || !column) return undefined;

  const movingRight = code === "ArrowRight";
  const cells = [...candidates].flatMap(({ id, rect }) => {
    const [prefix, candidateType, , candidateRow] = String(id).split("::");
    if (
      !rect ||
      prefix !== "cell" ||
      candidateType !== journeyType ||
      candidateRow !== row
    ) {
      return [];
    }

    return [{ id, rect }];
  });
  const collisionCenter = {
    x: collisionRect.left + collisionRect.width / 2,
    y: collisionRect.top + collisionRect.height / 2,
  };
  const currentCellId = cells.find(
    ({ rect }) =>
      collisionCenter.x >= rect.left &&
      collisionCenter.x <= rect.left + rect.width &&
      collisionCenter.y >= rect.top &&
      collisionCenter.y <= rect.top + rect.height,
  )?.id;
  const target = cells
    .flatMap(({ id, rect }) => {
      if (id === currentCellId) return [];

      const horizontalDistance = rect.left - collisionRect.left;
      if ((movingRight && horizontalDistance <= 0) || (!movingRight && horizontalDistance >= 0)) {
        return [];
      }

      return [{ rect, distance: Math.abs(horizontalDistance) }];
    })
    .sort((a, b) => a.distance - b.distance)[0];

  if (!target) return undefined;

  return {
    x: target.rect.left + (target.rect.width - collisionRect.width) / 2,
    y: target.rect.top + (target.rect.height - collisionRect.height) / 2,
  };
}
