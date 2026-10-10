"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";

interface SelectToggleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectToggleContext = React.createContext<SelectToggleContextValue | null>(null);

function SelectToggleRoot({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (open === nextOpen) return;
      if (!isControlled) setUncontrolledOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange, open],
  );

  const toggleContext = React.useMemo(() => ({ open, setOpen }), [open, setOpen]);

  return (
    <SelectToggleContext.Provider value={toggleContext}>
      <SelectPrimitive.Root {...props} open={open} onOpenChange={setOpen} />
    </SelectToggleContext.Provider>
  );
}

function useSelectToggle() {
  return React.useContext(SelectToggleContext);
}

export { SelectToggleRoot, useSelectToggle };
