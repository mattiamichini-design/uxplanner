"use client";

import { memo, useMemo } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import clsx from "clsx";

import type { JourneyItem } from "@/lib/user-journey/types";

const emphasisIcon: Record<NonNullable<JourneyItem["emphasis"]>, string> = {
  positive: "👍",
  neutral: "➜",
  negative: "⚠️",
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({
  text,
  searchQuery,
  isMatch,
}: {
  text: string;
  searchQuery?: string;
  isMatch: boolean;
}) {
  const normalizedQuery = searchQuery?.trim();

  if (!normalizedQuery || !isMatch) return text;

  const parts = text.split(new RegExp(`(${escapeRegex(normalizedQuery)})`, "gi")).map(
    (part, index, allParts) => ({
      key: `${allParts.slice(0, index).join("").length}-${part}`,
      part,
    }),
  );

  return (
    <>
      {parts.map(({ key, part }) => {
        return part.toLowerCase() === normalizedQuery.toLowerCase() ? (
          <mark key={key} className="rounded-sm bg-ux-mark px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          <span key={key}>{part}</span>
        );
      })}
    </>
  );
}

export const StickyNote = memo(function StickyNote({
  item,
  onClick,
  onContextMenu,
  searchQuery,
}: {
  item: JourneyItem;
  onClick?: (event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>) => void;
  onContextMenu?: (event: MouseEvent<HTMLElement>) => void;
  searchQuery?: string;
}) {
  const isMatch = useMemo(() => {
    if (!searchQuery?.trim()) return false;
    return item.text.toLowerCase().includes(searchQuery.toLowerCase());
  }, [item.text, searchQuery]);

  const wrapperClass = clsx(
    "bg-ux-surface border border-ux-muted/30 gap-1 grid w-full min-w-0 px-4 py-3 rounded-xl text-ux-text text-sm transition-colors cursor-pointer hover:border-ux-primary hover:shadow-sm",
    isMatch && "border-ux-match ring-1 ring-ux-match bg-ux-match-soft/50",
  );

  const handleContextMenu = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onContextMenu?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onClick || (event.key !== "Enter" && event.key !== " ")) return;

    event.preventDefault();
    onClick(event);
  };

  const isInteractive = Boolean(onClick || onContextMenu);
  const content = (
    <>
      <div className="flex min-w-0 items-start gap-2 text-sm">
        <p className="min-w-0 [overflow-wrap:anywhere] leading-relaxed">
          <HighlightedText text={item.text} searchQuery={searchQuery} isMatch={isMatch} />
        </p>
      </div>
      {item.emphasis ? (
        <p className="text-ux-muted flex items-center gap-1 text-xs">
          <span>{emphasisIcon[item.emphasis]}</span>
          <span className="capitalize">{item.emphasis}</span>
        </p>
      ) : null}
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        className={clsx(wrapperClass, "text-left")}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={wrapperClass}>
      {content}
    </article>
  );
});
