"use client";

import { memo } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";

export const DroppableCell = memo(function DroppableCell({
  cellId,
  children,
  className,
  onClick,
}: {
  cellId: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: cellId,
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.target !== event.currentTarget ||
      !onClick ||
      (event.key !== "Enter" && event.key !== " ")
    ) {
      return;
    }

    event.preventDefault();
    onClick();
  };

  return (
    <div
      ref={setNodeRef}
      className={clsx("min-w-0", className, isOver && "ring-primary bg-primary/5 ring-2 ring-inset")}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="gridcell"
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
});
