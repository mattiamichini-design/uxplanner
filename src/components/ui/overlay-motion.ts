// Keep the exit endpoint until Radix Presence removes the portal.
const overlayBackdropMotion =
  "motion-overlay-reduced fill-mode-both data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-(--ux-duration-base) data-[state=closed]:duration-(--ux-duration-fast) ease-[var(--ux-ease-out)]";

const anchoredOverlayMotion =
  "motion-overlay-reduced fill-mode-both data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:duration-(--ux-duration-popover-open) data-[state=closed]:duration-(--ux-duration-popover-close) ease-[var(--ux-ease-out)]";

const modalContentMotion =
  "motion-overlay-reduced fill-mode-both data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-(--ux-duration-base) data-[state=closed]:duration-(--ux-duration-fast) ease-[var(--ux-ease-out)]";

const sheetContentMotion =
  "motion-overlay-reduced fill-mode-both data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:duration-(--ux-duration-sheet-open) data-[state=closed]:duration-(--ux-duration-sheet-close) ease-[var(--ux-ease-drawer)]";

export { anchoredOverlayMotion, modalContentMotion, overlayBackdropMotion, sheetContentMotion };
