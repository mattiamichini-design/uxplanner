export const compactSidebarStorageKey = "ux-planner:compact-sidebar-open";

type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

export function readCompactSidebarPreference(storage: PreferenceStorage | undefined, fallback = false) {
  if (!storage) return fallback;
  try {
    return storage.getItem(compactSidebarStorageKey) === "true";
  } catch {
    return fallback;
  }
}

export function writeCompactSidebarPreference(storage: PreferenceStorage | undefined, open: boolean) {
  if (!storage) return false;
  try {
    storage.setItem(compactSidebarStorageKey, String(open));
    return true;
  } catch {
    return false;
  }
}
