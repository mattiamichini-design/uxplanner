import { cn } from "@/lib/utils";
import type { Persona } from "@/lib/user-journey/types";

type PersonaAvatarProps = {
  persona: Persona;
  active?: boolean;
  size?: "xs" | "sm" | "md";
  onClick?: () => void;
  className?: string;
};

export function PersonaAvatar({
  persona,
  active = true,
  size = "sm",
  onClick,
  className,
}: PersonaAvatarProps) {
  const sizeClasses = {
    xs: "size-6 text-[10px]",
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
  };

  const baseClasses = cn(
    "flex items-center justify-center rounded-md font-medium transition-colors",
    sizeClasses[size],
    active
      ? "bg-ux-on-primary/15 text-current"
      : "bg-ux-soft/40 text-ux-muted opacity-50",
    className,
  );

  // If an onClick handler is provided, render a real button for accessibility.
  // Otherwise render a non-interactive span to avoid nested <button type="button"> elements
  // when this component is used inside another button (which would cause
  // React/Next hydration errors).
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          baseClasses,
          "focus-visible:ring-ux-primary cursor-pointer hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2",
        )}
        aria-label={persona.name}
        title={persona.name}
      >
        {persona.initials}
      </button>
    );
  }

  return (
    <span
      className={cn(baseClasses, "inline-flex cursor-default")}
      aria-label={persona.name}
      title={persona.name}
    >
      {persona.initials}
    </span>
  );
}
