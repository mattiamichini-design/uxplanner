"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { Trash2 } from "lucide-react";

export const TrashDropZone = memo(function TrashDropZone({ active }: { active: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "trash-drop-zone",
  });

  if (!active) return null;

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "fixed bottom-8 right-8 z-(--z-ux-drop) flex size-20 items-center justify-center rounded-full border-2 transition-transform duration-(--ux-duration-fast) ease-[var(--ux-ease-out)] motion-reduce:transition-none motion-reduce:!scale-100",
        isOver
          ? "scale-125 border-ux-drop-border bg-ux-drop-surface shadow-xl"
          : "border-muted-foreground/30 bg-background/80 shadow-lg backdrop-blur-sm",
      )}
    >
      <div className={clsx("transition-transform duration-(--ux-duration-fast) ease-[var(--ux-ease-out)] motion-reduce:transition-none motion-reduce:!scale-100", isOver && "scale-110")}>
        <Trash2 className={clsx("size-8", isOver ? "text-ux-danger-text" : "text-muted-foreground")} />
      </div>
    </div>
  );
});
