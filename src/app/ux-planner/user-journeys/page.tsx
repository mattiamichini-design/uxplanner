import { redirect } from "next/navigation";
import { getAllJourneyTypes, getAllPersonas } from "@/lib/user-journey/registry";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateJourneyDialog } from "@/components/user-journey/create-journey-dialog";

export const metadata: Metadata = {
  title: "User Journeys",
  description: "Explore the user journeys in this project.",
};

/**
 * Root user-journeys page redirects to the first available journey type
 */
export default function UserJourneysPage() {
  const journeyTypes = getAllJourneyTypes();
  const personas = getAllPersonas();

  // Redirect to the first journey type if available
  if (journeyTypes.length > 0) {
    redirect(`/ux-planner/user-journeys/${journeyTypes[0].slug}`);
  }

  // Fallback if no journeys are configured
  return (
    <main className="grid w-full gap-8 px-6 py-8">
      <header className="text-ux-text grid gap-4 text-center">
        <h1 className="text-3xl font-semibold">User Journeys</h1>
        <p className="text-ux-muted text-base">
          {personas.length > 0
            ? "No journeys yet. Create the first one for this project."
            : "No journeys yet. Start by adding a persona to the project."}
        </p>
        <div>
          {personas.length > 0 ? (
            <CreateJourneyDialog availablePersonas={personas}>
              <Button>New Journey</Button>
            </CreateJourneyDialog>
          ) : (
            <Button asChild><Link href="/ux-planner/user-personas">Open User Personas</Link></Button>
          )}
        </div>
      </header>
    </main>
  );
}
