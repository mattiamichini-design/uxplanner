import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JourneyPageContent } from "@/components/user-journey/journey-page-content";
import { CreateJourneyDialog } from "@/components/user-journey/create-journey-dialog";
import { StudioSidebar, StudioSidebarLink, StudioWorkspace } from "@/components/ux-planner/studio-shell";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { loadJourney } from "@/lib/user-journey/load";
import {
  getAllJourneyTypes,
  getJourneyTypeBySlug,
  getJourneysByType,
  journeyExists,
  getAllPersonas,
} from "@/lib/user-journey/registry";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    persona?: string;
    compare?: string;
    personas?: string;
  }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { persona } = await searchParams;

  const journeyType = getJourneyTypeBySlug(slug);

  if (!journeyType) {
    return {
      title: "Journey not found · UX Planner",
    };
  }

  if (persona) {
    const journeys = getJourneysByType(slug);
    const specificJourney = journeys.find((j) => j.personaSlug === persona);

    if (specificJourney) {
      return {
        title: `${specificJourney.title} · UX Planner`,
        description:
          specificJourney.description ||
          `Interactive board for the ${specificJourney.title} journey`,
      };
    }
  }

  return {
    title: `${journeyType.title} · UX Planner`,
    description: journeyType.description || `Journeys in ${journeyType.title}`,
  };
}

export default async function JourneyPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { persona, compare, personas: personasParam } = await searchParams;

  const journeyType = getJourneyTypeBySlug(slug);

  // Check if journey type exists
  if (!journeyType) {
    notFound();
  }

  // Get all journeys for this type
  const journeysForType = getJourneysByType(slug);

  if (journeysForType.length === 0) {
    notFound();
  }

  // Get all available personas - optimized with Set for O(1) lookups
  const allPersonas = getAllPersonas();
  const journeyPersonaSlugs = new Set(journeysForType.map((j) => j.personaSlug));
  const availablePersonas = allPersonas.filter((p) => journeyPersonaSlugs.has(p.slug));

  // Parse comparison mode
  const compareMode = compare === "true";
  const requestedPersonaSlugs =
    compareMode && personasParam
      ? personasParam.split(",")
      : persona
        ? [persona]
        : availablePersonas.length > 0
          ? [availablePersonas[0].slug]
          : [journeysForType[0].personaSlug];
  const availablePersonaSlugs = new Set(journeysForType.map((journey) => journey.personaSlug));
  const selectedPersonaSlugs = Array.from(
    new Set(requestedPersonaSlugs.filter((personaSlug) => availablePersonaSlugs.has(personaSlug))),
  );
  if (selectedPersonaSlugs.length === 0) {
    selectedPersonaSlugs.push(availablePersonas[0]?.slug ?? journeysForType[0].personaSlug);
  }

  // Load journey data for all selected personas
  const journeyDataList = await Promise.all(
    selectedPersonaSlugs.map(async (personaSlug) => {
      const journey = journeysForType.find((j) => j.personaSlug === personaSlug);
      if (!journey) return null;

      const exists = await journeyExists(journey.slug);
      if (!exists) return null;

      return loadJourney(journey.journeyTypeSlug, journey.personaSlug);
    }),
  );

  // Filter out any null values
  const validJourneys = journeyDataList.filter((j) => j !== null);

  if (validJourneys.length === 0) {
    notFound();
  }

  const allJourneyTypes = getAllJourneyTypes();
  const currentPersonaSlug = !compareMode ? selectedPersonaSlugs[0] : undefined;

  return (
    <StudioWorkspace
      section="Journeys"
      current={journeyType.title}
      sidebar={
        <StudioSidebar
          title="Journeys"
          action={
            <CreateJourneyDialog availablePersonas={allPersonas}>
              <Button variant="ghost" size="icon" className="size-8 rounded-ux-control" aria-label="New Journey">
                <Plus className="size-4" aria-hidden="true" />
              </Button>
            </CreateJourneyDialog>
          }
        >
          {allJourneyTypes.map((type) => {
            return <StudioSidebarLink key={type.slug} href={`/ux-planner/user-journeys/${type.slug}`} active={type.slug === slug} label={type.title} iconName={type.icon || "Map"} />;
          })}
        </StudioSidebar>
      }
    >
      <JourneyPageContent
        journeyType={journeyType}
        availablePersonas={availablePersonas}
        currentPersonaSlug={currentPersonaSlug}
        journeys={validJourneys}
        compareMode={compareMode}
        selectedPersonas={selectedPersonaSlugs}
        allPersonas={allPersonas}
      />
    </StudioWorkspace>
  );
}
