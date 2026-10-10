"use client";

import { forwardRef, useCallback, useLayoutEffect, useRef, useState } from "react";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Indicator = { height: number; left: number; top: number; width: number };

const routeIndicators = new Map<string, Indicator>();

type AnimatedHorizontalTabsProps = HTMLAttributes<HTMLDivElement> & {
  persistenceKey?: string;
};

export const AnimatedHorizontalTabs = forwardRef<HTMLDivElement, AnimatedHorizontalTabsProps>(
function AnimatedHorizontalTabs(
  { children, className, onClickCapture, persistenceKey, ...props },
  forwardedRef,
) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<Indicator | null>(() =>
    persistenceKey ? routeIndicators.get(persistenceKey) ?? null : null,
  );

  const select = useCallback((item: HTMLElement, animateScroll = true) => {
    const list = listRef.current;
    if (!list) return;
    setIndicator({
      height: item.offsetHeight,
      left: item.offsetLeft,
      top: item.offsetTop,
      width: item.offsetWidth,
    });
    const left =
      item.offsetLeft < list.scrollLeft
        ? item.offsetLeft
        : item.offsetLeft + item.offsetWidth > list.scrollLeft + list.clientWidth
          ? item.offsetLeft + item.offsetWidth - list.clientWidth
          : list.scrollLeft;
    list.scrollTo({
      left,
      behavior:
        animateScroll && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "smooth"
          : "auto",
    });
  }, []);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const update = () => {
      const active = list.querySelector<HTMLElement>(
        '[data-state="active"], [aria-current="page"]',
      );
      if (active) select(active, false);
    };
    const frame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(list);
    const mutations = new MutationObserver(update);
    mutations.observe(list, { attributes: true, subtree: true, attributeFilter: ["data-state", "aria-current"] });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
    };
  }, [select]);

  return (
    <div
      ref={(node) => {
        listRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      {...props}
      className={cn(
        "relative flex w-full items-center overflow-x-auto [&>a]:relative [&>a]:z-(--z-ux-raised) [&>button]:relative [&>button]:z-(--z-ux-raised)",
        className,
      )}
      onClickCapture={(event) => {
        onClickCapture?.(event);
        if (event.defaultPrevented) return;
        const item = (event.target as HTMLElement).closest<HTMLElement>(
          '[role="tab"], a[href]',
        );
        if (item && listRef.current?.contains(item)) {
          if (persistenceKey && indicator) routeIndicators.set(persistenceKey, indicator);
          select(item);
        }
      }}
    >
      {indicator ? (
        <span
          aria-hidden="true"
          data-tab-indicator
          className="pointer-events-none absolute left-0 top-0 z-0 rounded-ux-button bg-primary transition-[transform,width,height] duration-(--ux-duration-base) ease-[var(--ux-ease-in-out)] motion-reduce:transition-none"
          style={{
            height: indicator.height,
            transform: `translate3d(${indicator.left}px, ${indicator.top}px, 0)`,
            width: indicator.width,
          }}
        />
      ) : null}
      {children}
    </div>
  );
});

AnimatedHorizontalTabs.displayName = "AnimatedHorizontalTabs";
