"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { currentContextIds, type ContextDocument } from "@/lib/ux-planner/ai-context";

declare global {
  interface Window {
    UX_PLANNER_BRIDGE?: {
      capabilities(): { canAttach: boolean; canSend: boolean };
      catalog(): Promise<{ documents: ContextDocument[]; revision: string }>;
      readDocuments(ids: string[]): Promise<{ documents: (ContextDocument & { content: string })[] }>;
      deliver(send: boolean, prompt: string, documents: (ContextDocument & { content: string })[]): Promise<void>;
    };
  }
}

const kindLabels = { journey: "Journey", persona: "Persona", flow: "Flow", story: "Story" };

export function AiContextPanel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [embedded, setEmbedded] = useState(false);
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<ContextDocument[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [prompt, setPrompt] = useState("");
  const [capabilities, setCapabilities] = useState({ canAttach: false, canSend: false });
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshNeeded, setRefreshNeeded] = useState(false);
  const request = useRef<string | null>(null);
  const dirty = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pollNow = useRef<() => void>(() => {});

  useEffect(() => {
    if (window.UX_PLANNER_BRIDGE) queueMicrotask(() => {
      setEmbedded(true);
      setCapabilities(window.UX_PLANNER_BRIDGE!.capabilities());
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let lastRevision: string | undefined;
    let fetching = false;
    async function poll() {
      if (fetching || document.visibilityState === "hidden") return;
      fetching = true;
      try {
        const bridge = window.UX_PLANNER_BRIDGE;
        const data = bridge ? await bridge.catalog() : await (async () => {
          const response = await fetch("/api/integration", { signal: controller.signal, cache: "no-store" });
          if (!response.ok) throw new Error("Could not load planning documents.");
          return response.json();
        })();
        if (!Array.isArray(data.documents) || typeof data.revision !== "string") throw new Error("Invalid planning document response.");
        if (controller.signal.aborted) return;
        if (lastRevision !== data.revision) {
          setDocuments(data.documents);
          setSelected((ids) => ids.filter((id) => data.documents.some((document: ContextDocument) => document.id === id)));
          if (lastRevision !== undefined) {
            if (dirty.current) setRefreshNeeded(true);
            else router.refresh();
          }
          lastRevision = data.revision;
        }
        setLoading(false);
      } catch (error) {
        if (!controller.signal.aborted) {
          setStatus(error instanceof Error ? error.message : "Could not load planning documents.");
          setLoading(false);
        }
      } finally { fetching = false; }
    }
    const handleInput = (event: Event) => {
      const target = event.target;
      // ponytail: outside form edits block refresh until navigation or manual refresh; use form save state if needed.
      if (target instanceof HTMLElement && !panel.current?.contains(target) && target.matches("input,textarea,select,[contenteditable]")) dirty.current = true;
    };
    pollNow.current = () => void poll();
    void poll();
    const interval = window.setInterval(() => void poll(), 3000);
    window.addEventListener("focus", pollNow.current);
    window.addEventListener("ux-planner:changed", pollNow.current);
    document.addEventListener("visibilitychange", pollNow.current);
    document.addEventListener("input", handleInput, true);
    document.addEventListener("change", handleInput, true);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", pollNow.current);
      window.removeEventListener("ux-planner:changed", pollNow.current);
      document.removeEventListener("visibilitychange", pollNow.current);
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("change", handleInput, true);
    };
  }, [router]);

  useEffect(() => { dirty.current = false; }, [pathname, searchParams]);

  useEffect(() => {
    if (!pending) return;
    const timeout = window.setTimeout(() => {
      request.current = null;
      setPending(false);
      setStatus("No confirmation from the host. Check the conversation before retrying.");
    }, 30000);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  async function deliver(send: boolean) {
    if (!window.UX_PLANNER_BRIDGE || request.current || !selected.length || !(send ? capabilities.canSend : capabilities.canAttach)) return;
    const requestId = crypto.randomUUID();
    request.current = requestId;
    setPending(true);
    setStatus("Reading selected documents…");
    try {
      const data = await window.UX_PLANNER_BRIDGE.readDocuments(selected);
      if (!Array.isArray(data.documents) || new Set(data.documents.map((document: ContextDocument) => document.id)).size !== selected.length || data.documents.length !== selected.length || data.documents.some((document: ContextDocument & { content: string }) => !selected.includes(document.id) || typeof document.content !== "string")) throw new Error("The selected documents could not all be read.");
      const bytes = new TextEncoder().encode(data.documents.map((document: { content: string }) => document.content).join("")).byteLength;
      if (bytes > 300_000) throw new Error("Context exceeds 300 KB. Select fewer documents.");
      if (request.current !== requestId) return;
      setStatus("Waiting for the conversation to confirm…");
      await window.UX_PLANNER_BRIDGE.deliver(send, prompt.trim(), data.documents);
      if (request.current !== requestId) return;
      request.current = null;
      setPending(false);
      setStatus("Context delivered to the conversation.");
    } catch (error) {
      if (request.current !== requestId) return;
      request.current = null;
      setPending(false);
      setStatus(error instanceof Error ? error.message : "Could not deliver context.");
    }
  }

  function close() { setOpen(false); trigger.current?.focus(); }
  const refreshNotice = refreshNeeded && <div role="status" className="border-ux-border bg-ux-surface rounded-lg border p-3 text-xs shadow-sm">
    <p>Planning documents changed. Finish saving your edits, then refresh this page.</p>
    <Button type="button" size="sm" className="mt-2" onClick={() => { dirty.current = false; setRefreshNeeded(false); router.refresh(); }}>Refresh page</Button>
  </div>;
  if (!embedded) return refreshNotice ? <div className="fixed right-3 bottom-3 z-(--z-ux-sticky) max-w-[calc(100vw-1.5rem)]">{refreshNotice}</div> : null;
  const currentIds = currentContextIds(documents, `${pathname}?${searchParams}`);
  const visible = documents.filter((document) => `${document.title} ${kindLabels[document.kind]}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={panel} className="fixed right-3 bottom-3 z-(--z-ux-sticky) flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2" onKeyDown={(event) => { if (event.key === "Escape") close(); }}>
      {!open && refreshNotice}
      {open && <section id="ai-context-panel" aria-label="Conversation context" className="border-ux-border bg-ux-surface flex max-h-[calc(100dvh-5rem)] w-ux-drawer max-w-full flex-col gap-3 overflow-y-auto rounded-ux-panel border p-4 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Conversation context</h2>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Close context panel" onClick={close}><X aria-hidden="true" /></Button>
        </div>
        {refreshNotice}
        <Input autoFocus type="search" aria-label="Search planning documents" placeholder="Search documents…" value={search} onChange={(event) => setSearch(event.target.value)} />
        <div className="flex items-center justify-between gap-2">
          <p className="text-ux-muted text-xs">{selected.length} / 12 selected</p>
          <Button type="button" size="xs" variant="ghost" disabled={!currentIds.length || pending} onClick={() => setSelected((ids) => [...new Set([...ids, ...currentIds])].slice(0, 12))}>Select current page</Button>
        </div>
        <fieldset disabled={pending} className="grid max-h-60 min-h-0 gap-1 overflow-y-auto">
          <legend className="sr-only">Planning documents to include</legend>
          {visible.map((document) => <label key={document.id} className="hover:bg-ux-selected flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm">
            <input type="checkbox" className="size-4 shrink-0 accent-[var(--color-ux-primary)]" checked={selected.includes(document.id)} disabled={selected.length >= 12 && !selected.includes(document.id)} onChange={(event) => setSelected((ids) => event.target.checked ? [...ids, document.id] : ids.filter((id) => id !== document.id))} />
            <span className="min-w-0"><span className="block break-words">{document.title}</span><span className="text-ux-muted text-xs">{kindLabels[document.kind]}</span></span>
          </label>)}
          {!visible.length && <p className="text-ux-muted py-3 text-sm">{loading ? "Loading documents…" : "No matching documents."}</p>}
        </fieldset>
        <label className="grid gap-2 text-xs font-medium">Prompt for AI (optional)
          <Textarea value={prompt} disabled={pending} onChange={(event) => setPrompt(event.target.value)} placeholder="What would you like to do with this context?" rows={2} />
        </label>
        <div className="grid gap-2">
          <Button type="button" size="sm" disabled={!selected.length || pending || !capabilities.canAttach} onClick={() => void deliver(false)}>Attach to conversation</Button>
          <Button type="button" size="sm" variant="inverse" disabled={!selected.length || pending || !capabilities.canSend} onClick={() => void deliver(true)}>Send to AI</Button>
        </div>
        <p role="status" aria-live="polite" className="text-ux-muted text-xs">{status || (!capabilities.canAttach && !capabilities.canSend ? "Waiting for conversation capabilities." : "Select documents to share with the conversation.")}</p>
      </section>}
      <Button ref={trigger} type="button" size="sm" aria-expanded={open} aria-controls="ai-context-panel" onClick={() => setOpen((value) => !value)} className="border-ux-border bg-ux-surface shadow-sm"><Paperclip aria-hidden="true" />Context{selected.length ? ` (${selected.length})` : ""}</Button>
    </div>
  );
}
