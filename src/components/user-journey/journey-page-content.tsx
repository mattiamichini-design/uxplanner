"use client";

import { useState, useRef, useEffect } from "react";
import { JourneyControls } from "./journey-controls";
import { UserJourneyBoard } from "./user-journey-board";
import type { JourneyType, Persona, JourneyData } from "@/lib/user-journey/types";

type JourneyPageContentProps = {
  journeyType: JourneyType;
  availablePersonas: Persona[];
  currentPersonaSlug?: string;
  journeys: JourneyData[];
  compareMode: boolean;
  selectedPersonas: string[];
  allPersonas: Persona[];
};

export function JourneyPageContent({
  journeyType,
  availablePersonas,
  currentPersonaSlug,
  journeys,
  compareMode,
  selectedPersonas,
  allPersonas,
}: JourneyPageContentProps) {
  const [zoom, setZoom] = useState(1);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Measure header height dynamically using ResizeObserver
  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const updateHeight = () => {
      setHeaderHeight(headerEl.offsetHeight);
    };

    // Initial measurement
    updateHeight();

    // Watch for size changes (e.g., responsive wrapping)
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(headerEl);

    return () => resizeObserver.disconnect();
  }, []);

  const controls = (
    <JourneyControls
      journeyType={journeyType}
      availablePersonas={availablePersonas}
      currentPersonaSlug={currentPersonaSlug}
      zoom={zoom}
      onZoomChange={setZoom}
      compareMode={compareMode}
      selectedPersonas={selectedPersonas}
      allPersonas={allPersonas}
    />
  );

  const board = (
    <section className="h-full min-h-0 min-w-0 p-3 md:h-auto md:p-4">
      <UserJourneyBoard
        journeys={journeys}
        compareMode={compareMode}
        availablePersonas={availablePersonas}
        zoom={zoom}
        headerHeight={headerHeight}
      />
    </section>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Sticky header section (can be overridden via header prop) */}
      <header
        ref={headerRef}
        className="border-ux-border bg-ux-surface sticky top-0 z-(--z-ux-board) min-w-0 border-b"
      >
        {controls}
      </header>

      {/* Journey board - scrollable content */}
      <main data-testid="journey-page-main" className="min-h-0 w-full min-w-0 flex-1 overflow-x-hidden">
        {board}
      </main>
    </div>
  );
}
