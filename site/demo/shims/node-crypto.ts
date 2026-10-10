// The workspace uses a content digest only to detect that a file changed between a read and a write, and
// randomUUID for temporary names. A synchronous non-cryptographic digest is enough in the browser.
function digest(text: string, seed: number) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

export function createHash(_algorithm: string) {
  void _algorithm;
  let text = '';
  const hash = {
    update(chunk: string) { text += chunk; return hash; },
    digest(_encoding?: string) { void _encoding; return [1, 2, 3, 4].map(seed => digest(text, seed)).join(''); },
  };
  return hash;
}

export function randomUUID() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

const crypto = { createHash, randomUUID };
export default crypto;
