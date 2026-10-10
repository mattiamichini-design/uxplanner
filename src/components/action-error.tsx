type ActionResult = { success: boolean; error?: string };

export function getActionError(result: ActionResult): string | null {
  return result.success ? null : (result.error ?? "The change could not be saved.");
}

export function ActionError({ message, floating = false }: { message: string | null; floating?: boolean }) {
  return message ? (
    <p
      role="alert"
      className={`border-destructive/30 bg-background text-destructive rounded-lg border px-3 py-2 text-sm shadow-lg ${floating ? "fixed inset-x-4 top-4 z-(--z-ux-toast) mx-auto max-w-xl" : ""}`}
    >
      {message}
    </p>
  ) : null;
}
