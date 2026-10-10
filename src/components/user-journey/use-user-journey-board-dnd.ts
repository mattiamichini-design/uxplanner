"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DroppableContainers,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import {
  copyItemToPersona,
  deleteJourneyItem,
  duplicateJourneyItem,
  moveItemToPersona,
  moveJourneyItem,
} from "@/actions/user-journey";
import { getHorizontalCellCoordinates } from "@/lib/ux-planner/keyboard-coordinates";
import type { JourneyData, JourneyItem } from "@/lib/user-journey/types";

type PendingTrashDrop = {
  type: string;
  persona: string;
  row: string;
  col: string;
  idx: number;
};

const keyboardCoordinatesWithoutTrash: KeyboardCoordinateGetter = (event, args) => {
  const DroppableContainersMap = args.context.droppableContainers.constructor as MapConstructor;
  const droppableContainers = new DroppableContainersMap(
    [...args.context.droppableContainers].filter(([id]) => id !== "trash-drop-zone"),
  ) as DroppableContainers;

  const horizontalCoordinates = getHorizontalCellCoordinates({
    code: event.code,
    activeId: args.active,
    collisionRect: args.context.collisionRect,
    candidates: droppableContainers.getEnabled().map((container) => ({
      id: container.id,
      rect: args.context.droppableRects.get(container.id) ?? container.rect.current ?? undefined,
    })),
  });
  if (horizontalCoordinates) {
    event.preventDefault();
    return horizontalCoordinates;
  }

  return sortableKeyboardCoordinates(event, {
    ...args,
    context: { ...args.context, droppableContainers },
  });
};

interface UseUserJourneyBoardDndOptions {
  journeys: JourneyData[];
  getPersonaSlug: (nameOrSlug: string) => string;
  onTrashDropRequested: () => void;
  runAction: (action: () => Promise<{ success: boolean; error?: string }>) => Promise<boolean>;
}

export function useUserJourneyBoardDnd({
  journeys,
  getPersonaSlug,
  onTrashDropRequested,
  runAction,
}: UseUserJourneyBoardDndOptions) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOptionPressed, setIsOptionPressed] = useState(false);
  const [pendingTrashDrop, setPendingTrashDrop] = useState<PendingTrashDrop | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: keyboardCoordinatesWithoutTrash,
    }),
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) setIsOptionPressed(true);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.altKey) setIsOptionPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      if (over.id === "trash-drop-zone") {
        const activeIdStr = active.id as string;
        const [type, persona, row, col, idx] = activeIdStr.split("::");

        setPendingTrashDrop({ type, persona, row, col, idx: Number.parseInt(idx, 10) });
        onTrashDropRequested();
        return;
      }

      const activeIdStr = active.id as string;
      const overIdStr = over.id as string;
      const [aType, aPersona, aRow, aCol, aIdx] = activeIdStr.split("::");
      const activeIndex = Number.parseInt(aIdx, 10);

      if (overIdStr.startsWith("cell::")) {
        const [, cPersona, cRow, cCol] = overIdStr.replace("cell::", "").split("::");

        if (isOptionPressed) {
          if (aPersona !== cPersona) {
            if (!(await runAction(() => copyItemToPersona(aType, aPersona, cPersona, cRow, aCol, cCol, activeIndex, 0)))) return;
          } else {
            if (!(await runAction(() => duplicateJourneyItem(aType, aPersona, aRow, aCol, activeIndex)))) return;
          }
          router.refresh();
          return;
        }

        if (aPersona !== cPersona) {
          if (!(await runAction(() => moveItemToPersona(
            aType,
            aPersona,
            cPersona,
            aRow,
            cRow,
            aCol,
            cCol,
            activeIndex,
            0,
          )))) return;
        } else {
          if (!(await runAction(() => moveJourneyItem(aType, aPersona, aRow, aCol, cRow, cCol, activeIndex, 0)))) return;
        }
        router.refresh();
        return;
      }

      if (active.id !== over.id) {
        const [, oPersona, oRow, oCol, oIdx] = overIdStr.split("::");
        const overIndex = Number.parseInt(oIdx, 10);

        if (isOptionPressed) {
          if (aPersona !== oPersona) {
            if (!(await runAction(() => copyItemToPersona(
              aType,
              aPersona,
              oPersona,
              oRow,
              aCol,
              oCol,
              activeIndex,
              overIndex,
            )))) return;
          } else {
            if (!(await runAction(() => duplicateJourneyItem(aType, aPersona, aRow, aCol, activeIndex)))) return;
          }
          router.refresh();
          return;
        }

        if (aPersona !== oPersona) {
          if (!(await runAction(() => moveItemToPersona(
            aType,
            aPersona,
            oPersona,
            aRow,
            oRow,
            aCol,
            oCol,
            activeIndex,
            overIndex,
          )))) return;
        } else {
          if (!(await runAction(() => moveJourneyItem(aType, aPersona, aRow, aCol, oRow, oCol, activeIndex, overIndex)))) return;
        }
        router.refresh();
      }
    },
    [isOptionPressed, onTrashDropRequested, router, runAction],
  );

  const handleTrashDropConfirm = useCallback(async () => {
    if (!pendingTrashDrop) return false;

    if (!(await runAction(() => deleteJourneyItem(
      pendingTrashDrop.type,
      pendingTrashDrop.persona,
      pendingTrashDrop.row,
      pendingTrashDrop.col,
      pendingTrashDrop.idx,
    )))) return false;
    setPendingTrashDrop(null);
    router.refresh();
    return true;
  }, [pendingTrashDrop, router, runAction]);

  const handleTrashDropCancel = useCallback(() => {
    setPendingTrashDrop(null);
  }, []);

  const getItemId = useCallback(
    (journey: JourneyData, rowId: string, columnId: string, index: number) => {
      return `${journey.meta.journeyType || "onboarding"}::${getPersonaSlug(journey.meta.persona)}::${rowId}::${columnId}::${index}`;
    },
    [getPersonaSlug],
  );

  const getCellId = useCallback(
    (journey: JourneyData, rowId: string, columnId: string) => {
      return `cell::${journey.meta.journeyType || "onboarding"}::${getPersonaSlug(journey.meta.persona)}::${rowId}::${columnId}`;
    },
    [getPersonaSlug],
  );

  const findActiveItem = useCallback(
    (id: string | null): JourneyItem | undefined => {
      if (!id) return undefined;
      const [type, persona, rowId, colId, idxStr] = id.split("::");
      const idx = Number.parseInt(idxStr, 10);

      const journey = journeys.find(
        (candidate) =>
          (candidate.meta.journeyType || "onboarding") === type &&
          getPersonaSlug(candidate.meta.persona) === persona,
      );
      if (!journey) return undefined;

      const row = journey.rows.find((candidate) => candidate.id === rowId);
      const cell = row?.cells.find((candidate) => candidate.columnId === colId);
      return cell?.items[idx];
    },
    [getPersonaSlug, journeys],
  );

  return {
    activeId,
    isOptionPressed,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    handleTrashDropConfirm,
    handleTrashDropCancel,
    getItemId,
    getCellId,
    findActiveItem,
  };
}
