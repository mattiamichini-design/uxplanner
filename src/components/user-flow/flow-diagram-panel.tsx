"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Map as MapIcon, Maximize2, Minimize2, Minus, Plus } from "lucide-react";

import { MermaidDiagram } from "@/components/mermaid-diagram";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { UserFlow } from "@/lib/user-flow/types";
import {
  FLOW_MAX_ZOOM,
  FLOW_MIN_ZOOM,
  getMinimapViewport,
  getWheelZoom,
} from "@/lib/user-flow/canvas-viewport";

const MINIMAP_WIDTH = 160;
const MINIMAP_HEIGHT = 100;

interface FlowDiagramPanelProps {
  zoom: number;
  adjustZoom: (delta: number) => void;
  setZoom: (zoom: number) => void;
  currentFlow: UserFlow;
  fullscreenOpen: boolean;
  setFullscreenOpen: (open: boolean) => void;
  labels: {
    closeFullscreen: string;
    fullscreenDescription: string;
    fullscreenTitle: string;
    openFullscreen: string;
    resetZoom: string;
    resetZoomTitle: string;
    zoomIn: string;
    zoomOut: string;
  };
}

export function FlowDiagramPanel({
  zoom,
  adjustZoom,
  setZoom,
  currentFlow,
  fullscreenOpen,
  setFullscreenOpen,
  labels,
}: FlowDiagramPanelProps) {
  const diagram = (fullscreen = false) => (
    <FlowCanvasViewport
      fullscreen={fullscreen}
      chart={currentFlow.mermaidContent}
      zoom={zoom}
      setZoom={setZoom}
      toolbarProps={{ zoom, adjustZoom, setZoom, fullscreen, setFullscreenOpen, labels }}
    />
  );

  return (
    <>
      <section
        data-testid="flow-diagram-card"
        className="bg-ux-surface text-ux-text relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden"
      >
        {diagram()}
      </section>

      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent layout="fullscreen" hideClose className="z-(--z-ux-modal-nested) bg-ux-surface p-0">
          <DialogTitle className="sr-only">{labels.fullscreenTitle}</DialogTitle>
          <DialogDescription className="sr-only">{labels.fullscreenDescription}</DialogDescription>
          <div
            data-testid="flow-diagram-fullscreen"
            className="relative flex h-[100dvh] min-w-0 flex-col overflow-hidden"
          >
            {diagram(true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FlowCanvasViewport({
  chart,
  toolbarProps,
  fullscreen,
  setZoom,
  zoom,
}: {
  chart: string;
  toolbarProps: FlowDiagramToolbarProps;
  fullscreen: boolean;
  setZoom: (zoom: number) => void;
  zoom: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const minimapToggleRef = useRef<HTMLButtonElement>(null);
  const restoreMinimapToggleFocusRef = useRef(false);
  const minimapId = useId().replace(/:/g, "");
  const zoomRef = useRef(zoom);
  const renderedZoomRef = useRef(zoom);
  const centeredRef = useRef(false);
  const panRef = useRef<
    { pointerId: number; x: number; y: number; left: number; top: number } | undefined
  >(undefined);
  const anchorRef = useRef<
    { clientX: number; clientY: number; x: number; y: number } | undefined
  >(undefined);
  const [minimap, setMinimap] = useState({
    mapHeight: 0,
    mapLeft: 0,
    mapTop: 0,
    mapWidth: 0,
    viewportHeight: 0,
    viewportWidth: 0,
    viewportX: 0,
    viewportY: 0,
  });
  const [showMinimap, setShowMinimap] = useState(true);

  useEffect(() => {
    if (!restoreMinimapToggleFocusRef.current) return;
    restoreMinimapToggleFocusRef.current = false;
    minimapToggleRef.current?.focus();
  }, [showMinimap]);

  const toggleMinimap = () => {
    restoreMinimapToggleFocusRef.current = true;
    setShowMinimap((visible) => !visible);
  };

  const getSurfaceOffset = useCallback((surface: HTMLElement, viewport: HTMLElement) => {
    const surfaceBounds = surface.getBoundingClientRect();
    const viewportBounds = viewport.getBoundingClientRect();
    return {
      left: surfaceBounds.left - viewportBounds.left + viewport.scrollLeft - viewport.clientLeft,
      top: surfaceBounds.top - viewportBounds.top + viewport.scrollTop - viewport.clientTop,
    };
  }, []);

  const syncMinimap = useCallback(() => {
    const viewport = viewportRef.current;
    const surface = viewport?.querySelector<HTMLElement>("[data-testid=mermaid-scale-surface]");
    if (!viewport || !surface || !surface.offsetWidth || !surface.offsetHeight) return;
    const offset = getSurfaceOffset(surface, viewport);
    const visible = getMinimapViewport({
      viewportWidth: viewport.clientWidth,
      viewportHeight: viewport.clientHeight,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
      surfaceLeft: offset.left,
      surfaceTop: offset.top,
      surfaceWidth: surface.offsetWidth,
      surfaceHeight: surface.offsetHeight,
    });
    const scale = Math.min(MINIMAP_WIDTH / surface.offsetWidth, MINIMAP_HEIGHT / surface.offsetHeight);
    const mapWidth = surface.offsetWidth * scale;
    const mapHeight = surface.offsetHeight * scale;
    setMinimap({
      mapHeight,
      mapLeft: (MINIMAP_WIDTH - mapWidth) / 2,
      mapTop: (MINIMAP_HEIGHT - mapHeight) / 2,
      mapWidth,
      viewportHeight: visible.height * mapHeight,
      viewportWidth: visible.width * mapWidth,
      viewportX: visible.x * mapWidth,
      viewportY: visible.y * mapHeight,
    });
  }, [getSurfaceOffset]);

  const syncMinimapPreview = useCallback(() => {
    const svg = viewportRef.current?.querySelector<SVGSVGElement>("[data-testid=mermaid-scale-content] svg");
    const host = minimapRef.current;
    if (!svg || !host) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", "100%");
    clone.setAttribute("height", "100%");
    clone.setAttribute("preserveAspectRatio", "none");
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("focusable", "false");
    clone.setAttribute("role", "presentation");
    clone.removeAttribute("style");
    const ids = new Map<string, string>();
    [clone, ...Array.from(clone.querySelectorAll<SVGElement>("[id]"))].forEach((element) => {
      if (!element.id) return;
      const id = element.id;
      const nextId = `${minimapId}-${id}`;
      ids.set(id, nextId);
      element.id = nextId;
    });
    const orderedIds = Array.from(ids).sort(([left], [right]) => right.length - left.length);
    clone.querySelectorAll<SVGElement>("*").forEach((element) => {
      for (const attribute of Array.from(element.attributes)) {
        let value = attribute.value;
        orderedIds.forEach(([id, nextId]) => {
          value = value.replaceAll(`url(#${id})`, `url(#${nextId})`).replaceAll(`#${id}`, `#${nextId}`);
        });
        if (value !== attribute.value) element.setAttribute(attribute.name, value);
      }
    });
    clone.querySelectorAll("style").forEach((style) => {
      let css = style.textContent ?? "";
      orderedIds.forEach(([id, nextId]) => {
        css = css.replaceAll(`#${id}`, `#${nextId}`);
      });
      style.textContent = css;
    });
    const preview = document.createElement("img");
    preview.alt = "";
    preview.setAttribute("aria-hidden", "true");
    preview.decoding = "async";
    preview.style.display = "block";
    preview.style.width = "100%";
    preview.style.height = "100%";
    preview.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
    host.replaceChildren(preview);
  }, [minimapId]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useLayoutEffect(() => {
    renderedZoomRef.current = zoom;
    const viewport = viewportRef.current;
    const anchor = anchorRef.current;
    const surface = viewport?.querySelector<HTMLElement>("[data-testid=mermaid-scale-surface]");
    if (!viewport || !anchor || !surface) return;
    const bounds = surface.getBoundingClientRect();
    viewport.scrollLeft += bounds.left + anchor.x * zoom - anchor.clientX;
    viewport.scrollTop += bounds.top + anchor.y * zoom - anchor.clientY;
    anchorRef.current = undefined;
  }, [zoom]);

  useLayoutEffect(() => {
    syncMinimap();
  }, [syncMinimap, zoom]);

  useEffect(() => {
    centeredRef.current = false;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const center = () => {
      const surface = viewport.querySelector<HTMLElement>("[data-testid=mermaid-scale-surface]");
      if (!surface || centeredRef.current || surface.offsetWidth === 0) return;
      const nodes = Array.from(surface.querySelectorAll<SVGGraphicsElement>("g.node"));
      if (nodes.length === 0) return;
      centeredRef.current = true;
      const entryNode = nodes.find((node) =>
        /(?:\.N0?1\b|\bN0?1\b|entry)/i.test(node.textContent ?? ""),
      );

      if (entryNode) {
        const viewportBounds = viewport.getBoundingClientRect();
        const nodeBounds = entryNode.getBoundingClientRect();
        viewport.scrollLeft +=
          nodeBounds.left - viewportBounds.left + nodeBounds.width / 2 - viewport.clientWidth / 2;
        viewport.scrollTop +=
          nodeBounds.top - viewportBounds.top + nodeBounds.height / 2 - viewport.clientHeight / 3;
      } else {
        viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
        viewport.scrollTop = (viewport.scrollHeight - viewport.clientHeight) / 2;
      }
      syncMinimap();
    };
    const observer = new MutationObserver(center);
    observer.observe(viewport, { childList: true, subtree: true });
    center();
    return () => observer.disconnect();
  }, [chart, syncMinimap]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    let previewedSvg: SVGSVGElement | null = null;
    let observedSurface: HTMLElement | null = null;
    const update = () => {
      const surface = viewport.querySelector<HTMLElement>("[data-testid=mermaid-scale-surface]");
      if (surface && surface !== observedSurface) {
        observedSurface = surface;
        resizeObserver.observe(surface);
      }
      const svg = viewport.querySelector<SVGSVGElement>("[data-testid=mermaid-scale-content] svg");
      if (svg && svg !== previewedSvg) {
        previewedSvg = svg;
        syncMinimapPreview();
      }
      syncMinimap();
    };
    const mutationObserver = new MutationObserver(update);
    const resizeObserver = new ResizeObserver(update);
    mutationObserver.observe(viewport, { childList: true, subtree: true });
    resizeObserver.observe(viewport);
    update();
    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [chart, showMinimap, syncMinimap, syncMinimapPreview]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const handleWheel = (event: WheelEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      const surface = viewport.querySelector<HTMLElement>("[data-testid=mermaid-scale-surface]");
      if (!surface) return;
      const current = zoomRef.current;
      const next = getWheelZoom(current, event.deltaY, event.deltaMode);
      if (next === current) return;
      const bounds = surface.getBoundingClientRect();
      anchorRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        x: (event.clientX - bounds.left) / renderedZoomRef.current,
        y: (event.clientY - bounds.top) / renderedZoomRef.current,
      };
      zoomRef.current = next;
      setZoom(next);
    };
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [setZoom]);

  const startPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button, a, input, textarea, select, [data-flow-minimap]")) return;
    panRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: event.currentTarget.scrollLeft,
      top: event.currentTarget.scrollTop,
    };
    event.currentTarget.dataset.panning = "true";
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const pan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = panRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    event.currentTarget.scrollLeft = start.left - (event.clientX - start.x);
    event.currentTarget.scrollTop = start.top - (event.clientY - start.y);
  };

  const stopPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (panRef.current?.pointerId !== event.pointerId) return;
    panRef.current = undefined;
    delete event.currentTarget.dataset.panning;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const navigateMinimap = (x: number, y: number, smooth = true) => {
    const viewport = viewportRef.current;
    const surface = viewport?.querySelector<HTMLElement>("[data-testid=mermaid-scale-surface]");
    if (!viewport || !surface) return;
    const offset = getSurfaceOffset(surface, viewport);
    viewport.scrollTo({
      left: offset.left + x * surface.offsetWidth - viewport.clientWidth / 2,
      top: offset.top + y * surface.offsetHeight - viewport.clientHeight / 2,
      behavior: !smooth || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  return (
    <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
      <div
        ref={viewportRef}
        data-testid={fullscreen ? "flow-diagram-fullscreen-viewport" : "flow-diagram-viewport"}
        className="h-full min-h-0 min-w-0 cursor-grab overflow-auto p-6 pb-24 md:pb-6 md:pt-16 select-none data-[panning=true]:cursor-grabbing"
        onPointerDown={startPan}
        onPointerMove={pan}
        onPointerUp={stopPan}
        onPointerCancel={stopPan}
        onLostPointerCapture={stopPan}
        onScroll={syncMinimap}
      >
        <MermaidDiagram chart={chart} zoom={zoom} />
      </div>
      {showMinimap ? (
        <>
          <div
            data-flow-minimap
            role="button"
            tabIndex={0}
            aria-label="Flow map overview. Press Enter to center the diagram."
            className="border-ux-border bg-ux-surface/95 focus-visible:ring-ux-primary absolute left-1/2 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] -translate-x-1/2 z-(--z-ux-lifted) h-[116px] w-44 cursor-crosshair rounded-xl border p-2 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 md:left-auto md:translate-x-0 md:end-4 md:bottom-4"
            onPointerDown={(event) => {
              event.stopPropagation();
              if (!minimap.mapWidth || !minimap.mapHeight) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              const x = Math.max(
                0,
                Math.min(1, (event.clientX - bounds.left - 8 - minimap.mapLeft) / minimap.mapWidth),
              );
              const y = Math.max(
                0,
                Math.min(1, (event.clientY - bounds.top - 8 - minimap.mapTop) / minimap.mapHeight),
              );
              navigateMinimap(x, y);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              navigateMinimap(0.5, 0.5, false);
            }}
          >
            <div className="relative h-[100px] w-40 overflow-hidden" aria-hidden="true" inert>
              <div
                ref={minimapRef}
                className="absolute text-[3px]"
                style={{
                  left: minimap.mapLeft,
                  top: minimap.mapTop,
                  width: minimap.mapWidth,
                  height: minimap.mapHeight,
                }}
              />
              <div
                className="border-ux-success bg-ux-success-soft/50 absolute border-2"
                style={{
                  left: minimap.mapLeft + minimap.viewportX,
                  top: minimap.mapTop + minimap.viewportY,
                  width: Math.max(4, minimap.viewportWidth),
                  height: Math.max(4, minimap.viewportHeight),
                }}
              />
            </div>
          </div>
        </>
      ) : null}
      <FlowDiagramToolbar {...toolbarProps} minimapAction={<button type="button" ref={minimapToggleRef} onClick={toggleMinimap} aria-label={showMinimap ? "Hide minimap" : "Show minimap"} aria-expanded={showMinimap} className="border-ux-border flex size-11 shrink-0 items-center justify-center border-l md:hidden"><MapIcon className="size-4" /></button>} />
    </div>
  );
}

interface FlowDiagramToolbarProps {
  zoom: number;
  adjustZoom: (delta: number) => void;
  setZoom: (zoom: number) => void;
  fullscreen: boolean;
  setFullscreenOpen: (open: boolean) => void;
  labels: FlowDiagramPanelProps["labels"];
  minimapAction?: React.ReactNode;
}

export function FlowDiagramToolbar({
  zoom,
  adjustZoom,
  setZoom,
  fullscreen,
  setFullscreenOpen,
  labels,
  minimapAction,
}: FlowDiagramToolbarProps) {
  return (
    <div
      data-testid={fullscreen ? "flow-diagram-fullscreen-toolbar" : "flow-diagram-toolbar"}
      className={cn(
        "z-(--z-ux-lifted) flex justify-end",
        fullscreen
          ? "absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-(--z-ux-flow-top) md:bottom-auto md:left-auto md:top-4 md:end-4 md:translate-x-0"
          : "absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:top-4 md:end-4 md:translate-x-0",
      )}
    >
      <div className="border-ux-border bg-ux-surface flex items-center gap-1 rounded-ux-control border p-1 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => adjustZoom(-0.1)}
          disabled={zoom <= FLOW_MIN_ZOOM}
          className="size-11 rounded-full md:size-8"
          aria-label={labels.zoomOut}
        >
          <Minus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setZoom(1)}
          disabled={zoom === 1}
          className="h-11 min-w-12 rounded-full px-2 text-xs tabular-nums md:h-8"
          aria-label={labels.resetZoom}
          title={labels.resetZoomTitle}
        >
          {Math.round(zoom * 100)}%
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => adjustZoom(0.1)}
          disabled={zoom >= FLOW_MAX_ZOOM}
          className="size-11 rounded-full md:size-8"
          aria-label={labels.zoomIn}
        >
          <Plus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setFullscreenOpen(!fullscreen)}
          className="size-11 rounded-full md:size-8"
          aria-label={fullscreen ? labels.closeFullscreen : labels.openFullscreen}
        >
          {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </Button>
        {minimapAction}
      </div>
    </div>
  );
}
