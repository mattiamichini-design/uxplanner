"use client";

import type { ChangeEventHandler, Dispatch, RefObject, SetStateAction } from "react";
import { FileDown, FileUp, MoreHorizontal, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AnchoredMenu, anchoredMenuItemClassName } from "@/components/ui/anchored-menu";

interface UserJourneyBoardToolbarProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onAddColumn: () => void;
  onExportCsv: () => void;
  onFileChange: ChangeEventHandler<HTMLInputElement>;
  onImportClick: () => void;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  toolbarRef: RefObject<HTMLDivElement | null>;
}

export function UserJourneyBoardToolbar({
  fileInputRef,
  onAddColumn,
  onExportCsv,
  onFileChange,
  onImportClick,
  searchQuery,
  setSearchQuery,
  toolbarRef,
}: UserJourneyBoardToolbarProps) {
  return (
    <div data-testid="journey-board-toolbar" ref={toolbarRef} className="min-w-0">
      <div className="flex min-w-0 items-center gap-2 md:hidden">
        <BoardSearchInput query={searchQuery} setQuery={setSearchQuery} />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="size-11 shrink-0" aria-label="Journey actions"><MoreHorizontal className="size-5" /></Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="dev-theme font-sans" showHandle>
            <SheetHeader className="text-left"><SheetTitle>Journey actions</SheetTitle><SheetDescription>Content and file actions for this journey.</SheetDescription></SheetHeader>
            <SheetBody className="grid gap-5">
              <div className="grid gap-2"><p className="text-ux-muted text-xs font-medium">Content</p><Button variant="outline" className="h-11 justify-start" onClick={onAddColumn}><Plus className="size-4" /> Add column</Button></div>
              <div className="grid gap-2"><p className="text-ux-muted text-xs font-medium">Import & export</p><div className="grid grid-cols-2 gap-2"><Button variant="outline" className="h-11" onClick={onExportCsv}><FileDown className="size-4" /> Export CSV</Button><Button variant="outline" className="h-11" onClick={onImportClick}><FileUp className="size-4" /> Import CSV</Button></div></div>
            </SheetBody>
          </SheetContent>
        </Sheet>
        <input type="file" ref={fileInputRef} aria-label="Import CSV" onChange={onFileChange} accept=".csv" className="hidden" />
      </div>
      <div className="hidden min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 md:grid ">
      <BoardSearchInput query={searchQuery} setQuery={setSearchQuery} />
      <div
        data-testid="journey-board-toolbar-start"
        className="flex w-full flex-nowrap items-center gap-2 justify-self-end"
      >
        <div className="@ux-controls:hidden">
          <AnchoredMenu
            label="File actions"
            trigger={<><MoreHorizontal className="size-3.5" aria-hidden="true" />Files</>}
          >
            <button type="button" className={anchoredMenuItemClassName} onClick={onExportCsv}><FileDown className="size-4" />Export CSV</button>
            <button type="button" className={anchoredMenuItemClassName} onClick={onImportClick}><FileUp className="size-4" />Import CSV</button>
          </AnchoredMenu>
        </div>
        <div className="hidden flex-nowrap items-center gap-2 @ux-controls:flex">
        <Button
          variant="outline"
          size="sm"
          onClick={onExportCsv}
          className="h-8 text-xs"
        >
          <FileDown className="mr-2 size-3.5" /> Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onImportClick}
          className="h-8 text-xs"
        >
          <FileUp className="mr-2 size-3.5" /> Import CSV
        </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          aria-label="Import CSV"
          onChange={onFileChange}
          accept=".csv"
          className="hidden"
        />
      </div>

      <div
        data-testid="journey-board-toolbar-end"
        className="flex min-w-0 justify-end justify-self-end @ux-controls:col-start-3"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={onAddColumn}
          className="h-8 whitespace-nowrap text-xs"
        >
          <Plus className="mr-2 size-3.5" /> Add Column
        </Button>
      </div>
      </div>
    </div>
  );
}

function BoardSearchInput({
  query,
  setQuery,
}: {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
}) {
  return (
    <div
      data-testid="journey-board-toolbar-center"
      className="relative w-full min-w-0 max-w-md items-center justify-self-start"
    >
      <Search className="text-ux-muted absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
      <input
        type="search"
        aria-label="Search"
        placeholder="Search..."
        className="border-ux-input placeholder:text-ux-muted focus-visible:ring-ux-primary flex h-11 w-full rounded-ux-control border bg-transparent py-1 pl-8 pr-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:h-8"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
