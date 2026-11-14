import type { ComponentProps } from "react";

import { GlyphHPlain, GlyphHRoof } from "@/components/layout/navigation/brand-glyph";
import { focusRingClassName } from "@/components/ui/focus-ring";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function BrandWordmark({
 className,
 onClick,
}: {
 className?: ComponentProps<typeof Link>["className"];
 onClick?: ComponentProps<typeof Link>["onClick"];
}) {
 return (
  <Link
   href="/"
   onClick={onClick}
   aria-label="HanziHome"
   className={cn(
    "group/brand inline-flex items-baseline gap-px font-extrabold tracking-tight select-none text-foreground outline-none",
    "rounded-lg py-1 px-1.5 transition-colors",
    focusRingClassName,
    className,
   )}
  >
   <GlyphHPlain className="h-[0.82em] w-[0.82em] shrink-0 align-baseline overflow-visible" />
   <span className="pr-0.5 text-[1.12rem] font-extrabold leading-none tracking-tight">anzi</span>
   <GlyphHRoof className="h-[1.14em] w-[0.86em] shrink-0 align-baseline overflow-visible" />
   <span className="text-[1.12rem] font-extrabold leading-none tracking-tight">ome</span>
  </Link>
 );
}
