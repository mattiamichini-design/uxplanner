"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useSquircleFallbackRef } from "@/components/ui/squircle";

const textareaVariants = cva(
  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-ux-field-min w-full border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      shape: {
        default: "shape-squircle",
        control: "shape-squircle",
        document: "shape-squircle",
        none: "rounded-none",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      shape: "default",
    },
  },
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, shape, ...props }, ref) => {
    const resolvedShape = shape ?? "default";
    const squircleRadius = 16;
    const squircleRef = useSquircleFallbackRef<HTMLTextAreaElement>({
      enabled: !["none", "pill"].includes(resolvedShape),
      forwardedRef: ref,
      radius: squircleRadius,
    });

    return (
      <textarea
        data-shape={resolvedShape}
        data-squircle-radius={["none", "pill"].includes(resolvedShape) ? undefined : squircleRadius}
        className={cn(textareaVariants({ shape }), className)}
        ref={squircleRef}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
