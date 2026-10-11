"use client";

import { useEffect, useMemo, useState } from "react";
import mermaid from "mermaid";

// Mermaid sizes each node by measuring its label in a probe attached to <body>, outside the Studio theme, then
// draws the label inside it. The --ux-font-sans role lives on :root, so both places resolve the same family and
// the measured and the drawn text stay the same width.
const diagramFont = '"Geist", ui-sans-serif, system-ui, sans-serif'; // fallback when tokens are unavailable

// Mermaid needs resolved colour strings, so the diagram theme is read from the Studio tokens when each chart renders.
const diagramTokens = {
  primaryColor: "--ux-sidebar",
  primaryTextColor: "--ux-diagram-text",
  primaryBorderColor: "--ux-diagram-border",
  lineColor: "--ux-diagram-line",
  secondaryColor: "--ux-soft",
  tertiaryColor: "--ux-surface",
} as const;

function readDiagramTheme() {
  const source = getComputedStyle(document.documentElement);
  const fontFamily = source.getPropertyValue("--ux-font-sans").trim() || diagramFont;
  const themeVariables: Record<string, string> = { fontFamily };
  for (const [name, token] of Object.entries(diagramTokens)) {
    const value = source.getPropertyValue(token).trim();
    if (value) themeVariables[name] = value;
  }
  return themeVariables;
}

interface MermaidDiagramProps {
  chart: string;
  zoom?: number;
}

function parseSvgLength(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed) || value.includes("%")) {
    return null;
  }

  return parsed;
}

interface SvgRenderData {
  height: number | null;
  markup: string;
  width: number | null;
}

function prepareSvgMarkup(svgMarkup: string): SvgRenderData {
  const parsed = new DOMParser().parseFromString(svgMarkup, "image/svg+xml");
  const svgElement = parsed.querySelector("svg");

  if (!svgElement) {
    return { height: null, markup: svgMarkup, width: null };
  }

  const viewBox = svgElement
    .getAttribute("viewBox")
    ?.split(/\s+/)
    .map((value) => Number.parseFloat(value));

  const width = parseSvgLength(svgElement.getAttribute("width")) ?? viewBox?.[2] ?? null;
  const height = parseSvgLength(svgElement.getAttribute("height")) ?? viewBox?.[3] ?? null;

  if (width) {
    svgElement.setAttribute("width", `${Math.round(width)}`);
  }

  if (height) {
    svgElement.setAttribute("height", `${Math.round(height)}`);
  }

  const sanitizedStyle = (svgElement.getAttribute("style") ?? "")
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(
      (chunk) =>
        chunk.length > 0 &&
        !chunk.startsWith("max-width") &&
        !chunk.startsWith("width") &&
        !chunk.startsWith("height"),
    );

  sanitizedStyle.push("display: block", "max-width: none");
  svgElement.setAttribute("style", sanitizedStyle.join("; "));

  return {
    height,
    markup: new XMLSerializer().serializeToString(svgElement),
    width,
  };
}

export function MermaidDiagram({ chart, zoom = 1 }: MermaidDiagramProps) {
  const [rawSvg, setRawSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const svg = useMemo(() => prepareSvgMarkup(rawSvg), [rawSvg]);
  const scaledWidth = svg.width ? Math.round(svg.width * zoom) : undefined;
  const scaledHeight = svg.height ? Math.round(svg.height * zoom) : undefined;

  useEffect(() => {
    if (!chart) return;

    let isMounted = true;

    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        // Measuring before the webfont arrives would size the nodes for the fallback font.
        if (document.fonts) await document.fonts.load(`16px ${diagramFont}`).catch(() => undefined);
        // Pin the dagre layout and classic look: Mermaid otherwise lays flows out with ELK and draws them in its neo look.
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: readDiagramTheme(),
          layout: "dagre",
          look: "classic",
          securityLevel: "strict",
        });
        const { svg } = await mermaid.render(id, chart);

        if (isMounted) {
          setRawSvg(svg);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Mermaid error:", err);
          setError("The diagram could not be rendered");
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-lg border border-ux-alert-border bg-ux-alert-surface p-4 text-sm text-ux-alert-text">
        {error}
        <pre className="mt-2 text-xs text-opacity-50">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      className="mermaid-wrapper flex min-h-[200%] min-w-[200%] bg-ux-diagram-surface p-6 [&_svg]:max-w-none"
      data-zoom={zoom}
    >
      <div
        data-testid="mermaid-scale-surface"
        className="relative m-auto shrink-0"
        style={
          scaledWidth && scaledHeight
            ? { width: scaledWidth, height: scaledHeight }
            : undefined
        }
      >
        <div
          data-testid="mermaid-scale-content"
          className="origin-top-left"
          style={{
            transform: `scale(${zoom})`,
            width: svg.width ?? undefined,
            height: svg.height ?? undefined,
          }}
          dangerouslySetInnerHTML={svg.markup ? { __html: svg.markup } : undefined}
        />
      </div>
    </div>
  );
}
