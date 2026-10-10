"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useSquircleFallbackRef } from "@/components/ui/squircle";

const inputVariants = cva(
  "border-input file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex w-full border bg-transparent py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      inputSize: {
        default: "h-11 px-3 md:h-9",
        content: "h-auto",
      },
      inputShape: {
        default: "shape-squircle",
        control: "shape-squircle",
        document: "shape-squircle",
        none: "rounded-none",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      inputSize: "default",
      inputShape: "default",
    },
  },
);

type InputProps = React.ComponentProps<"input"> & VariantProps<typeof inputVariants>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputShape, inputSize, ...props }, ref) => {
    const resolvedShape = inputShape ?? "default";
    const squircleRadius = 16;
    const squircleRef = useSquircleFallbackRef<HTMLInputElement>({
      enabled: !["none", "pill"].includes(resolvedShape),
      forwardedRef: ref,
      radius: squircleRadius,
    });

    return (
      <input
        type={type}
        data-size={inputSize ?? "default"}
        data-shape={resolvedShape}
        data-squircle-radius={["none", "pill"].includes(resolvedShape) ? undefined : squircleRadius}
        className={cn(inputVariants({ inputShape, inputSize }), className)}
        ref={squircleRef}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
