export type ContextDocument = {
  id: string;
  kind: "journey" | "persona" | "flow" | "story";
  title: string;
  url: string;
  uri: string;
  revision: string;
};

export function currentContextIds(documents: ContextDocument[], currentUrl: string): string[] {
  const current = new URL(currentUrl, "http://localhost");
  const pathname = (document: ContextDocument) => new URL(document.url, current.origin).pathname;
  const personaPath = (document: ContextDocument) => `/ux-planner/user-personas/${encodeURIComponent(new URL(document.url, current.origin).searchParams.get("persona") ?? "")}`;
  const pageDocuments = documents.filter((document) => pathname(document) === current.pathname);
  const variants = pageDocuments.filter((document) => document.kind === "journey" || document.kind === "flow");
  if (!variants.length) return pageDocuments.map((document) => document.id);

  const isJourney = variants[0].kind === "journey";
  const requested = isJourney && current.searchParams.get("compare") === "true" && current.searchParams.get("personas")
    ? current.searchParams.get("personas")!.split(",")
    : [current.searchParams.get("persona")];
  let selected = variants.filter((document) => requested.includes(new URL(document.url, current.origin).searchParams.get("persona")));
  if (!selected.length) {
    const defaultPersona = isJourney && documents.find((document) => document.kind === "persona" && variants.some((variant) => pathname(document) === personaPath(variant)));
    selected = [variants.find((variant) => defaultPersona && pathname(defaultPersona) === personaPath(variant)) ?? variants[0]];
  }
  const personaPaths = new Set(isJourney ? selected.map(personaPath) : []);
  const selectedIds = new Set(selected.map((document) => document.id));
  return documents.filter((document) => selectedIds.has(document.id) || (document.kind === "persona" && personaPaths.has(pathname(document)))).map((document) => document.id);
}
