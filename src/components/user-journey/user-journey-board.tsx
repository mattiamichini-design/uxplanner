"use client";

import type { JourneyData, Persona } from "@/lib/user-journey/types";

import { UserJourneyBoardDialogs } from "./user-journey-board-dialogs";
import { UserJourneyBoardGrid } from "./user-journey-board-grid";
import { UserJourneyBoardNotes } from "./user-journey-board-notes";
import { UserJourneyBoardToolbar } from "./user-journey-board-toolbar";
import { useUserJourneyBoardState } from "./use-user-journey-board-state";
import { ActionError } from "@/components/action-error";

type UserJourneyBoardProps = {
  journeys: JourneyData[];
  compareMode: boolean;
  availablePersonas: Persona[];
  zoom: number;
  headerHeight?: number;
};

export function UserJourneyBoard({
  journeys,
  compareMode,
  availablePersonas,
  zoom,
  headerHeight = 0,
}: UserJourneyBoardProps) {
  const state = useUserJourneyBoardState({
    journeys,
    compareMode,
    availablePersonas,
    headerHeight,
  });

  return (
    <section className="grid h-full min-h-0 min-w-0 grid-rows-[minmax(0,1fr)] gap-4 md:h-auto md:grid-rows-none">
      <ActionError message={state.actionError} floating />
      <div className="hidden md:block">
        <UserJourneyBoardToolbar
        fileInputRef={state.fileInputRef}
        onAddColumn={() => state.setIsAddColumnOpen(true)}
        onExportCsv={state.handleExportCsv}
        onFileChange={state.handleFileChange}
        onImportClick={state.handleImportClick}
        searchQuery={state.searchQuery}
        setSearchQuery={state.setSearchQuery}
        toolbarRef={state.toolbarRef}
        />
      </div>
      <UserJourneyBoardGrid
        compareMode={compareMode}
        journeys={journeys}
        state={state}
        zoom={zoom}
      />
      <div className="hidden md:block"><UserJourneyBoardNotes journey={state.primaryJourney} /></div>
      <UserJourneyBoardDialogs state={state} />
    </section>
  );
}

export default UserJourneyBoard;
