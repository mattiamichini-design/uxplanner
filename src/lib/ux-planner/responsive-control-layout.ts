import { cn } from "@/lib/utils";

type ResponsiveControlLayout = {
  outerClassName: string;
  listClassName: string;
  itemClassName: string;
};

type ResponsiveControlLayoutOptions = {
  itemCount: number;
  desktopAlignment?: "left" | "center";
  desktopWidth?: "intrinsic" | "full";
};

export function getResponsiveControlLayout({
  itemCount,
  desktopAlignment = "left",
  desktopWidth = "intrinsic",
}: ResponsiveControlLayoutOptions): ResponsiveControlLayout {
  const safeItemCount = Math.max(0, itemCount);
  const isTwoUp = safeItemCount === 2;
  const isThreeUp = safeItemCount === 3;
  const shouldOverflow = safeItemCount >= 4;
  const desktopAlignmentClass =
    desktopAlignment === "center" ? "lg:flex lg:justify-center" : "lg:flex lg:justify-start";
  const desktopWidthClass = desktopWidth === "full" ? "lg:w-full" : "lg:w-auto";

  return {
    outerClassName: cn("min-w-0", shouldOverflow ? "overflow-x-auto pb-1" : desktopAlignmentClass),
    listClassName: cn(
      "min-w-0 items-center gap-1.5",
      shouldOverflow
        ? "!grid min-w-max grid-flow-col auto-cols-[minmax(9rem,1fr)]"
        : isTwoUp
          ? cn("!grid w-full grid-cols-2", desktopWidthClass, "lg:!flex lg:flex-wrap")
          : isThreeUp
            ? cn("!grid w-full grid-cols-3", desktopWidthClass, "lg:!flex lg:flex-wrap")
            : cn("!flex flex-wrap", desktopWidthClass),
    ),
    itemClassName: cn(
      "min-w-0",
      shouldOverflow || isTwoUp || isThreeUp ? "w-full justify-center" : "shrink-0",
      desktopWidth === "intrinsic" && "lg:w-auto lg:shrink-0 lg:justify-start",
      desktopWidth === "full" && "lg:w-full",
    ),
  };
}
