"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { anchoredOverlayMotion } from "@/components/ui/overlay-motion";
import {
  OVERLAY_LAYER_CLASS_NAME,
  type OverlayLayer,
  useOverlayLayer,
} from "@/components/ui/overlay-layer";
import { SelectToggleRoot, useSelectToggle } from "@/hooks/use-select-toggle";
import {
  SquircleInset,
  SquircleSurfaceProvider,
  useSquircleFallbackRef,
  useSquircleRadius,
} from "@/components/ui/squircle";

const Select = SelectToggleRoot;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const selectTriggerVariants = cva(
  "group border-input ring-offset-background data-[placeholder]:text-muted-foreground focus:ring-ring flex w-full cursor-pointer items-center justify-between gap-2 whitespace-nowrap border bg-transparent text-sm shadow-none focus:outline-none focus:ring-1 focus:ring-inset disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:pointer-events-auto [&>span]:min-w-0 [&>span]:flex-1 [&>span]:text-left [&>span]:line-clamp-1",
  {
    variants: {
      size: {
        default: "h-11 px-3 py-2 md:h-9",
        sm: "h-11 px-3 py-2 md:h-8",
        adaptive: "min-h-11 px-3 py-2 md:min-h-9",
        content: "h-auto",
      },
      shape: {
        default: "shape-capsule",
        control: "shape-capsule",
        document: "shape-squircle",
        pill: "shape-capsule",
      },
    },
    defaultVariants: {
      size: "default",
      shape: "default",
    },
  },
);

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> &
    VariantProps<typeof selectTriggerVariants>
>(({ className, children, shape, size, ...props }, ref) => {
  const toggleContext = useSelectToggle();
  const pointerSequenceRef = React.useRef<"pass" | "close" | "veto" | null>(null);
  const resolvedShape = shape ?? "default";
  const semanticShape = resolvedShape === "document" ? "roundedRectangle" : "capsule";
  const squircleRadius = 16;
  const squircleRef = useSquircleFallbackRef<React.ElementRef<typeof SelectPrimitive.Trigger>>({
    enabled: semanticShape === "roundedRectangle",
    forwardedRef: ref,
    radius: squircleRadius,
  });
  const {
    onClick,
    onPointerDown,
    ...triggerProps
  } = props;

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(event);
      if (event.defaultPrevented) {
        pointerSequenceRef.current = "veto";
        return;
      }
      if (event.button !== 0 || event.ctrlKey) {
        pointerSequenceRef.current = null;
        return;
      }

      // Radix opens mouse selects during pointerdown and touch selects during
      // click. Snapshot the state before Radix handles this gesture, but defer
      // the close until `onClick` so consumers can still veto it there.
      pointerSequenceRef.current = toggleContext?.open ? "close" : "pass";
    },
    [onPointerDown, toggleContext?.open],
  );

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      const pointerSequence = pointerSequenceRef.current;
      pointerSequenceRef.current = null;
      if (event.defaultPrevented) return;

      if (pointerSequence === "veto") {
        event.preventDefault();
        return;
      }

      if (pointerSequence === "close") {
        event.preventDefault();
        toggleContext?.setOpen(false);
        return;
      }

      // Closing on the completed activation works for both mouse and touch:
      // Radix's duplicate mouse `open(true)` during pointerdown is ignored by
      // the root, while preventing this click suppresses touch's reopen.
      if (pointerSequence === null && toggleContext?.open) {
        event.preventDefault();
        toggleContext.setOpen(false);
      }
    },
    [onClick, toggleContext],
  );

  return (
    <SelectPrimitive.Trigger
      ref={squircleRef}
      data-slot="select-trigger"
      data-select-shape={resolvedShape}
      data-size={size ?? "default"}
      data-shape={semanticShape}
      data-squircle-radius={semanticShape === "roundedRectangle" ? squircleRadius : undefined}
      className={cn(selectTriggerVariants({ shape, size }), className)}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      {...triggerProps}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-5 shrink-0 text-ux-muted transition-transform duration-(--ux-duration-fast) ease-[var(--ux-ease-out)] group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="size-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="size-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  layer?: OverlayLayer;
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, layer, position = "popper", ...props }, ref) => {
  const resolvedLayer = useOverlayLayer(layer);
  const squircleRadius = 24;
  const squircleRef = useSquircleFallbackRef<React.ElementRef<typeof SelectPrimitive.Content>>({
    forwardedRef: ref,
    radius: squircleRadius,
  });

  return (
    <SelectPrimitive.Portal>
      <SquircleSurfaceProvider radius={squircleRadius}>
        <SelectPrimitive.Content
          ref={squircleRef}
          data-overlay-layer={resolvedLayer}
          data-squircle-radius={squircleRadius}
          className={cn(
            "bg-popover text-popover-foreground shape-squircle relative max-h-[var(--radix-select-content-available-height)] max-w-[var(--radix-select-content-available-width)] min-w-[8rem] origin-[var(--radix-select-content-transform-origin)] overflow-y-auto overflow-x-hidden border drop-shadow-md",
            anchoredOverlayMotion,
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            OVERLAY_LAYER_CLASS_NAME[resolvedLayer],
            position === "popper" &&
              "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            className,
          )}
          position={position}
          {...props}
        >
          <SelectScrollUpButton />
          <SquircleInset inset="sm">
            <SelectPrimitive.Viewport
              className={cn(
                position === "popper" && "w-full min-w-[min(var(--radix-select-trigger-width),var(--radix-select-content-available-width))]",
              )}
            >
              {children}
            </SelectPrimitive.Viewport>
          </SquircleInset>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SquircleSurfaceProvider>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const squircleRadius = useSquircleRadius({ mode: "concentric", radius: "control" });
  const squircleRef = useSquircleFallbackRef<React.ElementRef<typeof SelectPrimitive.Item>>({
    forwardedRef: ref,
    radius: squircleRadius,
  });

  return (
    <SelectPrimitive.Item
      ref={squircleRef}
      data-squircle-radius={squircleRadius}
      className={cn(
        "focus:bg-muted focus:text-foreground shape-squircle relative flex w-full cursor-pointer select-none items-center min-h-11 py-2 pl-3 pr-10 text-sm [&>span:last-child]:min-w-0 [&>span:last-child]:[overflow-wrap:anywhere] outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="size-3.5 absolute right-3 flex items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("bg-muted -mx-1 my-1 h-px", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  selectTriggerVariants,
};
