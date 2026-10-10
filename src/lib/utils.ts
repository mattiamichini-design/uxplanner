import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Teach the merge about the semantic scales declared in globals.css (@theme static), so a text-ux-label size is
// not mistaken for a colour and rounded-ux-* or h-ux-* utilities still replace their generic counterparts.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["ux-label", "ux-micro"],
      radius: ["ux-panel", "ux-control", "ux-button", "ux-badge", "ux-xs"],
      container: [
        "ux-rail",
        "ux-sidebar-compact",
        "ux-sidebar",
        "ux-reading",
        "ux-profile",
        "ux-story",
        "ux-dialog",
        "ux-dialog-wide",
        "ux-modal",
        "ux-drawer",
        "ux-sheet",
        "ux-controls",
      ],
      spacing: [
        "ux-touch",
        "ux-header",
        "ux-toolbar",
        "ux-icon",
        "ux-field-min",
        "ux-chip-list",
        "ux-viewport-fit",
        "ux-viewport-tight",
        "ux-inline-fit",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
