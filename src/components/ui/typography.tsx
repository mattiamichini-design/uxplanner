import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const typographyVariants = cva("text-foreground", {
  variants: {
    variant: {
      page: "font-sans text-2xl font-semibold leading-tight tracking-tight",
      "page-compact": "font-sans text-lg font-semibold leading-tight tracking-tight sm:text-xl",
      "page-display": "font-sans text-2xl font-semibold leading-tight tracking-tight sm:text-3xl",
      "section-editorial": "font-sans text-lg font-semibold leading-tight tracking-tight",
      "section-operational": "font-sans text-lg font-semibold leading-tight tracking-tight",
      subsection: "font-sans text-base font-semibold leading-snug",
      row: "font-sans text-sm font-semibold leading-snug sm:text-base",
      "action-title": "font-sans text-base font-normal leading-6",
      body: "font-sans text-sm leading-relaxed",
      muted: "text-muted-foreground font-sans text-sm leading-relaxed",
      description: "text-muted-foreground font-sans text-sm leading-6 sm:text-base",
      "description-compact": "text-muted-foreground font-sans text-sm leading-6",
      technical: "font-mono text-sm tabular-nums",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

type TypographyElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";

interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: TypographyElement;
}

interface TechnicalValueProps extends Omit<TypographyProps, "variant"> {
  appearance?: "plain" | "chip";
}

function Typography({ as: Component = "p", className, variant, ...props }: TypographyProps) {
  return (
    <Component
      data-slot="typography"
      data-variant={variant === null ? "custom" : (variant ?? "body")}
      className={variant === null ? className : cn(typographyVariants({ variant }), className)}
      {...props}
    />
  );
}

function PageTitle(props: Omit<TypographyProps, "as" | "variant">) {
  return <Typography as="h1" variant="page" {...props} />;
}

function SectionTitle({
  tone = "editorial",
  ...props
}: Omit<TypographyProps, "as" | "variant"> & { tone?: "editorial" | "operational" }) {
  return <Typography as="h2" variant={`section-${tone}`} {...props} />;
}

function SubsectionTitle(props: Omit<TypographyProps, "as" | "variant">) {
  return <Typography as="h3" variant="subsection" {...props} />;
}

function TechnicalValue({ appearance = "plain", className, ...props }: TechnicalValueProps) {
  return (
    <Typography
      as="span"
      variant="technical"
      data-slot="technical-value"
      data-appearance={appearance}
      className={cn(
        appearance === "chip" &&
          "bg-muted inline-flex w-fit items-center gap-1 rounded px-1 py-0.5 align-baseline text-xs font-semibold leading-none",
        className,
      )}
      {...props}
    />
  );
}

export { PageTitle, SectionTitle, SubsectionTitle, TechnicalValue, Typography, typographyVariants };
export type { TechnicalValueProps, TypographyProps };
