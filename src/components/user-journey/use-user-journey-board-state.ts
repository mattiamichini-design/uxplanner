"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, WheelEvent } from "react";
import { useRouter } from "next/navigation";

import {
  addJourneyColumn,
  addJourneyItem,
  addJourneyRow,
  deleteJourneyColumn,
  deleteJourneyItem,
  deleteJourneyRow,
  duplicateJourneyItem,
  importJourneyFromPersona,
  importJourneyBoards,
  updateJourneyColumn,
  updateJourneyItem,
  updateJourneyRow,
} from "@/actions/user-journey";
import { csvToJourney, journeyToCsv } from "@/lib/user-journey/csv";
import type { JourneyData, Persona } from "@/lib/user-journey/types";
import { getActionError } from "@/components/action-error";

import { useUserJourneyBoardDnd } from "./use-user-journey-board-dnd";

type JourneyItemEmphasis = "positive" | "neutral" | "negative";

export type UserJourneyBoardStateProps = {
  journeys: JourneyData[];
  compareMode: boolean;
  availablePersonas: Persona[];
  headerHeight?: number;
};

export function useUserJourneyBoardState({
  journeys,
  compareMode,
  availablePersonas,
  headerHeight = 0,
}: UserJourneyBoardStateProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = useCallback(
    async (action: () => Promise<{ success: boolean; error?: string }>) => {
      try {
        const result = await action();
        const error = getActionError(result);
        setActionError(error);
        return error === null;
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "The change could not be saved.");
        return false;
      }
    },
    [],
  );

  useEffect(() => {
    const toolbarEl = toolbarRef.current;
    if (!toolbarEl) return;

    const updateHeight = () => {
      setToolbarHeight(toolbarEl.offsetHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(toolbarEl);

    return () => resizeObserver.disconnect();
  }, []);

  const dynamicOffset = useMemo(() => {
    const paddingAndGap = 32 + 16 + 32;
    return headerHeight + toolbarHeight + paddingAndGap;
  }, [headerHeight, toolbarHeight]);

  const primaryJourney = journeys[0];
  const columns = useMemo(() => primaryJourney.columns, [primaryJourney.columns]);
  const visibleColumns = columns;

  const maxColumnsLength = useMemo(() => {
    if (!compareMode) return columns.length;
    return Math.max(...journeys.map((journey) => journey.columns.length));
  }, [columns.length, compareMode, journeys]);

  const compareIndices = useMemo(
    () => Array.from({ length: maxColumnsLength }, (_, i) => i),
    [maxColumnsLength],
  );

  const personaMap = useMemo(() => {
    const map = new Map<string, Persona>();
    availablePersonas.forEach((persona) => {
      map.set(persona.slug, persona);
      map.set(persona.name, persona);
    });
    return map;
  }, [availablePersonas]);

  const getPersonaSlug = useCallback(
    (nameOrSlug: string) => {
      const persona =
        personaMap.get(nameOrSlug) ||
        personaMap.get(nameOrSlug.toLowerCase().replace(/\s+/g, "-"));
      return persona ? persona.slug : nameOrSlug.toLowerCase().replace(/\s+/g, "-");
    },
    [personaMap],
  );

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    if (event.metaKey) {
      event.preventDefault();
    }
  }, []);

  const [isAddRowOpen, setIsAddRowOpen] = useState(false);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{
    journeyType: string;
    personaSlug: string;
    rowId: string;
    columnId: string;
  } | null>(null);
  const [editingColumn, setEditingColumn] = useState<{
    id: string;
    label: string;
    subtitle: string;
    personaSlug: string;
  } | null>(null);
  const [editingRow, setEditingRow] = useState<{
    id: string;
    label: string;
    description: string;
  } | null>(null);
  const [editingItem, setEditingItem] = useState<{
    journeyType: string;
    personaSlug: string;
    rowId: string;
    columnId: string;
    itemIndex: number;
    initialValues: {
      text: string;
      emphasis?: JourneyItemEmphasis;
    };
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportFromPersonaOpen, setIsImportFromPersonaOpen] = useState(false);
  const [confirmationState, setConfirmationState] = useState<{
    type: "contextMenuDelete" | "columnDelete" | "rowDelete" | "trashDrop" | "csvImport";
    data?: Record<string, unknown>;
  } | null>(null);
  const [pendingColumnDelete, setPendingColumnDelete] = useState<{
    id: string;
    label: string;
    personaSlug: string;
    itemCount: number;
  } | null>(null);
  const [pendingRowDelete, setPendingRowDelete] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [pendingContextMenuDelete, setPendingContextMenuDelete] = useState<{
    journeyType: string;
    personaSlug: string;
    rowId: string;
    columnId: string;
    itemIndex: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    journeyType: string;
    personaSlug: string;
    rowId: string;
    columnId: string;
    itemIndex: number;
    text: string;
    emphasis?: JourneyItemEmphasis;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleAddItem = async (
    text: string,
    _emoji?: string,
    _emphasis?: JourneyItemEmphasis,
  ) => {
    void _emoji;
    void _emphasis;
    if (!activeCell) return false;
    if (!(await runAction(() => addJourneyItem(
      activeCell.journeyType,
      activeCell.personaSlug,
      activeCell.rowId,
      activeCell.columnId,
      text,
    )))) return false;
    router.refresh();
    setActiveCell(null);
    return true;
  };

  const handleUpdateItem = async (
    text: string,
    emoji?: string,
    emphasis?: JourneyItemEmphasis,
  ) => {
    if (!editingItem) return false;
    if (!(await runAction(() => updateJourneyItem(
      editingItem.journeyType,
      editingItem.personaSlug,
      editingItem.rowId,
      editingItem.columnId,
      editingItem.itemIndex,
      { text, emoji, emphasis },
    )))) return false;
    router.refresh();
    setEditingItem(null);
    return true;
  };

  const handleDeleteItem = async () => {
    if (!editingItem) return false;
    if (!(await runAction(() => deleteJourneyItem(
      editingItem.journeyType,
      editingItem.personaSlug,
      editingItem.rowId,
      editingItem.columnId,
      editingItem.itemIndex,
    )))) return false;
    router.refresh();
    setEditingItem(null);
    return true;
  };

  const handleDuplicateItem = async () => {
    if (!editingItem) return false;
    if (!(await runAction(() => duplicateJourneyItem(
      editingItem.journeyType,
      editingItem.personaSlug,
      editingItem.rowId,
      editingItem.columnId,
      editingItem.itemIndex,
    )))) return false;
    router.refresh();
    setEditingItem(null);
    return true;
  };

  const handleContextMenuEdit = () => {
    if (!contextMenu) return;
    setEditingItem({
      journeyType: contextMenu.journeyType,
      personaSlug: contextMenu.personaSlug,
      rowId: contextMenu.rowId,
      columnId: contextMenu.columnId,
      itemIndex: contextMenu.itemIndex,
      initialValues: {
        text: contextMenu.text,
        emphasis: contextMenu.emphasis,
      },
    });
  };

  const handleContextMenuDuplicate = async () => {
    if (!contextMenu) return;
    if (!(await runAction(() => duplicateJourneyItem(
      contextMenu.journeyType,
      contextMenu.personaSlug,
      contextMenu.rowId,
      contextMenu.columnId,
      contextMenu.itemIndex,
    )))) return;
    router.refresh();
  };

  const handleContextMenuDelete = async () => {
    if (!contextMenu) return;
    setPendingContextMenuDelete({
      journeyType: contextMenu.journeyType,
      personaSlug: contextMenu.personaSlug,
      rowId: contextMenu.rowId,
      columnId: contextMenu.columnId,
      itemIndex: contextMenu.itemIndex,
    });
    setConfirmationState({ type: "contextMenuDelete" });
  };

  const handleContextMenuDeleteConfirm = async () => {
    if (!pendingContextMenuDelete) return;
    if (!(await runAction(() => deleteJourneyItem(
      pendingContextMenuDelete.journeyType,
      pendingContextMenuDelete.personaSlug,
      pendingContextMenuDelete.rowId,
      pendingContextMenuDelete.columnId,
      pendingContextMenuDelete.itemIndex,
    )))) return;
    setConfirmationState(null);
    setPendingContextMenuDelete(null);
    setContextMenu(null);
    router.refresh();
  };

  const handleContextMenuDeleteCancel = () => {
    setConfirmationState(null);
    setPendingContextMenuDelete(null);
  };

  const handleAddRow = async (id: string, label: string, description?: string) => {
    if (!(await runAction(() => addJourneyRow(
      primaryJourney.meta.journeyType || "onboarding",
      getPersonaSlug(primaryJourney.meta.persona),
      label,
      id,
      description || "",
      true,
    )))) return false;
    router.refresh();
    return true;
  };

  const handleEditRow = (rowId: string) => {
    const row = primaryJourney.rows.find((candidate) => candidate.id === rowId);
    if (!row) return;
    setEditingRow({
      id: row.id,
      label: row.label,
      description: row.description || "",
    });
  };

  const handleUpdateRow = async (id: string, label: string, description?: string) => {
    if (!editingRow) return false;
    if (!(await runAction(() => updateJourneyRow(
      primaryJourney.meta.journeyType || "onboarding",
      getPersonaSlug(primaryJourney.meta.persona),
      id,
      label,
      description || "",
      true,
    )))) return false;
    router.refresh();
    setEditingRow(null);
    return true;
  };

  const handleAddColumn = async (
    id: string,
    label: string,
    subtitle?: string,
    applyToAll: boolean = true,
  ) => {
    if (!(await runAction(() => addJourneyColumn(
      primaryJourney.meta.journeyType || "onboarding",
      getPersonaSlug(primaryJourney.meta.persona),
      label,
      id,
      subtitle || "",
      applyToAll,
    )))) return false;
    router.refresh();
    return true;
  };

  const getColumnItemCount = useCallback(
    (columnId: string, personaSlug: string) => {
      const journey =
        journeys.find((candidate) => getPersonaSlug(candidate.meta.persona) === personaSlug) ||
        primaryJourney;
      return journey.rows.reduce((count, row) => {
        const cell = row.cells.find((candidate) => candidate.columnId === columnId);
        return count + (cell?.items.length || 0);
      }, 0);
    },
    [getPersonaSlug, journeys, primaryJourney],
  );

  const handleUpdateColumn = async (
    id: string,
    label: string,
    subtitle?: string,
    _applyToAll?: boolean,
  ) => {
    void _applyToAll;
    if (!(await runAction(() => updateJourneyColumn(
      primaryJourney.meta.journeyType || "onboarding",
      editingColumn?.personaSlug || getPersonaSlug(primaryJourney.meta.persona),
      id,
      label,
      subtitle || "",
    )))) return false;
    router.refresh();
    setEditingColumn(null);
    return true;
  };

  const handleDeleteColumn = async () => {
    if (!editingColumn) return false;
    setPendingColumnDelete({
      id: editingColumn.id,
      label: editingColumn.label,
      personaSlug: editingColumn.personaSlug,
      itemCount: getColumnItemCount(editingColumn.id, editingColumn.personaSlug),
    });
    setConfirmationState({ type: "columnDelete" });
    return true;
  };

  const handleDeleteColumnConfirm = async () => {
    if (!pendingColumnDelete) return;
    if (!(await runAction(() => deleteJourneyColumn(
      primaryJourney.meta.journeyType || "onboarding",
      pendingColumnDelete.personaSlug,
      pendingColumnDelete.id,
    )))) return;
    setConfirmationState(null);
    router.refresh();
    setPendingColumnDelete(null);
    setEditingColumn(null);
  };

  const handleDeleteRow = async () => {
    if (!editingRow) return false;
    const row = primaryJourney.rows.find((candidate) => candidate.id === editingRow.id);
    if (!row) return false;
    setPendingRowDelete({
      id: row.id,
      label: row.label,
    });
    setConfirmationState({ type: "rowDelete" });
    return true;
  };

  const handleDeleteRowConfirm = async () => {
    if (!pendingRowDelete) return;
    if (!(await runAction(() => deleteJourneyRow(
      primaryJourney.meta.journeyType || "onboarding",
      getPersonaSlug(primaryJourney.meta.persona),
      pendingRowDelete.id,
      true,
    )))) return;
    setConfirmationState(null);
    setPendingRowDelete(null);
    setEditingRow(null);
    router.refresh();
  };

  const handleDeleteColumnCancel = () => {
    setConfirmationState(null);
    setPendingColumnDelete(null);
  };

  const handleDeleteRowCancel = () => {
    setConfirmationState(null);
    setPendingRowDelete(null);
  };

  const dndState = useUserJourneyBoardDnd({
    journeys,
    getPersonaSlug,
    onTrashDropRequested: () => setConfirmationState({ type: "trashDrop" }),
    runAction,
  });

  const handleExportCsv = () => {
    const journeysToExport = compareMode ? journeys : [primaryJourney];
    const csvContent = journeyToCsv(journeysToExport);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    const filename =
      journeysToExport.length > 1
        ? `${journeysToExport[0].meta.journeyType}-comparison.csv`
        : `${primaryJourney.meta.journeyType}-${getPersonaSlug(primaryJourney.meta.persona)}.csv`;

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    setConfirmationState({ type: "csvImport" });
  };

  const handleImportConfirm = () => {
    setConfirmationState(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        try {
          const newJourneysMap = csvToJourney(content, primaryJourney);

          const entries = [...newJourneysMap.values()].map((data) => {
            const persona = getPersonaSlug(data.meta.persona);
            const original = journeys.find((journey) => getPersonaSlug(journey.meta.persona) === persona);
            if (!original) throw new Error(`No journey exists for persona “${data.meta.persona}”. Create it before importing.`);
            return { persona, data: { columns: data.columns, rows: data.rows }, expectedUpdatedAt: original.meta.updatedAt };
          });
          if (!(await runAction(() => importJourneyBoards(
            primaryJourney.meta.journeyType || "onboarding", entries,
          )))) return;
          router.refresh();
        } catch (error) {
          setActionError(
            error instanceof Error ? error.message : "The CSV file could not be imported.",
          );
        }
      }
    };
    reader.onerror = () => setActionError("The CSV file could not be read.");
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportFromPersona = async (sourcePersonaSlug: string) => {
    if (!(await runAction(() => importJourneyFromPersona(
      primaryJourney.meta.journeyType || "onboarding",
      sourcePersonaSlug,
      getPersonaSlug(primaryJourney.meta.persona),
    )))) return false;
    router.refresh();
    return true;
  };

  const otherPersonas = useMemo(() => {
    return availablePersonas.filter((p) => p.slug !== getPersonaSlug(primaryJourney.meta.persona));
  }, [availablePersonas, getPersonaSlug, primaryJourney.meta.persona]);

  const rows = primaryJourney.rows;
  const visualRows = useMemo(
    () => rows.filter((row) => row.id !== "steps" && !/user steps/i.test(row.label)),
    [rows],
  );
  const hasEmptyState = !compareMode && visibleColumns.length === 0;

  return {
    actionError,
    activeCell,
    columns,
    compareIndices,
    confirmationState,
    contextMenu,
    dynamicOffset,
    editingColumn,
    editingItem,
    editingRow,
    fileInputRef,
    getPersonaSlug,
    handleAddColumn,
    handleAddItem,
    handleAddRow,
    handleContextMenuDelete,
    handleContextMenuDeleteCancel,
    handleContextMenuDeleteConfirm,
    handleContextMenuDuplicate,
    handleContextMenuEdit,
    handleDeleteColumn,
    handleDeleteColumnCancel,
    handleDeleteColumnConfirm,
    handleDeleteItem,
    handleDeleteRow,
    handleDeleteRowCancel,
    handleDeleteRowConfirm,
    handleDuplicateItem,
    handleEditRow,
    handleExportCsv,
    handleFileChange,
    handleImportClick,
    handleImportConfirm,
    handleImportFromPersona,
    handleUpdateColumn,
    handleUpdateItem,
    handleUpdateRow,
    handleWheel,
    hasEmptyState,
    isAddColumnOpen,
    isAddRowOpen,
    isImportFromPersonaOpen,
    maxColumnsLength,
    otherPersonas,
    pendingColumnDelete,
    pendingRowDelete,
    personaMap,
    primaryJourney,
    rows,
    searchQuery,
    setActiveCell,
    setConfirmationState,
    setContextMenu,
    setEditingColumn,
    setEditingItem,
    setEditingRow,
    setIsAddColumnOpen,
    setIsAddRowOpen,
    setIsImportFromPersonaOpen,
    setSearchQuery,
    toolbarRef,
    visibleColumns,
    visualRows,
    ...dndState,
  };
}

export type UserJourneyBoardState = ReturnType<typeof useUserJourneyBoardState>;
