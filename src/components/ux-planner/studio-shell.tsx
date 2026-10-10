"use client";

import type { ComponentType, Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext, useLayoutEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, GitBranch, Menu, PanelLeftOpen, PanelLeftClose, TrendingUp, User } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/ui/logo-mark";
import { StudioTransitionHost } from "@/components/ux-planner/studio-transition-host";
import {
  compactSidebarStorageKey,
  readCompactSidebarPreference,
  writeCompactSidebarPreference,
} from "@/lib/ux-planner/compact-sidebar-preference";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const primaryItems = [
  { href: "/ux-planner/user-journeys", label: "User Journeys", icon: TrendingUp },
  { href: "/ux-planner/user-personas", label: "User Personas", icon: User },
  { href: "/ux-planner/user-flows", label: "User Flows", icon: GitBranch },
  { href: "/ux-planner/user-stories", label: "User Stories", icon: FileText },
];

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ux-primary focus-visible:ring-offset-2";
const compactSidebarListeners = new Set<() => void>();
let compactSidebarMemory = false;

function getCompactSidebarStorage() {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getCompactSidebarPreference() {
  if (typeof window === "undefined") return compactSidebarMemory;
  compactSidebarMemory = readCompactSidebarPreference(getCompactSidebarStorage(), compactSidebarMemory);
  return compactSidebarMemory;
}

function subscribeToCompactSidebarPreference(listener: () => void) {
  compactSidebarListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== compactSidebarStorageKey) return;
    compactSidebarMemory = event.newValue === "true";
    listener();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    compactSidebarListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function saveCompactSidebarPreference(open: boolean) {
  compactSidebarMemory = open;
  writeCompactSidebarPreference(getCompactSidebarStorage(), open);
  compactSidebarListeners.forEach((listener) => listener());
}

export function StudioPrimaryRail() {
  const pathname = usePathname();

  return (
    <aside className="bg-ux-canvas hidden shrink-0 items-center px-3 py-2 md:flex md:min-h-screen md:w-ux-rail md:flex-col md:px-3 md:pt-[34px] md:pb-4">
      <Link href="/ux-planner" aria-label="UX Planner" className={cn("text-ux-text flex size-9 shrink-0 items-center justify-center rounded-ux-control focus-visible:ring-offset-ux-canvas", focusRing)}>
        <LogoMark className="size-6" />
      </Link>
      <div className="bg-ux-input mx-[18px] h-8 w-px shrink-0 md:my-[18px] md:mx-0 md:h-px md:w-8" aria-hidden="true" />
      <nav aria-label="UX Planner sections" className="flex items-center gap-1 md:flex-col">
        {primaryItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} className={cn("text-ux-muted hover:bg-ux-selected hover:text-ux-text flex size-10 items-center justify-center rounded-ux-control transition-colors focus-visible:ring-offset-ux-canvas", focusRing, active && "bg-ux-primary text-ux-on-primary hover:bg-ux-primary hover:text-ux-on-primary")}>
              <Icon className="size-5" aria-hidden="true" />
            </Link>
          );
        })}
      </nav>
      <span className="flex-1" />
    </aside>
  );
}

type StudioNavigation = { sidebar: ReactNode; section: string; current: string };

// StudioFrame sits in the layout (and in the demo shell) and stays mounted across sections. Each
// StudioWorkspace renders only the card's contents and registers its navigation data here for the mobile bar.
const StudioFrameContext = createContext<Dispatch<SetStateAction<StudioNavigation | null>> | null>(null);

