"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  SquircleSurfaceProvider,
  useSquircleFallbackRef,
  useSquircleRadius,
} from "@/components/ui/squircle";

const cardVariantStyles = cva("border text-card-foreground shadow-none", {
  variants: {
    variant: {
      collection: "border-border/50 bg-card",
      action: "border-border/50 bg-muted/20",
      state: "border-border/50 bg-muted/20",
      flat: "border-transparent bg-transparent",
    },
    shape: {
      collection: "shape-squircle",
      capsule: "shape-capsule",
      flat: "rounded-none",
    },
  },
  defaultVariants: {
    variant: "collection",
  },
});

type CardVariantProps = VariantProps<typeof cardVariantStyles>;
type CardVariant = NonNullable<CardVariantProps["variant"]>;
export type CardShape = NonNullable<CardVariantProps["shape"]>;

const CARD_SHAPE_BY_VARIANT = {
  action: "collection",
  collection: "collection",
  flat: "flat",
  state: "collection",
} as const satisfies Record<CardVariant, CardShape>;

export function resolveCardShape(
  variant: CardVariant | null | undefined,
  shape?: CardShape | null,
): CardShape {
  return shape ?? CARD_SHAPE_BY_VARIANT[variant ?? "collection"];
}

type CardVariantOptions = CardVariantProps & {
  className?: string;
};

function cardVariants(options: CardVariantOptions = {}) {
  const variant = options.variant ?? "collection";
  const { className, ...variantOptions } = options;

  return cn(
    cardVariantStyles({
      ...variantOptions,
      variant,
      shape: resolveCardShape(variant, options.shape),
    }),
    className,
  );
}

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CardVariantProps
>(({ className, variant, shape, ...props }, ref) => {
  const resolvedShape = resolveCardShape(variant, shape);
  const squircleRadius = useSquircleRadius({
    mode: "auto",
    radius: "collection",
  });
  const squircleRef = useSquircleFallbackRef<HTMLDivElement>({
    enabled: resolvedShape !== "flat" && resolvedShape !== "capsule",
    forwardedRef: ref,
    radius: squircleRadius,
  });

  const card = (
    <div
      ref={squircleRef}
      data-slot="card"
      data-variant={variant ?? "collection"}
      data-shape={resolvedShape}
      data-squircle-radius={
        resolvedShape === "flat" || resolvedShape === "capsule" ? undefined : squircleRadius
      }
      className={cn(cardVariants({ variant, shape }), className)}
      {...props}
    />
  );

  return resolvedShape === "flat" || resolvedShape === "capsule" ? (
    card
  ) : (
    <SquircleSurfaceProvider radius={squircleRadius}>{card}</SquircleSurfaceProvider>
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("grid gap-1.5 p-6 sm:p-7", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight sm:text-lg", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-muted-foreground text-sm", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0 sm:p-7 sm:pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn(
        "flex flex-col gap-3 p-6 pt-0 sm:flex-row sm:items-center sm:justify-between sm:p-7 sm:pt-0",
        className,
      )}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
