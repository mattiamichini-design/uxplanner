"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";
import { useSquircleFallbackRef } from "@/components/ui/squircle";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const squircleRadius = 16;
  const squircleRef = useSquircleFallbackRef<React.ElementRef<typeof TabsPrimitive.List>>({
    forwardedRef: ref,
    radius: squircleRadius,
  });

  return (
    <TabsPrimitive.List
      ref={squircleRef}
      data-squircle-radius={squircleRadius}
      className={cn(
        "bg-background text-muted-foreground shape-squircle min-h-11 md:min-h-9 inline-flex items-center justify-center p-1",
        className,
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const squircleRadius = 16;
  const squircleRef = useSquircleFallbackRef<React.ElementRef<typeof TabsPrimitive.Trigger>>({
    forwardedRef: ref,
    radius: squircleRadius,
  });

  return (
    <TabsPrimitive.Trigger
      ref={squircleRef}
      data-squircle-radius={squircleRadius}
      className={cn(
        "ring-offset-background focus-visible:ring-ring data-[state=active]:bg-card data-[state=active]:text-foreground shape-squircle min-h-9 inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium transition-[color,background-color,box-shadow] duration-(--ux-duration-fast) ease-[var(--ux-ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow",
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-ring mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
