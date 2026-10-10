"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "@/i18n/use-translations";

import { Button } from "@/components/ui/button";
import {
  NestedOverlayLayerProvider,
  OVERLAY_LAYER_CLASS_NAME,
  type OverlayLayer,
} from "@/components/ui/overlay-layer";
import { cn } from "@/lib/utils";
import { overlayBackdropMotion, sheetContentMotion } from "@/components/ui/overlay-motion";

const SheetCloseContext = React.createContext(true);

const Sheet = DialogPrimitive.Root;

const SheetTrigger = DialogPrimitive.Trigger;

const SheetPortal = DialogPrimitive.Portal;

const SheetClose = DialogPrimitive.Close;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 bg-ux-scrim/30 backdrop-blur-sm", overlayBackdropMotion, className)}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  handleBreakpoint?: "sm" | "md";
  layer?: OverlayLayer;
  motion?: "default" | "instant";
  overlayClassName?: string;
  overlayCloseLabel?: string;
  portalContainer?: HTMLElement | null;
  side?: "top" | "bottom" | "left" | "right";
  showClose?: boolean;
  showHandle?: boolean;
}

interface SheetHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  hiddenFrom?: "sm" | "md";
}

const SheetHandle = React.forwardRef<HTMLDivElement, SheetHandleProps>(
  ({ className, hiddenFrom = "sm", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid place-items-center pt-3",
        hiddenFrom === "sm" ? "sm:hidden" : "md:hidden",
        className,
      )}
      data-sheet-handle
      {...props}
    >
      <div className="bg-muted h-1.5 w-12 rounded-full" aria-hidden />
    </div>
  ),
);
SheetHandle.displayName = "SheetHandle";

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(
  (
    {
      className,
      handleBreakpoint = "md",
      layer = "default",
      motion = "default",
      overlayClassName,
      overlayCloseLabel,
      portalContainer,
      side = "right",
      children,
      showClose = true,
      showHandle = true,
      ...props
    },
    ref,
  ) => {
    return (
      <SheetPortal container={portalContainer ?? undefined}>
        <SheetOverlay
          aria-hidden="true"
          className={cn(
            overlayClassName,
            motion === "instant"
              ? "data-[state=open]:animate-none data-[state=closed]:animate-none"
              : "data-[state=open]:duration-(--ux-duration-sheet-open) data-[state=closed]:duration-(--ux-duration-sheet-close)",
            OVERLAY_LAYER_CLASS_NAME[layer],
          )}
          data-overlay-close-label={overlayCloseLabel}
          data-slot="sheet-overlay"
        />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "bg-background border-border/60 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom fixed inset-x-0 bottom-0 flex max-h-ux-viewport-tight flex-col rounded-t-2xl border-t shadow-lg",
            motion === "instant" ? "animate-none" : sheetContentMotion,
            OVERLAY_LAYER_CLASS_NAME[layer],
            "md:rounded-control md:max-h-ux-viewport-fit md:border",
            side === "right" &&
              "md:data-[state=closed]:slide-out-to-right md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=open]:slide-in-from-right md:data-[state=open]:slide-in-from-bottom-0 md:bottom-4 md:left-auto md:right-4 md:top-4 md:w-ux-sheet",
            side === "left" &&
              "md:data-[state=closed]:slide-out-to-left md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:slide-in-from-left md:bottom-4 md:left-4 md:right-auto md:top-4 md:w-ux-sheet",
            side === "top" &&
              "md:data-[state=closed]:slide-out-to-top md:data-[state=open]:slide-in-from-top md:data-[state=open]:slide-in-from-bottom-0 md:inset-x-6 md:bottom-auto md:top-4 md:max-h-[24rem]",
            side === "bottom" &&
              "md:data-[state=closed]:slide-out-to-bottom md:data-[state=open]:slide-in-from-bottom md:inset-x-6 md:bottom-4 md:top-auto",
            className,
          )}
          {...props}
        >
          <NestedOverlayLayerProvider>
            {showHandle ? <SheetHandle hiddenFrom={handleBreakpoint} /> : null}
            <SheetCloseContext.Provider value={showClose}>{children}</SheetCloseContext.Provider>
          </NestedOverlayLayerProvider>
        </DialogPrimitive.Content>
      </SheetPortal>
    );
  },
);
SheetContent.displayName = DialogPrimitive.Content.displayName;

const SheetHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const showClose = React.useContext(SheetCloseContext);
  const t = useTranslations("shared");
  return <div className={cn("border-border/60 relative grid shrink-0 grid-rows-[minmax(var(--spacing-ux-touch),auto)_auto] items-center gap-2 border-b px-5 py-4 text-center [&_[data-slot=sheet-title]]:row-start-1 [&_[data-slot=sheet-title]]:px-12 [&_[data-slot=sheet-description]]:row-start-2 [&_[data-slot=sheet-description]]:text-left", className)} data-button-elevation="flat" {...props}>
    {children}
    {showClose ? <Button asChild variant="outline" size="icon" shape="circle" data-slot="dialog-close" className="absolute right-5 top-4 size-11 rounded-full border-0 bg-muted shadow-none"><DialogPrimitive.Close><X className="size-5"/><span className="sr-only">{t("close")}</span></DialogPrimitive.Close></Button> : null}
  </div>;
};
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "shrink-0 flex flex-col-reverse gap-2 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:flex-row md:justify-end md:gap-3",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-slot="sheet-title"
    className={cn("text-lg font-semibold leading-none tracking-tight md:text-xl", className)}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    data-slot="sheet-description"
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

const SheetBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4", className)} {...props} />
);
SheetBody.displayName = "SheetBody";

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetHandle,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetBody,
};
