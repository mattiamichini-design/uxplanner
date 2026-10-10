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
import {
  modalContentMotion,
  overlayBackdropMotion,
  sheetContentMotion,
} from "@/components/ui/overlay-motion";
import { useSquircleFallbackRef } from "@/components/ui/squircle";

const DialogCloseContext = React.createContext(true);

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 bg-ux-scrim/30 backdrop-blur-sm", overlayBackdropMotion, className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideClose?: boolean;
    layout?: "default" | "fullscreen";
    layer?: OverlayLayer;
    mobilePlacement?: "inset" | "bottom-sheet";
    portalContainer?: HTMLElement | null;
  }
>(
  (
    {
      className,
      children,
      hideClose = false,
      layout = "default",
      layer = "default",
      mobilePlacement = "inset",
      portalContainer,
      ...props
    },
    ref,
  ) => {
    const squircleRadius = 24;
    const isMobileBottomSheet = layout === "default" && mobilePlacement === "bottom-sheet";
    const squircleRef = useSquircleFallbackRef<React.ElementRef<typeof DialogPrimitive.Content>>({
      enabled: layout === "default",
      fallbackMediaQuery: isMobileBottomSheet ? "(min-width: 768px)" : undefined,
      forwardedRef: ref,
      radius: squircleRadius,
    });

    return (
      <DialogPortal container={portalContainer ?? undefined}>
        <DialogOverlay
          className={cn(
            OVERLAY_LAYER_CLASS_NAME[layer],
            isMobileBottomSheet && "data-[state=open]:duration-(--ux-duration-sheet-open) data-[state=closed]:duration-(--ux-duration-sheet-close) md:data-[state=open]:duration-(--ux-duration-base) md:data-[state=closed]:duration-(--ux-duration-fast)",
            layout === "fullscreen" && "z-(--z-ux-modal)",
            layer === "nested" && OVERLAY_LAYER_CLASS_NAME.nested,
          )}
        />
        <DialogPrimitive.Content
          ref={squircleRef}
          data-squircle-radius={layout === "default" ? squircleRadius : undefined}
          data-mobile-placement={layout === "default" ? mobilePlacement : undefined}
          className={cn(
            layout === "default"
              ? isMobileBottomSheet
                ? "bg-background border-border/60 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom md:shape-squircle md:data-[state=closed]:slide-out-to-bottom-2 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:slide-in-from-bottom-2 md:data-[state=open]:zoom-in-95 fixed inset-x-0 bottom-0 top-auto flex flex-col max-h-ux-viewport-tight w-full max-w-none gap-5 overflow-hidden overscroll-contain rounded-b-none rounded-t-3xl border-x-0 border-b-0 border-t p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] drop-shadow-lg md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-ux-viewport-fit md:w-full md:max-w-ux-modal md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:border md:p-6 md:ease-[var(--ux-ease-out)] md:data-[state=closed]:duration-(--ux-duration-fast) md:data-[state=open]:duration-(--ux-duration-base)"
                : "bg-background border-border/60 shape-squircle data-[state=closed]:slide-out-to-bottom-3 data-[state=open]:slide-in-from-bottom-3 sm:data-[state=closed]:slide-out-to-bottom-2 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:slide-in-from-bottom-2 sm:data-[state=open]:zoom-in-95 fixed bottom-4 left-1/2 flex flex-col max-h-ux-viewport-fit w-ux-inline-fit -translate-x-1/2 gap-5 overflow-hidden border p-5 drop-shadow-lg sm:bottom-auto sm:top-1/2 sm:w-full sm:max-w-ux-modal sm:-translate-y-1/2 sm:p-6"
              : "bg-background fixed inset-0 z-(--z-ux-modal) grid h-[100dvh] w-full gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none",
            layout === "default" && OVERLAY_LAYER_CLASS_NAME[layer],
            isMobileBottomSheet ? sheetContentMotion : modalContentMotion,
            layer === "nested" && OVERLAY_LAYER_CLASS_NAME.nested,
            className,
          )}
          {...props}
        >
          <NestedOverlayLayerProvider>
            <DialogCloseContext.Provider value={!hideClose}>{children}</DialogCloseContext.Provider>
          </NestedOverlayLayerProvider>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  layout?: "default" | "toolbar";
  mobileAction?: React.ReactNode;
}

const DialogHeader = ({
  children,
  className,
  layout = "default",
  mobileAction,
  ...props
}: DialogHeaderProps) => {
  const resolvedLayout = mobileAction ? "toolbar" : layout;
  const showClose = React.useContext(DialogCloseContext);
  const t = useTranslations("shared");

  return (
    <div
      data-slot="dialog-header"
      data-dialog-layout={resolvedLayout}
      className={cn(
        resolvedLayout === "toolbar"
          ? [
              "relative grid grid-cols-[var(--spacing-ux-touch)_minmax(0,1fr)_var(--spacing-ux-touch)] grid-rows-[minmax(var(--spacing-ux-touch),auto)_auto] items-center gap-y-1.5 text-center sm:block sm:text-left",
              "[&_[data-slot=dialog-description]]:col-span-3 [&_[data-slot=dialog-description]]:row-start-2 sm:[&_[data-slot=dialog-description]]:mt-1.5 [&_[data-slot=dialog-title]]:col-start-2 [&_[data-slot=dialog-title]]:row-start-1",
            ]
          : "relative shrink-0 grid grid-rows-[minmax(var(--spacing-ux-touch),auto)] items-center gap-2 text-center [&_[data-slot=dialog-title]]:row-start-1 [&_[data-slot=dialog-title]]:px-12 [&_[data-slot=dialog-description]]:row-start-2 [&_[data-slot=dialog-description]]:text-left",
        "[&_[data-slot=button]]:shadow-none",
        className,
      )}
      data-button-elevation="flat"
      {...props}
    >
      {children}
      {showClose ? <Button asChild variant="outline" size="icon" shape="circle" data-slot="dialog-close" className="absolute right-0 top-0 size-11 bg-muted border-0 rounded-full shadow-none"><DialogPrimitive.Close><X className="size-5" /><span className="sr-only">{t("close")}</span></DialogPrimitive.Close></Button> : null}
      {mobileAction ? (
        <div data-slot="dialog-mobile-action" className="absolute right-0 top-0 z-(--z-ux-raised) sm:hidden">
          {mobileAction}
        </div>
      ) : null}
    </div>
  );
};
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="dialog-footer"
    className={cn("shrink-0 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-slot="dialog-title"
    className={cn("text-lg font-semibold leading-none tracking-tight sm:text-xl", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    data-slot="dialog-description"
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogIntro = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    data-slot="dialog-intro"
    className={cn("text-muted-foreground text-pretty text-left text-sm leading-6", className)}
    {...props}
  />
));
DialogIntro.displayName = "DialogIntro";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogIntro,
};
