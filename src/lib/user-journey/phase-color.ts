export function getJourneyPhaseNumber(index: number) {
  return [1, 2, 3, 4, 3, 2][index % 6];
}

export function getJourneyPhaseColor(index: number) {
  return `var(--journey-phase-${getJourneyPhaseNumber(index)})`;
}
