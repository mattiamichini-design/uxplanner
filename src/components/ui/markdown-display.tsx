import React from "react";

import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { normalizeSafeMarkdownHref } from "@/lib/security/safe-url";

interface MarkdownDisplayProps {
  content: string;
  className?: string;
}

const anchorPattern = /<a\s+id=(?:"[^"]+"|'[^']+')\s*><\/a>/gi;

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableDivider(line: string) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function MarkdownDisplay({ content, className }: MarkdownDisplayProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let inList = false;

  const flushList = (keyPrefix: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-list`} className="my-2 list-disc space-y-1 pl-5">
          {listItems}
        </ul>,
      );
      listItems = [];
      inList = false;
    }
  };

  const parseLine = (text: string): React.ReactNode => {
    const nodes: React.ReactNode[] = [];
    const safeText = text.replace(anchorPattern, "");
    const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(safeText)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(safeText.slice(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith("`")) {
        nodes.push(
          <code
            key={`code-${match.index}`}
            className="bg-muted rounded px-1 py-0.5 font-mono text-[0.9em]"
          >
            {token.slice(1, -1)}
          </code>,
        );
      } else if (token.startsWith("**")) {
        nodes.push(
          <strong key={`bold-${match.index}`} className="font-semibold">
            {token.slice(2, -2)}
          </strong>,
        );
      } else {
        const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const href = normalizeSafeMarkdownHref(link[2]);
          nodes.push(
            href ? (
              <a
                key={`link-${match.index}`}
                href={href}
                className="text-primary underline hover:no-underline"
              >
                {link[1]}
              </a>
            ) : (
              link[1]
            ),
          );
        }
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < safeText.length) {
      nodes.push(safeText.slice(lastIndex));
    }

    return nodes;
  };

  let lineStartOffset = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const trimmed = line.trim();
    const key = `line-${lineStartOffset}`;
    lineStartOffset += line.length + 1;

    if (trimmed.startsWith("```")) {
      flushList(key);
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      while (lineIndex + 1 < lines.length && !lines[lineIndex + 1].trim().startsWith("```")) {
        codeLines.push(lines[(lineIndex += 1)]);
      }
      if (lineIndex + 1 < lines.length) lineIndex += 1;
      elements.push(
        <pre
          key={key}
          className="bg-muted my-4 overflow-x-auto rounded-lg p-4 text-sm leading-relaxed"
        >
          <code data-language={language || undefined}>{codeLines.join("\n")}</code>
        </pre>,
      );
    } else if (
      lineIndex + 1 < lines.length &&
      trimmed.includes("|") &&
      isTableDivider(lines[lineIndex + 1])
    ) {
      flushList(key);
      const headers = splitTableRow(trimmed);
      lineIndex += 2;
      const rows: string[][] = [];
      while (lineIndex < lines.length && lines[lineIndex].trim().includes("|")) {
        rows.push(splitTableRow(lines[lineIndex]));
        lineIndex += 1;
      }
      lineIndex -= 1;
      elements.push(
        <div key={key} className="my-4 max-w-full overflow-x-auto">
          <table className="border-border w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-border border-b">
                {headers.map((header, index) => (
                  <th key={index} className="px-3 py-2 align-top font-semibold">
                    {parseLine(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-border border-b last:border-b-0">
                  {headers.map((_, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2 align-top leading-relaxed">
                      {parseLine(row[cellIndex] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    } else if (trimmed.startsWith("# ")) {
      flushList(key);
      elements.push(
        <Typography as="h1" variant={null} key={key} className="mt-6 mb-4 text-2xl font-bold">
          {parseLine(trimmed.slice(2))}
        </Typography>,
      );
    } else if (trimmed.startsWith("## ")) {
      flushList(key);
      elements.push(
        <Typography as="h2" variant={null} key={key} className="mt-5 mb-3 text-xl font-semibold">
          {parseLine(trimmed.slice(3))}
        </Typography>,
      );
    } else if (trimmed.startsWith("### ")) {
      flushList(key);
      elements.push(
        <Typography as="h3" variant={null} key={key} className="mt-4 mb-2 text-lg font-medium">
          {parseLine(trimmed.slice(4))}
        </Typography>,
      );
    }
    // List items
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(
        <li key={key} className="leading-relaxed">
          {parseLine(trimmed.slice(2))}
        </li>,
      );
    }
    // Empty lines (paragraph breaks)
    else if (trimmed === "") {
      flushList(key);
      elements.push(<div key={key} className="h-2" />); // Spacer
    }
    // Paragraphs
    else {
      flushList(key);
      elements.push(
        <p key={key} className="mb-2 leading-relaxed">
          {parseLine(trimmed)}
        </p>,
      );
    }
  }

  flushList("end");

  return <div className={cn("text-foreground/90 min-w-0 max-w-full break-words", className)}>{elements}</div>;
}
