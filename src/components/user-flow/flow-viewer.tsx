"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { useTranslations } from "@/i18n/use-translations";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedHorizontalTabs } from "@/components/ui/animated-horizontal-tabs";
import { PersonaAvatar } from "@/components/user-journey/persona-avatar";
import { MarkdownDisplay } from "@/components/ui/markdown-display";
import { FlowDiagramPanel } from "@/components/user-flow/flow-diagram-panel";
import type { ComponentType } from "react";
import type { UserFlow, FlowType } from "@/lib/user-flow/types";
import type { Persona } from "@/lib/user-journey/types";
import { getResponsiveControlLayout } from "@/lib/ux-planner/responsive-control-layout";
import { FLOW_MAX_ZOOM, FLOW_MIN_ZOOM } from "@/lib/user-flow/canvas-viewport";
import { StudioSidebarToggle } from "@/components/ux-planner/studio-shell";
import { personaInitials } from "@/lib/personas/initials";

interface FlowViewerProps {
  slug: string; // current flow type slug
  flowType: FlowType;
  allFlows: UserFlow[];
  currentFlow: UserFlow | undefined;
  allPersonas: Persona[];
}

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ux-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ux-surface";

export function FlowViewer({
  slug,
  flowType,
  allFlows,
  currentFlow,
  allPersonas,
}: FlowViewerProps) {
  const t = useTranslations("uxPlannerShell.userFlows");
  const [zoom, setZoom] = useState(1);
  const [activeView, setActiveView] = useState("description");
  const [diagramFullscreenOpen, setDiagramFullscreenOpen] = useState(false);
  const router = useRouter();
  const flowSelectorLayout = getResponsiveControlLayout({
    itemCount: allFlows.length,
    desktopAlignment: "center",
  });

  const IconComponent = (LucideIcons as unknown as Record<string, ComponentType<{ className?: string }>>)[flowType.icon || "Map"] ?? LucideIcons.Map;

  const adjustZoom = (delta: number) => {
    setZoom((prev) => Math.max(FLOW_MIN_ZOOM, Math.min(FLOW_MAX_ZOOM, prev + delta)));
  };
  const diagramLabels = {
    closeFullscreen: t("closeDiagramFullscreen"),
    fullscreenDescription: t("diagramFullscreenDescription"),
    fullscreenTitle: t("diagramFullscreenTitle"),
    openFullscreen: t("openDiagramFullscreen"),
    resetZoom: t("resetZoom"),
    resetZoomTitle: t("resetZoomTitle"),
    zoomIn: t("zoomIn"),
    zoomOut: t("zoomOut"),
  };

  return (
    <Tabs value={activeView} onValueChange={setActiveView} className="flex h-full min-h-0 flex-col">
      <header className="border-ux-border bg-ux-surface shrink-0 sticky top-0 z-(--z-ux-board) border-b">
        <div
          data-testid="flow-control-row"
          className="bg-ux-surface grid min-h-ux-header grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:px-6"
        >
          <div
            data-testid="flow-mobile-top-row"
            className="hidden min-w-0 md:contents"
          >
            <div
              data-testid="flow-title-block"
              className="group flex min-w-0 items-center gap-2 md:col-start-1 md:row-start-1 md:w-full md:justify-self-start"
            >
              <StudioSidebarToggle className="max-w-52" />
              {(
                <div className="bg-ux-soft text-ux-primary hidden size-8 shrink-0 items-center justify-center rounded-lg ux-wide:flex">
                  <IconComponent className="size-4" />
                </div>
              )}
              <div className="hidden min-w-0 ux-wide:block">
                <h2 className="truncate text-base font-semibold">{flowType.title}</h2>
                {flowType.description ? (
                  <p className="text-ux-muted truncate text-xs">{flowType.description}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div
            data-testid="flow-persona-selector"
            className={cn(
              "col-start-1 row-start-1 min-w-0 md:col-start-2 md:justify-self-center",
              flowSelectorLayout.outerClassName,
            )}
          >
            <label className={cn("block min-w-0", allFlows.length <= 2 && "md:hidden")}>
                <span className="sr-only">Select persona flow</span>
                <Select value={currentFlow?.slug} onValueChange={(value) => router.push(`/ux-planner/user-flows/${slug}?persona=${value}`)}><SelectTrigger aria-label="Select persona flow" size="sm" className="bg-ux-surface w-full min-w-0 max-w-52 shadow-none"><SelectValue /></SelectTrigger><SelectContent position="popper">{allFlows.map((flow) => <SelectItem key={flow.slug} value={flow.slug}>{allPersonas.find((persona) => persona.slug === flow.slug)?.name ?? flow.title}</SelectItem>)}</SelectContent></Select>
            </label>
            {allFlows.length <= 2 ? (
              <div className="hidden md:block">
                <AnimatedHorizontalTabs
                  data-testid="flow-persona-selector-list"
                  persistenceKey={`flow-personas-${slug}`}
                  className={flowSelectorLayout.listClassName}
                >
                  {allFlows.map((flow) => {
                    const personaInfo = allPersonas.find((p) => p.slug === flow.slug) || {
                      id: flow.slug,
                      slug: flow.slug,
                      name: flow.title,
                      initials: personaInitials(flow.title),
                      color: "bg-ux-soft",
                    };

                    const isActive = currentFlow?.slug === flow.slug;

                    return (
                      <Link
                        key={flow.slug}
                        href={`/ux-planner/user-flows/${slug}?persona=${flow.slug}`}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex h-11 min-w-0 items-center md:h-8 gap-2 rounded-ux-button border px-3 text-ux-label transition-colors",
                          focusRing,
                          flowSelectorLayout.itemClassName,
                          isActive
                            ? "border-ux-primary bg-ux-primary text-ux-on-primary font-medium"
                            : "border-ux-border hover:border-ux-muted/50",
                        )}
                      >
                        <PersonaAvatar persona={personaInfo} active={isActive} size="xs" />
                        <span className="truncate whitespace-nowrap">{personaInfo.name}</span>
                      </Link>
                    );
                  })}
                </AnimatedHorizontalTabs>
              </div>
            ) : null}
          </div>

          {currentFlow ? (
            <div
              data-testid="flow-view-switch"
              className="col-start-2 row-start-1 min-w-0 justify-self-end md:col-start-3"
            >
              <TabsList asChild>
                <AnimatedHorizontalTabs className="border-ux-border bg-ux-surface h-11 justify-start rounded-lg border p-1 md:h-8 md:min-h-8">
                  <TabsTrigger
                    value="description"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-ux-on-primary text-ux-muted mr-0.5 h-9 shrink-0 rounded-md md:h-6 md:min-h-6 px-2 text-xs font-medium transition-colors data-[state=active]:shadow-none md:mr-1 md:px-3 md:text-sm"
                  >
                    {t("description")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="flowMap"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-ux-on-primary text-ux-muted h-9 shrink-0 rounded-md md:h-6 md:min-h-6 px-2 text-xs font-medium transition-colors data-[state=active]:shadow-none md:px-3 md:text-sm"
                  >
                    {t("flowMap")}
                  </TabsTrigger>
                </AnimatedHorizontalTabs>
              </TabsList>
            </div>
          ) : (
            <div
              data-testid="flow-header-spacer"
              className="hidden min-w-0 md:col-start-3 md:row-start-1 md:block"
            />
          )}
        </div>
      </header>

      <main className="flex min-h-0 w-full min-w-0 flex-1 overflow-hidden p-3 md:p-6">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {currentFlow ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <TabsContent value="description" className="min-h-0 flex-1">
                <section
                  data-testid="flow-description-panel"
                  className="mx-auto grid h-full max-h-full w-full max-w-ux-reading grid-cols-[minmax(0,1fr)] gap-5 overflow-y-auto py-2"
                >
                  <MarkdownDisplay
                    content={currentFlow.narrative}
                    className="text-ux-text/90 text-base leading-8 md:text-lg"
                  />
                </section>
              </TabsContent>

              <TabsContent value="flowMap" className="min-h-0 min-w-0 flex-1">
                <FlowDiagramPanel
                  zoom={zoom}
                  adjustZoom={adjustZoom}
                  setZoom={setZoom}
                  currentFlow={currentFlow}
                  fullscreenOpen={diagramFullscreenOpen}
                  setFullscreenOpen={setDiagramFullscreenOpen}
                  labels={diagramLabels}
                />
              </TabsContent>
            </div>
          ) : (
            <div className="text-ux-muted py-12 text-center">
              {t("selectVariant")}
            </div>
          )}
        </div>
      </main>
    </Tabs>
  );
}
