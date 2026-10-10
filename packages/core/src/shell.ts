export type UxPlannerShellState = {
  compactHeaderActive: boolean;
  mainNavOpen: boolean;
};

export type UxPlannerShellLayout = {
  compactHeaderActive: boolean;
  mainNavVisible: boolean;
};

export type UxPlannerShellAction =
  | {
      type: "compact-header:set";
      active: boolean;
    }
  | {
      type: "main-nav:set-open";
      open: boolean;
    }
  | {
      type: "shell:patch";
      state: Partial<UxPlannerShellState>;
    };

const DEFAULT_SHELL_STATE: UxPlannerShellState = {
  compactHeaderActive: false,
  mainNavOpen: true,
};

export function createUxPlannerShellState(
  overrides: Partial<UxPlannerShellState> = {},
): UxPlannerShellState {
  return {
    ...DEFAULT_SHELL_STATE,
    ...overrides,
  };
}

export function reduceUxPlannerShellState(
  state: UxPlannerShellState,
  action: UxPlannerShellAction,
): UxPlannerShellState {
  switch (action.type) {
    case "compact-header:set":
      return {
        ...state,
        compactHeaderActive: action.active,
      };
    case "main-nav:set-open":
      return {
        ...state,
        mainNavOpen: action.open,
      };
    case "shell:patch":
      return {
        ...state,
        ...action.state,
      };
    default: {
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
    }
  }
}

export function deriveUxPlannerShellLayout(
  state: UxPlannerShellState,
): UxPlannerShellLayout {
  return {
    compactHeaderActive: state.compactHeaderActive,
    mainNavVisible: state.mainNavOpen && !state.compactHeaderActive,
  };
}

export function isUxPlannerMainNavVisible(state: UxPlannerShellState): boolean {
  return deriveUxPlannerShellLayout(state).mainNavVisible;
}