function sectionIndexOf(pathname: string) {
  return primaryItems.findIndex(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
}

export function StudioFrame({ children }: { children: ReactNode }) {
  const sectionKey = sectionIndexOf(usePathname());
  const [navigation, setNavigation] = useState<StudioNavigation | null>(null);

  return (
    <StudioFrameContext.Provider value={setNavigation}>
      <StudioNavigationContext.Provider value={{ compactSidebarOpen: false, setCompactSidebarOpen: () => {}, sidebar: navigation?.sidebar ?? null, section: navigation?.section ?? "", current: navigation?.current ?? "" }}>
        <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col gap-2 p-2 md:gap-0 md:p-4 md:ps-0">
          <div className="bg-ux-canvas flex h-12 shrink-0 items-center gap-3 px-1 md:hidden">
            <Link href="/ux-planner" aria-label="UX Planner" className={cn("text-ux-text flex size-10 shrink-0 items-center justify-center rounded-ux-control", focusRing)}><LogoMark className="size-6" /></Link>
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="text-ux-muted truncate text-ux-micro">{navigation?.section ?? primaryItems[sectionKey]?.label.replace("User ", "")}</span>
              <span className="min-h-5 truncate text-sm font-semibold">{navigation?.current}</span>
            </span>
            <ResponsiveNavigationSheet>
              <button type="button" className={cn("flex size-11 items-center justify-center rounded-ux-control", focusRing)} aria-label="Open navigation">
                <Menu className="size-5" aria-hidden="true" />
              </button>
            </ResponsiveNavigationSheet>
          </div>
          <div className="border-ux-border bg-ux-surface relative flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-ux-panel border md:h-ux-viewport-fit">
            <StudioTransitionHost sectionKey={sectionKey} className="flex min-h-0 min-w-0 flex-1 md:flex-row">{children}</StudioTransitionHost>
          </div>
        </div>
      </StudioNavigationContext.Provider>
    </StudioFrameContext.Provider>
  );
}

export function StudioWorkspace({
  sidebar,
  children,
  className,
  section,
  current,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
  section: string;
  current: string;
}) {
  const compactSidebarOpen = useSyncExternalStore(
    subscribeToCompactSidebarPreference,
    getCompactSidebarPreference,
    () => false,
  );
  const setNavigation = useContext(StudioFrameContext);

  useLayoutEffect(() => {
    setNavigation?.({ sidebar, section, current });
  }, [setNavigation, sidebar, section, current]);
  useLayoutEffect(() => () => setNavigation?.(null), [setNavigation]);

  const setCompactSidebarOpen: Dispatch<SetStateAction<boolean>> = (next) => {
    saveCompactSidebarPreference(typeof next === "function" ? next(getCompactSidebarPreference()) : next);
  };

  return (
    <StudioNavigationContext.Provider value={{ compactSidebarOpen, setCompactSidebarOpen, sidebar, section, current }}>
      <div className={cn(
        "border-ux-border bg-ux-sidebar hidden shrink-0 border-r lg:w-ux-sidebar-compact ux-wide:w-ux-sidebar",
        compactSidebarOpen ? "lg:flex" : "ux-wide:flex",
      )}>{sidebar}</div>
      <div className={cn("@container bg-ux-surface flex min-h-0 min-w-0 flex-1 flex-col", className)}>
        <div className="h-full min-h-0 min-w-0 flex-1">{children}</div>
      </div>
    </StudioNavigationContext.Provider>
  );
}

type StudioNavigationState = {
  compactSidebarOpen: boolean;
  setCompactSidebarOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  sidebar: ReactNode;
  section: string;
  current: string;
};

const StudioNavigationContext = createContext<StudioNavigationState | null>(null);

function useStudioNavigation() {
  const value = useContext(StudioNavigationContext);
  if (!value) throw new Error("Studio navigation controls must be used inside StudioWorkspace");
  return value;
}

export function StudioSidebarToggle({ className }: { className?: string }) {
  const { compactSidebarOpen, setCompactSidebarOpen, section, current } = useStudioNavigation();
  const label = `${section} / ${current}`;

  return (
    <>
      <div className="hidden md:block lg:hidden">
        <ResponsiveNavigationSheet>
          <button type="button" className={cn("border-ux-border bg-ux-surface flex h-8 max-w-full items-center gap-2 rounded-ux-control border px-3 text-sm font-medium", focusRing, className)}>
            <PanelLeftOpen className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate ux-narrow:hidden">{label}</span><span className="hidden truncate ux-narrow:inline">{current}</span>
          </button>
        </ResponsiveNavigationSheet>
      </div>
      <button type="button" onClick={() => setCompactSidebarOpen((open) => !open)} aria-expanded={compactSidebarOpen} className={cn("border-ux-border bg-ux-surface hidden h-8 max-w-full items-center gap-2 rounded-ux-control border px-3 text-sm font-medium lg:flex ux-wide:hidden", focusRing, className)}>
        {compactSidebarOpen ? <PanelLeftClose className="size-4 shrink-0" aria-hidden="true" /> : <PanelLeftOpen className="size-4 shrink-0" aria-hidden="true" />}
        <span className="truncate">{label}</span>
      </button>
    </>
  );
}

function ResponsiveNavigationSheet({ children }: { children: ReactNode }) {
  const { sidebar, section } = useStudioNavigation();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && document.querySelectorAll('[role="dialog"]').length > 1) return;
      setOpen(nextOpen);
    }}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="left" className="dev-theme w-full p-0 font-sans md:w-ux-drawer" showHandle={false}>
        <SheetHeader className="text-left">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Switch section or choose another item in {section}.</SheetDescription>
        </SheetHeader>
        <SheetBody className="grid content-start gap-5 p-3">
          <nav aria-label="UX Planner sections" className="grid grid-cols-4 gap-1 md:hidden">
            {primaryItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn("text-ux-muted hover:bg-ux-selected hover:text-ux-text flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-ux-control px-1 text-ux-micro font-medium", focusRing, active && "bg-ux-primary text-ux-on-primary hover:bg-ux-primary hover:text-ux-on-primary")}>
                <Icon className="size-4" aria-hidden="true" />
                {label.replace("User ", "")}
              </Link>;
            })}
          </nav>
          <div className="min-h-0 overflow-y-auto" onClickCapture={(event) => {
            if ((event.target as HTMLElement).closest("a,[data-studio-nav-close]")) setOpen(false);
          }}>{sidebar}</div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

