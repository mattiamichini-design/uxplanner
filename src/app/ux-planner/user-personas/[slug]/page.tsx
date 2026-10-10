import { notFound } from "next/navigation";
import { getAllPersonas, getPersonaBySlug } from "@/lib/personas/registry";
import { personaInitials } from "@/lib/personas/initials";
import type { Metadata } from "next";
import { PersonaDetail } from "@/components/user-persona/persona-detail";
import { CreatePersonaDialog } from "@/components/user-persona/create-dialog";
import { StudioSidebar, StudioSidebarLink, StudioSidebarToggle, StudioWorkspace } from "@/components/ux-planner/studio-shell";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const persona = getPersonaBySlug(slug);

  if (!persona) {
    return { title: "Persona non trovata" };
  }

  return {
    title: `${persona.name} · User Personas`,
    description: persona.summary,
  };
}

export default async function PersonaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { edit } = await searchParams;
  const persona = getPersonaBySlug(slug);
  const allPersonas = getAllPersonas();

  // If the requested persona is not found (or filtered out implicitly if slug loop fails, but getPersonaBySlug might return it even if filtered out in registry if registry wasn't strict?)
  // Registry 'getAllPersonas' filters. 'getPersonaBySlug' likely uses 'getAllPersonas'.
  // Check strictness: if it's not in the filtered list, it's not found (or hidden).

  if (!persona) {
    notFound();
  }

  return (
    <StudioWorkspace
      section="Personas"
      current={persona.name}
      sidebar={
        <StudioSidebar
          title="Personas"
          action={
            <CreatePersonaDialog>
              <Button variant="ghost" size="icon" className="size-8 rounded-ux-control" aria-label="New Persona">
                <Plus className="size-4" aria-hidden="true" />
              </Button>
            </CreatePersonaDialog>
          }
        >
          {allPersonas.map((item) => (
            <StudioSidebarLink key={item.slug} href={`/ux-planner/user-personas/${item.slug}`} active={item.slug === slug} label={item.name} badge={personaInitials(item.name)} />
          ))}
        </StudioSidebar>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
      <header className="border-ux-border shrink-0 hidden h-ux-header items-center gap-3 border-b px-6 md:flex">
        <StudioSidebarToggle className="max-w-52" />
        <h1 className="hidden truncate text-base font-semibold ux-wide:block">{persona.name}</h1>
      </header>
      <div className="min-h-0 w-full flex-1">
        <PersonaDetail key={slug} persona={persona} initialEditing={edit === "1"} />
      </div>
      </div>
    </StudioWorkspace>
  );
}
