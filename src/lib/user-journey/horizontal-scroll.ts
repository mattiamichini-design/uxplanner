export function getHorizontalScrollMetrics(
  scrollWidth: number,
  clientWidth: number,
  scrollLeft: number,
) {
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  return {
    hasOverflow: maxScroll > 1,
    thumbRatio: scrollWidth > 0 ? Math.min(1, clientWidth / scrollWidth) : 1,
    progress: maxScroll > 0 ? Math.min(1, Math.max(0, scrollLeft / maxScroll)) : 0,
    maxScroll,
  };
}

export function getScrollProgressFromPointer(
  trackWidth: number,
  pointerX: number,
  thumbRatio: number,
  grabOffset: number,
) {
  const availableWidth = Math.max(0, trackWidth * (1 - thumbRatio));
  if (availableWidth === 0) return 0;
  return Math.min(1, Math.max(0, (pointerX - grabOffset) / availableWidth));
}
