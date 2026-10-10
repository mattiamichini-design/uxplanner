"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import type { JourneyConfig } from "@/lib/user-journey/registry";
import type { JourneyType, Persona } from "@/lib/user-journey/types";
import { useCallback } from "react";
import { CreateJourneyDialog } from "./create-journey-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedHorizontalTabs } from "@/components/ui/animated-horizontal-tabs";

type JourneyTabsProps = {
  journeyTypes: JourneyType[];
  currentJourneyTypeSlug: string;
  currentPersonaSlug?: string; // Keep for future use
  journeysForCurrentType: JourneyConfig[]; // Keep for future use
  availablePersonas: Persona[];
};

export function JourneyTabs({
  journeyTypes,
  currentJourneyTypeSlug,
  availablePersonas,
}: JourneyTabsProps) {
  const router = useRouter();

  const handleJourneyTypeClick = useCallback(
    (slug: string) => {
      router.push(`/ux-planner/user-journeys/${slug}`);
    },
    [router],
  );

  return (
    <nav className="w-full" aria-label="User Journey Navigation">
      {/* Journey Type Selection (primary tabs) */}
      <div className="">
        {/* Mobile: Dropdown select for journey type */}
        <div className="p-4 md:hidden">
          <label htmlFor="journey-type-select" className="sr-only">
            Select journey
          </label>
          <div className="flex items-center gap-2">
            <Select value={currentJourneyTypeSlug || undefined} onValueChange={handleJourneyTypeClick}><SelectTrigger id="journey-type-select" aria-label="Select journey" className="bg-ux-surface"><SelectValue placeholder="Select a journey…" /></SelectTrigger><SelectContent position="popper">{journeyTypes.map((journey) => <SelectItem key={journey.id} value={journey.slug}>{journey.title}</SelectItem>)}</SelectContent></Select>
            <CreateJourneyDialog availablePersonas={availablePersonas}>
              <Button
                size="icon"
                variant="outline"
                className="size-11 shrink-0 rounded-xl bg-transparent hover:bg-transparent"
              >
                <LucideIcons.Plus className="size-5" />
                <span className="sr-only">New Journey</span>
              </Button>
            </CreateJourneyDialog>
          </div>
        </div>

        {/* Desktop: Horizontal tabs for journey type */}
        <div className="hidden px-6 py-2 md:block">
          <div className="flex w-full items-center gap-4">
            <Tabs
              value={currentJourneyTypeSlug}
              onValueChange={handleJourneyTypeClick}
              className="min-w-0 flex-1"
            >
              <TabsList asChild>
                <AnimatedHorizontalTabs persistenceKey="journey-tabs" className="bg-ux-soft h-[46px] justify-start rounded-[14px] p-1">
                  {journeyTypes.map((jt) => (
                      <TabsTrigger
                        key={jt.id}
                        value={jt.slug}
                        className="data-[state=active]:bg-transparent data-[state=active]:text-ux-on-primary text-ux-muted mr-0.5 h-9 shrink-0 rounded-ux-button px-3 text-ux-label font-medium transition-colors data-[state=active]:shadow-none"
                      >
                        {jt.title}
                      </TabsTrigger>
                  ))}
                </AnimatedHorizontalTabs>
              </TabsList>
            </Tabs>
            <div className="flex shrink-0 items-center">
              <CreateJourneyDialog availablePersonas={availablePersonas}>
                <Button
                  size="sm"
                  variant="outline"
                  shape={null}
                  className="h-11 gap-2 rounded-ux-button bg-transparent hover:bg-transparent"
                >
                  <LucideIcons.Plus className="size-4" />
                  <span className="text-xs font-semibold">New Journey</span>
                </Button>
              </CreateJourneyDialog>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
