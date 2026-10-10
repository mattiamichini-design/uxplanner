// Everything the demo keeps in the browser lives under this prefix in sessionStorage.
// The landing clears it (see clearDemoStorage) before it reloads the demo iframe.
export const demoStorageKey = 'ux-planner-demo';
export const demoFilesStorageKey = `${demoStorageKey}:files`;
export const demoLocationStorageKey = `${demoStorageKey}:location`;

export function clearDemoStorage() {
  try {
    const keys: string[] = [];
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key === demoStorageKey || key?.startsWith(`${demoStorageKey}:`)) keys.push(key);
    }
    keys.forEach(key => window.sessionStorage.removeItem(key));
  } catch {
    // Storage can be blocked (private windows, third-party iframes); the demo then starts from the seed on every load.
  }
}
