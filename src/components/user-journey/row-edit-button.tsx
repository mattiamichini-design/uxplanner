"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RowEditButtonProps {
  label: string;
  rowId: string;
  onEdit: (rowId: string) => void;
}

export function RowEditButton({ label, rowId, onEdit }: RowEditButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-ux-muted hover:text-ux-text size-5 rounded-full opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
      onClick={() => onEdit(rowId)}
      aria-label={`Edit row ${label}`}
    >
      <Pencil className="size-3.5" />
    </Button>
  );
}
