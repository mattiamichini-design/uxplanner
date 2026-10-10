"use client";

import { ChevronRight } from "lucide-react";

import { MarkdownDisplay } from "@/components/ui/markdown-display";
import type { JourneyData } from "@/lib/user-journey/types";

export function UserJourneyBoardNotes({ journey }: { journey: JourneyData }) {
  if (journey.content) {
    return (
      <details className="border-ux-border bg-ux-soft/40 open:bg-ux-canvas group rounded-2xl border transition-colors">
        <summary className="text-ux-text flex cursor-pointer select-none list-none items-center justify-between p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <span>Notes & Context</span>
          <ChevronRight className="text-ux-muted size-4 transition-transform duration-(--ux-duration-fast) ease-[var(--ux-ease-out)] motion-reduce:transition-none group-open:rotate-90" />
        </summary>
        <div className="text-ux-muted px-4 pb-4 pt-0 text-sm leading-relaxed">
          <MarkdownDisplay content={journey.content} />
        </div>
      </details>
    );
  }

  if (journey.notes && journey.notes.length) {
    return (
      <details className="border-ux-border bg-ux-soft/40 open:bg-ux-canvas group rounded-2xl border transition-colors">
        <summary className="text-ux-text flex cursor-pointer select-none list-none items-center justify-between p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <span>Notes</span>
          <ChevronRight className="text-ux-muted size-4 transition-transform duration-(--ux-duration-fast) ease-[var(--ux-ease-out)] motion-reduce:transition-none group-open:rotate-90" />
        </summary>
        <div className="text-ux-muted px-4 pb-4 pt-0 text-sm leading-relaxed">
          <ul className="grid gap-2">
            {journey.notes.map((note) => (
              <li key={note} className="leading-relaxed">
                {note}
              </li>
            ))}
          </ul>
        </div>
      </details>
    );
  }

  return null;
}
