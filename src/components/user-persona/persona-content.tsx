"use client";

import { MarkdownDisplay } from "@/components/ui/markdown-display";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export function PersonaContent({ content }: { content: string }) {
  // Split content by H2 headers (## Title)
  // We use a lookahead or just standard split and reconstruction
  // Simple approach: Split by newline, find lines starting with ##

  const sections = parseSections(content);

  return (
    <div className="grid gap-4">
      {sections.intro && (
        <div className="prose prose-stone max-w-none">
          <MarkdownDisplay content={sections.intro} />
        </div>
      )}

      {sections.items.map((section) => (
        <AccordionSection key={section.id} title={section.title} content={section.body} />
      ))}
    </div>
  );
}

function AccordionSection({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(true); // Sections start open and can be collapsed.
  const contentId = useId();

  return (
    <Card shape="collection" className="border-ux-border overflow-hidden rounded-2xl shadow-none">
      <Button shape="control"
        type="button"
        variant="ghost"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className="hover:bg-ux-soft/50 h-11 w-full justify-between whitespace-normal px-4 py-0 font-semibold transition-colors"
      >
        <span className="text-lg leading-7">{title}</span>
        <ChevronDown
          className={cn("size-4 transition-transform duration-(--ux-duration-fast) ease-[var(--ux-ease-out)] motion-reduce:transition-none", open && "rotate-180")}
        />
      </Button>
      {open && (
        <div id={contentId} className="px-4 pb-4 pt-0">
          <div className="prose prose-stone max-w-none border-t pt-4">
            <MarkdownDisplay content={content} />
          </div>
        </div>
      )}
    </Card>
  );
}

function parseSections(content: string) {
  const lines = content.split("\n");
  let intro = "";
  const items: { id: string; title: string; body: string }[] = [];

  let currentTitle = "";
  let currentBody: string[] = [];
  const titleCounts = new Map<string, number>();

  const createSectionId = (title: string) => {
    const baseId = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const count = titleCounts.get(baseId) ?? 0;
    titleCounts.set(baseId, count + 1);
    return count === 0 ? baseId : `${baseId}-${count + 1}`;
  };

  const pushSection = () => {
    items.push({
      id: createSectionId(currentTitle),
      title: currentTitle,
      body: currentBody.join("\n"),
    });
  };

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      // New section found
      if (currentTitle) {
        pushSection();
      } else if (currentBody.length > 0) {
        // This was the intro
        intro = currentBody.join("\n");
      }

      currentTitle = match[1].trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  // Push last section
  if (currentTitle) {
    pushSection();
  } else if (currentBody.length > 0 && !intro) {
    intro = currentBody.join("\n");
  }

  return { intro, items };
}
