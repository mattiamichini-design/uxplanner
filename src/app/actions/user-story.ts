"use server";

import { existsSync } from "node:fs";
import { revalidatePath } from "next/cache";

import { localMutation } from "@/lib/server/local-session";
import { commitFiles, safePath } from "@/lib/server/workspace.mjs";

function requiredText(value: string, label: string, max: number) {
  const text = value.trim();
  if (!text || text.length > max || /[\x00-\x1f\x7f]/.test(text)) throw new Error(`Enter a valid ${label}`);
  return text;
}

export async function createStory(title: string, category: string, journey = "") {
  return localMutation(() => {
    const safeTitle = requiredText(title, "title", 200);
    const safeCategory = requiredText(category, "category", 80);
    const safeJourney = journey.trim();
    if (safeJourney && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(safeJourney)) throw new Error("Enter a valid journey slug");
    const slug = safeTitle.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug || existsSync(safePath("user-stories", `${slug}.story.md`))) throw new Error("A story with this title already exists");
    const frontmatter = [`---`, `category: ${JSON.stringify(safeCategory)}`, ...(safeJourney ? [`journey: ${safeJourney}`] : []), `---`, ``].join("\n");
    const content = `${frontmatter}# ${safeTitle}\n\n## User stories\n\n### US-001 — First outcome\n\nAs a user, I want to describe this outcome, so that the intended value is testable.\n\n- Status: draft\n`;
    commitFiles([{ segments: ["user-stories", `${slug}.story.md`], expected: null, content }]);
    revalidatePath("/ux-planner/user-stories", "layout");
    return { success: true as const, slug };
  });
}
