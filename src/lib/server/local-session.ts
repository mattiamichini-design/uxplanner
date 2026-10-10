import 'server-only';
import { headers } from 'next/headers';
import { serialized } from './workspace.mjs';

export async function localMutation<T>(operation: () => Promise<T> | T): Promise<T | { success: false; error: string }> {
  try {
    const request = await headers();
    const host = request.get('host');
    const origin = request.get('origin');
    if (process.env.UX_PLANNER_WRITE !== '1' || !host || !/^127\.0\.0\.1:\d+$/.test(host) || origin !== `http://${host}`) {
      throw new Error('Editing is available only in the local UX Planner session.');
    }
    return await serialized(operation);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not save. Your files were not replaced.' };
  }
}
