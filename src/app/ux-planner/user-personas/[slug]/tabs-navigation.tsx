import Link from "next/link";
import { CreatePersonaDialog } from "@/components/user-persona/create-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { PersonaData } from "@/lib/personas/types";
import { cn } from "@/lib/utils";
import { AnimatedHorizontalTabs } from "@/components/ui/animated-horizontal-tabs";

type PersonaTabsNavigationProps = {
  allPersonas: PersonaData[];
  currentSlug: string;
};

export function PersonaTabsNavigation({ allPersonas, currentSlug }: PersonaTabsNavigationProps) {
  return (
    <div className="flex w-full items-center gap-4">
      <nav aria-label="Personas" className="min-w-0 flex-1">
        <AnimatedHorizontalTabs
          persistenceKey="persona-tabs"
          data-testid="persona-tabs-list"
          className="bg-ux-soft h-auto gap-1.5 rounded-lg p-1"
        >
          {allPersonas.map((p) => (
            <Link
              key={p.slug}
              href={`/ux-planner/user-personas/${p.slug}`}
              aria-current={p.slug === currentSlug ? "page" : undefined}
              className={cn(
                "text-ux-muted inline-flex h-8 shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
                p.slug === currentSlug && "text-ux-on-primary",
              )}
            >
              {p.name}
            </Link>
          ))}
        </AnimatedHorizontalTabs>
      </nav>
      <div className="flex shrink-0 items-center">
        <CreatePersonaDialog>
          <Button size="sm" variant="outline" shape={null} className="h-11 gap-2 rounded-ux-button">
            <Plus className="size-4" />
            <span className="text-xs font-semibold">New Persona</span>
          </Button>
        </CreatePersonaDialog>
      </div>
    </div>
  );
}
