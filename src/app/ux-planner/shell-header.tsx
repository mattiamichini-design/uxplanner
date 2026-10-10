"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayout } from "@/context/layout-context";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "@/i18n/use-translations";
import { Button } from "@/components/ui/button";
import { AnimatedHorizontalTabs } from "@/components/ui/animated-horizontal-tabs";
import { LogoMark } from "@/components/ui/logo-mark";

const NAV_ITEMS = [
  { href: "/ux-planner/user-journeys", labelKey: "nav.userJourneys" },
  { href: "/ux-planner/user-personas", labelKey: "nav.userPersonas" },
  { href: "/ux-planner/user-flows", labelKey: "nav.userFlows" },
  { href: "/ux-planner/user-stories", labelKey: "nav.userStories" },
];

export function UxPlannerShellHeader() {
  const { isMainNavVisible } = useLayout();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations("uxPlannerShell");

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  if (!isMainNavVisible) {
    return null;
  }

  return (
    <header
      data-testid="ux-planner-shell-header"
      className="border-ux-border sticky top-0 z-(--z-ux-chrome) border-b bg-ux-surface"
    >
      <div className="flex h-16 items-center gap-4 px-4">
        <Link
          href="/ux-planner"
          aria-label={t("title")}
          className="text-ux-text flex size-8 shrink-0 items-center justify-center"
        >
          <LogoMark className="size-6" />
        </Link>

        {/* Vertical separator */}
        <div className="bg-ux-border h-5 w-px shrink-0" />

        {/* Tab strip nav — desktop */}
        <nav
          aria-label={t("navigationLabel")}
          className="hidden flex-1 items-center gap-0.5 md:flex"
        >
          <AnimatedHorizontalTabs className="w-auto gap-0.5 overflow-visible">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center rounded-ux-button px-3 text-ux-label font-medium transition-colors",
                    isActive
                      ? "text-ux-on-primary"
                      : "text-ux-muted hover:bg-ux-soft/60 hover:text-ux-text",
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </AnimatedHorizontalTabs>
        </nav>

        {/* Mobile nav trigger */}
        <div className="ml-auto md:hidden">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-controls="ux-planner-mobile-nav-overlay"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t("closeNavigationMenu") : t("openNavigationMenu")}
            data-testid="ux-planner-mobile-nav-trigger"
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div
          id="ux-planner-mobile-nav-overlay"
          className="fixed inset-x-0 top-16 bottom-0 z-(--z-ux-scrim) md:hidden"
          data-testid="ux-planner-mobile-nav-overlay"
        >
          <button
            type="button"
            className="bg-ux-canvas/80 absolute inset-0 backdrop-blur-sm"
            aria-label={t("closeNavigationBackdrop")}
            data-testid="ux-planner-mobile-nav-backdrop"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative z-(--z-ux-raised) px-6 py-3">
            <div className="bg-ux-canvas border-ux-border grid gap-3 rounded-3xl border p-3 shadow-xl">
              <div className="grid gap-1">
                <p className="text-ux-text text-sm font-semibold">{t("title")}</p>
              </div>

              <nav aria-label={t("navigationLabel")} className="grid gap-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "rounded-3xl border px-4 py-3 text-sm transition-colors",
                        isActive
                          ? "border-ux-primary bg-ux-primary text-ux-on-primary font-medium"
                          : "border-ux-border text-ux-muted hover:border-ux-primary/40 hover:text-ux-text",
                      )}
                    >
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
