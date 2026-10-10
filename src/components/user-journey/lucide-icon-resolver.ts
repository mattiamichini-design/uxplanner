import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

const lucideIconRegistry = LucideIcons as unknown as Record<string, LucideIcon | undefined>;

export function resolveLucideIcon(iconName: string): LucideIcon | undefined {
  return lucideIconRegistry[iconName];
}
