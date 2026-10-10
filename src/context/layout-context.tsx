"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import {
  createUxPlannerShellState,
  deriveUxPlannerShellLayout,
  reduceUxPlannerShellState,
} from "ux-planner-core/shell";

type LayoutContextType = {
  isMainNavVisible: boolean;
  setMainNavOpen: (value: boolean) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [shellState, dispatch] = useReducer(reduceUxPlannerShellState, undefined, () =>
    createUxPlannerShellState(),
  );

  const shellLayout = useMemo(() => deriveUxPlannerShellLayout(shellState), [shellState]);

  const value = useMemo<LayoutContextType>(
    () => ({
      isMainNavVisible: shellLayout.mainNavVisible,
      setMainNavOpen: (nextMainNavOpen) => {
        dispatch({
          type: "main-nav:set-open",
          open: nextMainNavOpen,
        });
      },
    }),
    [shellLayout.mainNavVisible],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
