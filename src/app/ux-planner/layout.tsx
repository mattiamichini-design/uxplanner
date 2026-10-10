import "./theme.css";
import { Suspense } from "react";
import { AiContextPanel } from "@/components/ux-planner/ai-context-panel";
import { LayoutProvider } from "@/context/layout-context";
import { StudioFrame, StudioPrimaryRail } from "@/components/ux-planner/studio-shell";

export const metadata = {
  title: "UX Planner",
  description: "UX Planner Tool",
};

export const dynamic = "force-dynamic";

export default function UxPlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <div className="dev-theme bg-ux-canvas text-ux-text flex min-h-screen flex-col antialiased md:flex-row">
        <StudioPrimaryRail />
        <div className="min-w-0 flex-1"><StudioFrame>{children}</StudioFrame></div>
        <Suspense fallback={null}><AiContextPanel /></Suspense>
      </div>
    </LayoutProvider>
  );
}
