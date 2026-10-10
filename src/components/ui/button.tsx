"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  SquircleSurfaceProvider,
  useSquircleFallbackRef,
  useSquircleRadius,
} from "@/components/ui/squircle";

const buttonVariants = cva(
  "inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      align: {
        center: "justify-center text-center",
        start: "justify-start text-left",
      },
      variant: {
        default:
          "border border-input bg-background text-foreground hover:bg-muted hover:text-foreground",
        inverse: "bg-foreground text-background hover:bg-foreground/90 hover:text-background",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground",
        outline: "border border-input bg-background hover:bg-muted hover:text-foreground",
        ghost: "hover:bg-muted hover:text-foreground",
        text: "bg-transparent text-foreground underline-offset-4 hover:underline",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-11 gap-1 px-2 text-xs md:h-7 [&_svg]:size-3",
        default: "h-11 px-4 py-2 md:h-9",
        sm: "h-11 px-3 text-xs md:h-8",
        lg: "h-11 px-8 md:h-10",
        icon: "size-11",
        "icon-xs": "size-11 [&_svg]:size-3",
        "icon-sm": "size-11",
        "icon-lg": "size-11",
      },
      shape: {
        capsule: "shape-capsule",
        circle: "shape-circle",
        roundedRectangle: "shape-squircle",
      },
      motion: {
        default:
          "transition-[color,background-color,border-color,box-shadow,transform] duration-(--ux-duration-fast) ease-[var(--ux-ease-out)] active:scale-[0.96] motion-reduce:transition-colors motion-reduce:active:scale-100",
        static: "transition-colors",
      },
    },
    compoundVariants: [
      {
        variant: "text",
        className: "h-auto p-0 active:scale-100",
      },
    ],
    defaultVariants: {
      align: "center",
      variant: "default",
      size: "default",
      motion: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "shape"> {
  asChild?: boolean;
  /** Apple-aligned control geometry. Labeled actions default to capsule; icon sizes to circle. */
  shape?:
    | "capsule"
    | "circle"
    | "roundedRectangle"
    /** @deprecated Use capsule. */
    | "default"
    /** @deprecated Use capsule for labeled actions or circle for icon-only actions. */
    | "control"
    /** @deprecated Use roundedRectangle. */
    | "document"
    /** @deprecated Use roundedRectangle. */
    | "preview"
    /** @deprecated Use capsule for labeled actions or circle for icon-only actions. */
    | "pill"
    | null;
}

function resolveButtonShape(
  shape: ButtonProps["shape"],
  iconOnly: boolean,
): "capsule" | "circle" | "roundedRectangle" | null {
  if (shape === null) return null;
  if (shape === "circle" || shape === "capsule" || shape === "roundedRectangle") return shape;
  if (shape === "document" || shape === "preview") return "roundedRectangle";
  return iconOnly ? "circle" : "capsule";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ align, className, variant, size, shape, motion, asChild = false, ...props }, ref) => {
    const isText = variant === "text";
    const requestedSize = isText || size === null ? null : (size ?? "default");
    const resolvedSize = shape === "circle" && requestedSize !== null ? "icon" : requestedSize;
    const iconOnly =
      resolvedSize !== null && ["icon", "icon-xs", "icon-sm", "icon-lg"].includes(resolvedSize);
    const resolvedShape = isText ? null : resolveButtonShape(shape, iconOnly);
    const resolvedMotion = isText && motion === undefined ? "static" : motion;
    const squircleEnabled = resolvedShape === "roundedRectangle";
    const radius = useSquircleRadius({
      mode: "auto",
      radius: "control",
    });
    const squircleRef = useSquircleFallbackRef<HTMLButtonElement>({
      enabled: squircleEnabled,
      forwardedRef: ref,
      radius,
    });
    const Comp = asChild ? Slot : "button";
    const control = (
      <Comp
        data-align={align ?? "center"}
        data-emphasis={variant === undefined || variant === "default" ? "primary" : undefined}
        data-slot="button"
        data-shape={resolvedShape ?? undefined}
        data-squircle-radius={squircleEnabled ? radius : undefined}
        data-variant={variant ?? "default"}
        className={cn(
          buttonVariants({
            align,
            variant,
            size: resolvedSize,
            shape: resolvedShape,
            motion: resolvedMotion,
            className,
          }),
        )}
        ref={squircleRef}
        {...props}
      />
    );

    return squircleEnabled ? (
      <SquircleSurfaceProvider radius={radius}>{control}</SquircleSurfaceProvider>
    ) : (
      control
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
