"use client";

import { useTranslations } from "@/i18n/use-translations";
import { useEffect, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  pendingLabel?: string;
  layer?: "default" | "nested";
  contentClassName?: string;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  loading = false,
  pendingLabel,
  layer = "default",
  contentClassName,
}: ConfirmationDialogProps) {
  const t = useTranslations("ui.confirmationDialog");
  const [isConfirming, setIsConfirming] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const resolvedTitle = title ?? t("defaultTitle");
  const resolvedDescription = description ?? t("defaultDescription");
  const resolvedConfirmLabel = confirmLabel ?? t("confirm");
  const resolvedCancelLabel = cancelLabel ?? t("cancel");
  const isLoading = loading || isConfirming;
  const visibleConfirmLabel = isLoading
    ? (pendingLabel ?? `${resolvedConfirmLabel}…`)
    : resolvedConfirmLabel;

  useEffect(() => {
    if (open && isLoading) {
      contentRef.current?.focus();
    }
  }, [isLoading, open]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isLoading) return;
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent
        ref={contentRef}
        layer={layer}
        className={cn("gap-6 sm:max-w-[30rem]", contentClassName)}
        onOpenAutoFocus={(event) => {
          previouslyFocusedElementRef.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
          if (isLoading) {
            event.preventDefault();
            contentRef.current?.focus();
          }
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          previouslyFocusedElementRef.current?.focus();
          previouslyFocusedElementRef.current = null;
        }}
      >
        <AlertDialogHeader className="gap-2">
          <AlertDialogTitle>{resolvedTitle}</AlertDialogTitle>
          <AlertDialogDescription>{resolvedDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} className="sm:min-w-28">
            {resolvedCancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={isLoading}
            aria-busy={isLoading || undefined}
            variant={variant === "default" ? "inverse" : variant}
            className="sm:min-w-28"
            onClick={async (event) => {
              event.preventDefault();
              setIsConfirming(true);
              try {
                await onConfirm();
              } finally {
                setIsConfirming(false);
              }
            }}
          >
            {isLoading ? <Spinner data-icon="inline-start" /> : null}
            {visibleConfirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
