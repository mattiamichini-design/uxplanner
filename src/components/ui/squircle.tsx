"use client";

import * as React from "react";
import { generateClipPath, observeResize } from "@lisse/core";
import { useComposedRefs } from "@radix-ui/react-compose-refs";

import { cn } from "@/lib/utils";

const IOS_CORNER_SMOOTHING = 0.6;
const MIN_SQUIRCLE_RADIUS = 16;

const SQUIRCLE_RADIUS = {
  xs: MIN_SQUIRCLE_RADIUS,
  compact: MIN_SQUIRCLE_RADIUS,
  control: 16,
  state: 16,
  collection: 24,
  overlay: 24,
} as const;

const SQUIRCLE_INSET = {
  xs: { className: "p-1", value: 4 },
  sm: { className: "p-2", value: 8 },
  md: { className: "p-3", value: 12 },
  lg: { className: "p-4", value: 16 },
} as const;

type SquircleRadiusRole = keyof typeof SQUIRCLE_RADIUS;
type SquircleInsetRole = keyof typeof SQUIRCLE_INSET;
type SquircleMode = "fixed" | "auto" | "concentric";

interface SquircleGeometry {
  radius: number;
}

const SquircleSurfaceContext = React.createContext<SquircleGeometry | null>(null);
const SquircleConcentricContext = React.createContext<SquircleGeometry | null>(null);

function resolveRadius(radius: SquircleRadiusRole | number) {
  const resolvedRadius = typeof radius === "number" ? radius : SQUIRCLE_RADIUS[radius];
  return Math.max(MIN_SQUIRCLE_RADIUS, resolvedRadius);
}

function useSquircleRadius({
  mode = "fixed",
  radius,
}: {
  mode?: SquircleMode;
  radius: SquircleRadiusRole | number;
}) {
  const concentricGeometry = React.useContext(SquircleConcentricContext);
  return mode !== "fixed" && concentricGeometry
    ? Math.max(MIN_SQUIRCLE_RADIUS, concentricGeometry.radius)
    : resolveRadius(radius);
}

function useSquircleFallbackRef<TElement extends HTMLElement>({
  enabled = true,
  fallbackMediaQuery,
  forwardedRef,
  radius,
}: {
  enabled?: boolean;
  fallbackMediaQuery?: string;
  forwardedRef?: React.ForwardedRef<TElement>;
  radius: number;
}) {
  const resolvedRadius = Math.max(MIN_SQUIRCLE_RADIUS, radius);
  const internalRef = React.useRef<TElement>(null);
  const composedRef = useComposedRefs(forwardedRef, internalRef);

  React.useLayoutEffect(() => {
    if (!enabled) return;

    const element = internalRef.current;
    const supportsNativeSquircle =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("corner-shape", "squircle");

    if (!element || supportsNativeSquircle) {
      return;
    }

    const mediaQuery =
      fallbackMediaQuery && typeof window.matchMedia === "function"
        ? window.matchMedia(fallbackMediaQuery)
        : null;

    const syncClipPath = () => {
      if (mediaQuery && !mediaQuery.matches) {
        element.style.removeProperty("clip-path");
        return;
      }

      // Transform animations must not change the fallback corner geometry.
      const height = element.offsetHeight;
      const width = element.offsetWidth;

      if (height <= 0 || width <= 0) return;

      element.style.clipPath = generateClipPath(width, height, {
        radius: resolvedRadius,
        smoothing: IOS_CORNER_SMOOTHING,
        preserveSmoothing: true,
      });
    };

    syncClipPath();
    const unobserve = observeResize(element, syncClipPath);
    mediaQuery?.addEventListener?.("change", syncClipPath);

    return () => {
      unobserve();
      mediaQuery?.removeEventListener?.("change", syncClipPath);
      element.style.removeProperty("clip-path");
    };
  }, [enabled, fallbackMediaQuery, resolvedRadius]);

  return composedRef;
}

function SquircleSurfaceProvider({
  children,
  radius,
}: React.PropsWithChildren<{ radius: number }>) {
  const resolvedRadius = Math.max(MIN_SQUIRCLE_RADIUS, radius);
  const geometry = React.useMemo(() => ({ radius: resolvedRadius }), [resolvedRadius]);

  return (
    <SquircleSurfaceContext.Provider value={geometry}>{children}</SquircleSurfaceContext.Provider>
  );
}

/*
 * The radius is intentionally resolved separately from the fallback ref.
 * React Compiler treats ref-carrying hook results as opaque during render;
 * keeping geometry as plain data preserves compiler compatibility.
 */
function resolveConcentricRadiusForTest(
  radius: SquircleRadiusRole | number,
  inset: SquircleInsetRole,
) {
  return Math.max(MIN_SQUIRCLE_RADIUS, resolveRadius(radius) - SQUIRCLE_INSET[inset].value);
}

interface SquircleInsetProps extends React.ComponentProps<"div"> {
  inset?: SquircleInsetRole;
}

function SquircleInset({ children, className, inset = "md", ...props }: SquircleInsetProps) {
  const surfaceGeometry = React.useContext(SquircleSurfaceContext);
  const insetDefinition = SQUIRCLE_INSET[inset];
  const geometry = React.useMemo(
    () =>
      surfaceGeometry
        ? {
            radius: Math.max(MIN_SQUIRCLE_RADIUS, surfaceGeometry.radius - insetDefinition.value),
          }
        : null,
    [insetDefinition.value, surfaceGeometry],
  );

  return (
    <SquircleConcentricContext.Provider value={geometry}>
      <div
        data-slot="squircle-inset"
        data-squircle-inset={inset}
        className={cn(insetDefinition.className, className)}
        {...props}
      >
        {children}
      </div>
    </SquircleConcentricContext.Provider>
  );
}

export {
  IOS_CORNER_SMOOTHING,
  MIN_SQUIRCLE_RADIUS,
  SQUIRCLE_RADIUS,
  SquircleInset,
  SquircleSurfaceProvider,
  resolveConcentricRadiusForTest,
  useSquircleFallbackRef,
  useSquircleRadius,
};
export type { SquircleInsetProps, SquircleMode, SquircleRadiusRole };