export function StudioSidebar({ title, action, children, label }: { title: string; action?: ReactNode; children: ReactNode; label?: string }) {
  return (
    <aside className="bg-ux-sidebar flex h-full min-h-0 w-full shrink-0 flex-col px-3 pb-3" aria-label={label ?? title}>
      <div className="flex h-ux-header shrink-0 items-center justify-between px-3">
        <h1 className="text-ux-text text-base font-semibold">{title}</h1>
        {action}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pb-3">{children}</div>
    </aside>
  );
}

const iconRegistry = LucideIcons as unknown as Record<string, ComponentType<{ className?: string }>>;

export function StudioSidebarLink({ href, active, label, iconName, badge, count }: { href: string; active?: boolean; label: string; iconName?: string; badge?: string; count?: number }) {
  const Icon = iconName ? iconRegistry[iconName] : undefined;
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn("text-ux-muted hover:bg-ux-selected/70 hover:text-ux-text flex h-11 min-h-11 min-w-fit shrink-0 items-center gap-2.5 rounded-ux-control px-3 text-sm transition-colors focus-visible:ring-offset-ux-sidebar md:min-w-0", focusRing, active && "bg-ux-selected text-ux-text font-semibold")}>
      {badge ? <span className={cn("border-ux-input bg-ux-surface text-ux-muted flex size-7 shrink-0 items-center justify-center rounded-ux-button border text-ux-micro font-semibold", active && "border-ux-primary bg-ux-primary text-ux-on-primary")}>{badge}</span> : Icon ? <span className="flex size-5 shrink-0 items-center justify-center"><Icon className="size-ux-icon" aria-hidden="true" /></span> : null}
      <span className="truncate">{label}</span>
      {count !== undefined ? <span className="text-ux-muted ms-auto text-xs tabular-nums">{count}</span> : null}
    </Link>
  );
}

export function StudioSidebarButton({ active, label, iconName, count, onClick }: { active?: boolean; label: string; iconName?: string; count?: number; onClick: () => void }) {
  const Icon = iconName ? iconRegistry[iconName] : undefined;
  return (
    <button type="button" data-studio-nav-close aria-pressed={active} onClick={onClick} className={cn("text-ux-muted hover:bg-ux-selected/70 hover:text-ux-text flex h-11 min-h-11 min-w-fit shrink-0 items-center gap-2.5 rounded-ux-control px-3 text-start text-sm transition-colors focus-visible:ring-offset-ux-sidebar md:min-w-0", focusRing, active && "bg-ux-selected text-ux-text font-semibold")}>
      {Icon ? <span className="flex size-5 shrink-0 items-center justify-center"><Icon className="size-ux-icon" aria-hidden="true" /></span> : null}
      <span className="truncate">{label}</span>
      {count !== undefined ? <span className="text-ux-muted ms-auto text-xs tabular-nums">{count}</span> : null}
    </button>
  );
}

export function StudioSidebarLabel({ children }: { children: ReactNode }) {
  return <p className="text-ux-muted shrink-0 px-3 pt-3 text-xs font-medium">{children}</p>;
}
