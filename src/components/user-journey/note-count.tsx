export function NoteCount({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-2 text-ux-muted">
      <svg
        viewBox="0 0 22 20"
        className="h-5 w-[22px] shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="20" height="18" rx="3" />
        <path d="M6 7h10M6 11h7" />
      </svg>
      <span>{count} {count === 1 ? "note" : "notes"}</span>
    </span>
  );
}
