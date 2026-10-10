export interface UserFlowStep {
  id: string;
  label: string;
  type: "action" | "decision" | "system";
  next?: string[];
}

export interface UserFlow {
  slug: string; // e.g., "persona-1"
  title: string;
  flowTypeSlug: string; // e.g., "onboarding"
  mermaidContent: string;
  narrative: string; // Markdown content
}

export interface FlowType {
  slug: string;
  title: string;
  description: string;
  icon?: string;
}
