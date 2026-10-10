const INTERNAL_URL_BASE = "https://ux-planner.invalid";
const UNSAFE_URL_CHARACTERS = /[\u0000-\u001f\u007f\\]/;
const ENCODED_PATH_SEPARATOR = /%(?:2f|5c)/i;

function isCleanUrlValue(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value === value.trim() &&
    !UNSAFE_URL_CHARACTERS.test(value)
  );
}

export function normalizeInternalAppHref(value: unknown): string | null {
  if (!isCleanUrlValue(value) || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  const rawPathname = value.split(/[?#]/, 1)[0];
  if (ENCODED_PATH_SEPARATOR.test(rawPathname)) {
    return null;
  }

  try {
    const url = new URL(value, INTERNAL_URL_BASE);
    if (url.origin !== INTERNAL_URL_BASE || !url.pathname.startsWith("/")) {
      return null;
    }

    const canonicalPathname = url.pathname.replace(
      /^\/(?:([a-z]{2})\/)?dashboard\/?$/i,
      (_match, locale: string | undefined) => `/${locale ? `${locale}/` : ""}calc`,
    );

    return `${canonicalPathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function normalizeSafeMarkdownHref(value: unknown): string | null {
  const internalHref = normalizeInternalAppHref(value);
  if (internalHref) {
    return internalHref;
  }

  if (!isCleanUrlValue(value) || value.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
