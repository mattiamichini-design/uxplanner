import { redirect } from "next/navigation";
import { getAllPersonas } from "@/lib/personas/registry";
import type { Metadata } from "next";
import { CreatePersonaDialog } from "@/components/user-persona/create-dialog";

export const metadata: Metadata = {
  title: "User Personas",
  description: "Explore the user personas in this project.",
};

export default function UserPersonasPage() {
  const personas = getAllPersonas();

  if (personas.length > 0) {
    redirect(`/ux-planner/user-personas/${personas[0].slug}`);
  }

  return (
    <main className="grid w-full gap-8 px-6 py-8">
      <header className="text-ux-text grid gap-4 text-center">
        <h1 className="text-3xl font-semibold">User Personas</h1>
        <p className="text-ux-muted text-base">No personas yet. Create the first one for this project.</p>
        <div><CreatePersonaDialog /></div>
      </header>
    </main>
  );
}
