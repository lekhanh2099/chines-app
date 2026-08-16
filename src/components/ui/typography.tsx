import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const typographyVariants = cva("", {
 variants: {
  variant: {
   display: "text-3xl font-black tracking-tight sm:text-4xl",
   pageTitle: "text-2xl font-black tracking-tight sm:text-3xl",
   sectionTitle: "text-lg font-black tracking-tight sm:text-xl",
   cardTitle: "text-base font-black leading-snug",
   body: "text-base font-medium leading-7",
   bodySmall: "text-sm font-medium leading-6",
   label: "text-sm font-bold leading-5",
   caption: "text-xs font-semibold leading-5",
   overline: "text-xs font-black uppercase tracking-wide",
   code: "font-mono text-sm leading-6",
  },
  tone: {
   default: "text-text-primary",
   secondary: "text-text-secondary",
   muted: "text-text-muted",
   accent: "text-accent-text",
   primary: "text-primary",
   inverse: "text-text-inverse",
   success: "text-success-text",
   successStrong: "text-success",
   warning: "text-warning-text",
   danger: "text-danger-text",
   dangerStrong: "text-danger",
   info: "text-info-text",
   purple: "text-purple-text",
   burntSiena: "text-burnt-siena",
   sky: "text-info-text",
   inherit: "text-inherit",
  },
  weight: {
   inherit: "",
   normal: "font-normal",
   medium: "font-medium",
   semibold: "font-semibold",
   bold: "font-bold",
   black: "font-black",
  },
  align: {
   inherit: "",
   left: "text-left",
   center: "text-center",
   right: "text-right",
  },
  clamp: {
   none: "",
   one: "truncate",
   two: "line-clamp-2",
   three: "line-clamp-3",
  },
  scale: {
   inherit: "",
   micro: "text-[0.625rem] leading-4",
   fine: "text-[0.7rem]",
   relativeSmall: "text-[0.68rem]",
   cloze: "text-[0.62em]",
   hero: "sm:text-5xl",
   sectionHero: "sm:text-3xl",
  },
  leading: {
   inherit: "",
   none: "leading-none",
   tight: "leading-tight",
   snug: "leading-snug",
   normal: "leading-normal",
   compact: "leading-5",
   standard: "leading-6",
   relaxed: "leading-relaxed",
   spacious: "leading-8",
   learner: "leading-[1.7]",
   compactLearner: "leading-[1.5]",
  },
  tracking: {
   inherit: "",
   normal: "tracking-normal",
   tight: "tracking-tight",
   wide: "tracking-wide",
   subtle: "tracking-[0.1em]",
   medium: "tracking-[0.12em]",
   overline: "tracking-[0.14em]",
   loose: "tracking-[0.16em]",
   extraLoose: "tracking-[0.18em]",
   widest: "tracking-widest",
  },
  emphasis: {
   normal: "",
   italic: "italic",
  },
  transform: {
   none: "",
   uppercase: "uppercase",
   capitalize: "capitalize",
  },
  wrapping: {
   normal: "",
   preLine: "whitespace-pre-line",
   preWrap: "whitespace-pre-wrap",
   breakWords: "break-words",
   breakAll: "break-all",
  },
  stateTone: {
   none: "",
   groupAccent: "group-hover:text-accent-text",
  },
 },
 defaultVariants: {
  variant: "body",
  tone: "default",
  weight: "inherit",
  align: "inherit",
  clamp: "none",
  scale: "inherit",
  leading: "inherit",
  tracking: "inherit",
  emphasis: "normal",
  transform: "none",
  wrapping: "normal",
  stateTone: "none",
 },
});

const defaultElementByVariant = {
 display: "h1",
 pageTitle: "h1",
 sectionTitle: "h2",
 cardTitle: "h3",
 body: "p",
 bodySmall: "p",
 label: "span",
 caption: "span",
 overline: "span",
 code: "code",
};

type TypographyOwnProps<T extends React.ElementType> = VariantProps<typeof typographyVariants> & {
 as?: T;
};

type TypographyProps<T extends React.ElementType = "p"> = TypographyOwnProps<T> &
 Omit<React.ComponentPropsWithoutRef<T>, keyof TypographyOwnProps<T>>;

function Typography<T extends React.ElementType = "p">({
 as,
 className,
 variant,
 tone,
 weight,
 align,
 clamp,
 scale,
 leading,
 tracking,
 emphasis,
 transform,
 wrapping,
 stateTone,
 ...props
}: TypographyProps<T>) {
 const resolvedVariant = variant ?? "body";
 const Component = as ?? defaultElementByVariant[resolvedVariant];

 return (
  <Component
   data-slot="typography"
   data-variant={resolvedVariant}
   className={cn(
    typographyVariants({
     variant: resolvedVariant,
     tone,
     weight,
     align,
     clamp,
     scale,
     leading,
     tracking,
     emphasis,
     transform,
     wrapping,
     stateTone,
    }),
    className,
   )}
   {...props}
  />
 );
}

export { Typography, typographyVariants };
export type { TypographyProps };
