"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { VariantProps } from "class-variance-authority";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  NestedOverlayLayerProvider,
  OVERLAY_LAYER_CLASS_NAME,
  type OverlayLayer,
} from "@/components/ui/overlay-layer";
import { cn } from "@/lib/utils";
import { modalContentMotion, overlayBackdropMotion } from "@/components/ui/overlay-motion";
import { useSquircleFallbackRef } from "@/components/ui/squircle";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 bg-ux-scrim/30 backdrop-blur-sm", overlayBackdropMotion, className)}
    {...props}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & {
    layer?: OverlayLayer;
  }
>(({ children, className, layer = "default", ...props }, ref) => {
  const squircleRadius = 24;
  const squircleRef = useSquircleFallbackRef<React.ElementRef<typeof AlertDialogPrimitive.Content>>(
    { forwardedRef: ref, radius: squircleRadius },
  );

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay className={OVERLAY_LAYER_CLASS_NAME[layer]} />
      <AlertDialogPrimitive.Content
        ref={squircleRef}
        data-squircle-radius={squircleRadius}
        className={cn(
          "bg-ux-surface border-border/60 shape-squircle data-[state=closed]:slide-out-to-bottom-3 data-[state=open]:slide-in-from-bottom-3 sm:data-[state=closed]:slide-out-to-bottom-2 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:slide-in-from-bottom-2 sm:data-[state=open]:zoom-in-95 fixed bottom-4 left-1/2 grid max-h-ux-viewport-fit w-ux-inline-fit -translate-x-1/2 gap-5 overflow-y-auto border p-5 drop-shadow-lg sm:bottom-auto sm:top-1/2 sm:w-full sm:max-w-ux-modal sm:-translate-y-1/2 sm:p-6",
          OVERLAY_LAYER_CLASS_NAME[layer],
          modalContentMotion,
          className,
        )}
        {...props}
      >
        <NestedOverlayLayerProvider>{children}</NestedOverlayLayerProvider>
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
});
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-1.5 text-center sm:text-left", className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3", className)}
      {...props}
    />
  );
}

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight sm:text-xl", className)}
    {...props}
  />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

interface AlertDialogActionProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> {
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  AlertDialogActionProps
>(({ className, variant = "default", ...props }, ref) => (
  <Button asChild variant={variant} shape="control" className={className}>
    <AlertDialogPrimitive.Action ref={ref} {...props} />
  </Button>
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <Button asChild variant="outline" shape="control" className={className}>
    <AlertDialogPrimitive.Cancel ref={ref} {...props} />
  </Button>
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
