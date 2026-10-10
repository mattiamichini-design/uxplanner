// The landing opens /demo in a same-origin iframe; these messages are the only contract between the two documents.
export const demoMessages = {
  ready: 'ux-planner-demo:ready',
  escape: 'ux-planner-demo:escape',
} as const;

export const demoPersistenceNote = 'Changes are kept in this tab until you close it.';

export function isEmbedded() {
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
}

export function notifyParent(type: (typeof demoMessages)[keyof typeof demoMessages]) {
  if (isEmbedded()) window.parent.postMessage({ type }, window.location.origin);
}
