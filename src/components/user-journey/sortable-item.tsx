"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type KeyboardEventHandler, type ReactNode } from "react";

interface SortableItemProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}

export function SortableItem({ id, children, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? "var(--z-ux-drag)" : "auto",
    position: "relative" as const, // Ensure it stays in flow but handles stacking context
    touchAction: "none", // Prevent scrolling capture on touch devices while dragging (optional, but good for dnd)
  };
  const { onKeyDown, ...pointerListeners } = listeners ?? {};
  const keyboardListener = onKeyDown as KeyboardEventHandler<HTMLButtonElement> | undefined;

  return (
    <div ref={setNodeRef} style={style} className="min-w-0" {...pointerListeners}>
      <button
        type="button"
        {...attributes}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={keyboardListener}
        className="sr-only focus:not-sr-only focus:absolute focus:z-(--z-ux-raised) focus:rounded-md focus:bg-background focus:px-2 focus:py-1"
        aria-label="Move item"
      />
      {children}
    </div>
  );
}
