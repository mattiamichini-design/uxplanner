import { readJSON } from '../server/workspace.mjs';
import { parseJourneyData } from '../server/user-journey-payload';
export async function loadJourney(typeSlug: string, personaSlug: string) {
  return parseJourneyData(readJSON('user-journeys', typeSlug, `${personaSlug}.json`));
}
