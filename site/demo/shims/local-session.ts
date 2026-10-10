// Product mutations check for the loopback runner. In the demo every browser session owns its own workspace,
// so the guard only keeps the error-shape contract: failures become `{ success: false, error }`.
export async function localMutation<T>(operation: () => Promise<T> | T): Promise<T | { success: false; error: string }> {
  try {
    return await operation();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not save. Your files were not replaced.' };
  }
}
