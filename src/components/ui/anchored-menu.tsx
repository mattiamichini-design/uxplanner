"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type AnchoredMenuProps = {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
};

export function AnchoredMenu({
  label,
  trigger,
  children,
  align = "start",
  className,
  triggerClassName,
  contentClassName,
}: AnchoredMenuProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const focusContentEdge = (edge: "first" | "last") => {
    requestAnimationFrame(() => {
      const controls = rootRef.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])',
      );
      if (!controls || controls.length < 2) return;
      controls[edge === "first" ? 1 : controls.length - 1]?.focus();
    });
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Consume the key so an enclosing layer (a dialog, or the landing's demo frame) stays open.
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? contentId : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          setOpen(true);
          focusContentEdge(event.key === "ArrowDown" ? "first" : "last");
        }}
        className={cn("border-ux-border bg-ux-surface focus-visible:ring-ux-primary flex h-8 items-center gap-2 rounded-ux-control border px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2", triggerClassName)}
      >
        {trigger}
      </button>
      {open ? (
        <div
          id={contentId}
          role="group"
          aria-label={label}
          className={cn(
            "border-ux-border bg-ux-surface absolute top-[calc(100%+0.5rem)] z-(--z-ux-menu) grid min-w-52 max-w-[calc(100vw-2rem)] gap-1 rounded-ux-control border p-1.5 shadow-lg",
            align === "end" ? "right-0" : "left-0",
            contentClassName,
          )}
          onClick={(event) => {
            const action = (event.target as Element).closest("button,a");
            if (!action || action.closest("[data-anchored-menu-keep-open]")) return;
            setOpen(false);
            requestAnimationFrame(() => {
              if (document.activeElement === document.body) triggerRef.current?.focus();
            });
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export const anchoredMenuItemClassName =
  "hover:bg-ux-selected focus-visible:ring-ux-primary flex min-h-11 w-full items-center gap-2 rounded-ux-button px-3 text-left text-sm [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 md:min-h-10";

export function ResponsiveActionMenu({
  label,
  title,
  description,
  trigger,
  children,
  align = "end",
  className,
  triggerClassName,
}: AnchoredMenuProps & { title: string; description: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="shrink-0 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label={label}
              className={cn("border-ux-border bg-ux-surface focus-visible:ring-ux-primary flex size-11 items-center justify-center rounded-ux-control border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2", triggerClassName)}
            >
              {trigger}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="dev-theme font-sans" showHandle>
            <SheetHeader className="text-left"><SheetTitle>{title}</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader>
            <SheetBody className="grid gap-2" onClick={(event) => {
              if ((event.target as HTMLElement).closest("button,a")) setMobileOpen(false);
            }}>{children}</SheetBody>
          </SheetContent>
        </Sheet>
      </div>
      <AnchoredMenu
        label={label}
        trigger={trigger}
        align={align}
        className={cn("hidden md:block", className)}
        triggerClassName={triggerClassName}
      >
        {children}
      </AnchoredMenu>
    </>
  );
}
