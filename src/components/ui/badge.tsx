"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useSquircleFallbackRef } from "@/components/ui/squircle";

const badgeVariants = cva(
  "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-success-primary/30 bg-success-primary/10 text-success-primary shadow-none",
        warning: "border-warning-primary/30 bg-warning-primary/10 text-warning-primary shadow-none",
        error: "border-error-primary/30 bg-error-primary/10 text-error-primary shadow-none",
      },
      shape: {
        control: "shape-squircle",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "control",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, shape, variant, ...props }: BadgeProps) {
  const resolvedShape = shape ?? "control";
  const squircleRadius = 16;
  const squircleRef = useSquircleFallbackRef<HTMLDivElement>({
    enabled: resolvedShape === "control",
    radius: squircleRadius,
  });

  return (
    <div
      ref={squircleRef}
      data-shape={resolvedShape}
      data-squircle-radius={resolvedShape === "control" ? squircleRadius : undefined}
      className={cn(badgeVariants({ shape, variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
