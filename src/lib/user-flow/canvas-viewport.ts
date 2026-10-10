export const FLOW_MIN_ZOOM = 0.1;
export const FLOW_MAX_ZOOM = 2;

export function getWheelZoom(current: number, deltaY: number, deltaMode = 0) {
  const pixels = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? 800 : 1);
  const next = current * Math.exp(-pixels * 0.0015);
  return Math.max(FLOW_MIN_ZOOM, Math.min(FLOW_MAX_ZOOM, Math.round(next * 1000) / 1000));
}

export function getMinimapViewport({
  viewportWidth,
  viewportHeight,
  scrollLeft,
  scrollTop,
  surfaceLeft,
  surfaceTop,
  surfaceWidth,
  surfaceHeight,
}: {
  viewportWidth: number;
  viewportHeight: number;
  scrollLeft: number;
  scrollTop: number;
  surfaceLeft: number;
  surfaceTop: number;
  surfaceWidth: number;
  surfaceHeight: number;
}) {
  const left = Math.max(surfaceLeft, scrollLeft);
  const top = Math.max(surfaceTop, scrollTop);
  const right = Math.min(surfaceLeft + surfaceWidth, scrollLeft + viewportWidth);
  const bottom = Math.min(surfaceTop + surfaceHeight, scrollTop + viewportHeight);
  return {
    x: Math.max(0, (left - surfaceLeft) / surfaceWidth),
    y: Math.max(0, (top - surfaceTop) / surfaceHeight),
    width: Math.max(0, right - left) / surfaceWidth,
    height: Math.max(0, bottom - top) / surfaceHeight,
  };
}
