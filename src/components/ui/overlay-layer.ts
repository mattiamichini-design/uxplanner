"use client";

import { createContext, createElement, useContext, type ReactNode } from "react";

export type OverlayLayer = "default" | "nested";

/**
 * Visual stacking only. A nested layer does not register dismissal ownership with
 * its parent; controlled parents that map dismissal to navigation still need an
 * explicit child-open guard.
 */
export const OVERLAY_LAYER_CLASS_NAME: Record<OverlayLayer, string> = {
  // Direct detail routes sit below the modal layer and intercepted mobile routes use a
  // fullscreen dialog on --z-ux-modal. A portaled child overlay must clear both while
  // remaining below explicitly nested confirmation UI on --z-ux-modal-nested.
  default: "z-(--z-ux-modal-child)",
  nested: "z-(--z-ux-modal-nested)",
};

const OverlayLayerContext = createContext<OverlayLayer>("default");

export function NestedOverlayLayerProvider({ children }: { children: ReactNode }) {
  return createElement(OverlayLayerContext.Provider, { value: "nested" }, children);
}

export function useOverlayLayer(layer?: OverlayLayer) {
  const inheritedLayer = useContext(OverlayLayerContext);
  return layer ?? inheritedLayer;
}
