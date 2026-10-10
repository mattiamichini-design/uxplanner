// Motion and layout values the scripts share with the stylesheet. They are declared once, as custom properties
// in site/app/landing.css (:root, or the shared src/styles/tokens.css), and read from there so the script and
// the CSS cannot drift apart. Every read takes a fallback equal to the declared value, so a missing token
// degrades to today's behaviour instead of producing NaN.
const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();

/** A duration token (`--dur-dialog-open`) in milliseconds. Browsers may serialise `440ms` as `0.44s`, so the unit is read. */
export function durationToken(name: string, fallback: number) {
  const value = token(name);
  const parsed = Number.parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** An easing token (`--ease-out`) as a CSS timing function. */
export function easingToken(name: string, fallback: string) {
  return token(name) || fallback;
}

/** A pixel or unitless numeric token (`--board-width`, `--dialog-exit-scale`). */
export function numberToken(name: string, fallback: number) {
  const parsed = Number.parseFloat(token(name));
  return Number.isFinite(parsed) ? parsed : fallback;
}
