"use client";

import { useEffect, useRef } from "react";
import { Pencil, Copy, Trash2 } from "lucide-react";

interface ItemContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ItemContextMenu({
  position,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}: ItemContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!position) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Consume the key so an enclosing layer stays open.
      e.preventDefault();
      onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [position, onClose]);

  if (!position) return null;

  // Adjust position to keep menu in viewport
  const adjustedStyle = {
    left: `max(0px, min(${position.x}px, calc(100vw - 180px)))`,
    top: `max(0px, min(${position.y}px, calc(100vh - 150px)))`,
  };

  return (
    <div
      ref={menuRef}
      className="bg-ux-surface text-ux-text border-ux-border fixed z-(--z-ux-chrome) min-w-[160px] rounded-md border p-1 shadow-lg"
      style={adjustedStyle}
    >
      <button
        type="button"
        className="hover:bg-ux-soft hover:text-ux-primary flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm"
        onClick={() => {
          onEdit();
          onClose();
        }}
      >
        <Pencil className="size-4" />
        Edit
      </button>
      <button
        type="button"
        className="hover:bg-ux-soft hover:text-ux-primary flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm"
        onClick={() => {
          onDuplicate();
          onClose();
        }}
      >
        <Copy className="size-4" />
        Duplicate
      </button>
      <div className="bg-ux-border my-1 h-px" />
      <button
        type="button"
        className="hover:bg-ux-danger hover:text-ux-on-primary flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-ux-danger-text"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        <Trash2 className="size-4" />
        Delete
      </button>
    </div>
  );
}
