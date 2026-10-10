"use client";

import { Component, createRef, type ReactNode } from "react";

// Section change motion for the persistent Studio card. The card frame lives in the layout and never remounts;
// this host owns what is inside it. On a section change it animates the incoming content and a frozen copy of
// the outgoing content, in the direction of the rail order: vertical from md up (rail on the side), horizontal
// below it (sections in the sheet). Item changes inside one section keep the same sectionKey and do not move.
//
// The outgoing copy is cloned in getSnapshotBeforeUpdate, which runs before React mutates the DOM, so it works
// for any commit that changes sectionKey (links, back/forward, the demo's hash router) without a click hook.
// Transform and opacity only, so nothing reflows; the card clips overflow.

const ease = "cubic-bezier(0.23, 1, 0.32, 1)";
const enterMs = 240;
const exitMs = 180;

type Props = { sectionKey: number; className?: string; children: ReactNode };

export class StudioTransitionHost extends Component<Props> {
  private host = createRef<HTMLDivElement>();
  private animations: Animation[] = [];
  private overlay: HTMLElement | null = null;
  private timer: number | undefined;

  getSnapshotBeforeUpdate(prev: Props): HTMLElement | null {
    const host = this.host.current;
    if (!host || prev.sectionKey === this.props.sectionKey || prev.sectionKey < 0 || this.props.sectionKey < 0) return null;
    return host.cloneNode(true) as HTMLElement;
  }

  componentDidUpdate(prev: Props, _state: unknown, snapshot: HTMLElement | null) {
    if (snapshot) this.play(snapshot, this.props.sectionKey > prev.sectionKey ? 1 : -1);
  }

  componentWillUnmount() {
    this.clear();
  }

  private clear() {
    this.animations.forEach((animation) => animation.cancel());
    this.animations = [];
    window.clearTimeout(this.timer);
    this.overlay?.remove();
    this.overlay = null;
  }

  private play(snapshot: HTMLElement, direction: 1 | -1) {
    const host = this.host.current;
    const card = host?.parentElement;
    if (!host || !card || typeof host.animate !== "function") return;

    // A new change interrupts the previous one: drop it and start from the settled state.
    this.clear();

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vertical = window.matchMedia("(min-width: 768px)").matches;
    const offset = reduce ? 0 : vertical ? 16 : 20;
    const shift = (sign: number) => (offset ? `translate${vertical ? "Y" : "X"}(${sign * direction * offset}px)` : "none");

    snapshot.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    snapshot.setAttribute("aria-hidden", "true");
    snapshot.setAttribute("inert", "");
    Object.assign(snapshot.style, { position: "absolute", inset: "0", pointerEvents: "none" });
    card.appendChild(snapshot);
    this.overlay = snapshot;

    const enter = host.animate(
      [{ opacity: 0, transform: shift(1) }, { opacity: 1, transform: "none" }],
      { duration: enterMs, easing: ease, fill: "backwards" },
    );
    const exit = snapshot.animate(
      [{ opacity: 1, transform: "none" }, { opacity: 0, transform: shift(-1) }],
      { duration: exitMs, easing: ease, fill: "forwards" },
    );
    this.animations = [enter, exit];
    // Timer as well as onfinish: animations do not tick in a hidden tab, and the copy must never linger.
    const done = () => {
      if (this.overlay !== snapshot) return;
      snapshot.remove();
      this.overlay = null;
    };
    exit.onfinish = done;
    this.timer = window.setTimeout(done, exitMs + 100);
  }

  render() {
    return (
      <div ref={this.host} className={this.props.className}>
        {this.props.children}
      </div>
    );
  }
}
