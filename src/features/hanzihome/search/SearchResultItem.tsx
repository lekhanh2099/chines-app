"use client";

import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import { splitSearchHighlight } from "./searchHanziHomeIndex";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { cn } from "@/lib/utils";
import {
 BookOpen,
 BookText,
 GraduationCap,
 Languages,
 Library,
 NotebookPen,
 Shapes,
 SquareCheckBig,
} from "lucide-react";

import type { HanziHomeSearchIndexItem } from "./types";

type KindConfigEntry = {
 icon: typeof BookOpen;
 tileTone: NonNullable<ComponentProps<typeof IconTile>["tone"]>;
 badgeVariant: NonNullable<ComponentProps<typeof Badge>["variant"]>;
};

const kindConfig: Record<HanziHomeSearchIndexItem["kind"], KindConfigEntry> = {
 vocab: {
  icon: Languages,
  tileTone: "accent",
  badgeVariant: "accent",
 },
 grammar: {
  icon: GraduationCap,
  tileTone: "info",
  badgeVariant: "purple",
 },
 lesson_text: {
  icon: BookText,
  tileTone: "info",
  badgeVariant: "info",
 },
 section: {
  icon: BookOpen,
  tileTone: "info",
  badgeVariant: "default",
 },
 exercise: {
  icon: SquareCheckBig,
  tileTone: "warning",
  badgeVariant: "warning",
 },
 radical: {
  icon: Shapes,
  tileTone: "accent",
  badgeVariant: "accent",
 },
 note: {
  icon: NotebookPen,
  tileTone: "neutral",
  badgeVariant: "default",
 },
 navigation: {
  icon: Library,
  tileTone: "neutral",
  badgeVariant: "default",
 },
};

function HighlightedText({
 text,
 query,
 className,
}: {
 text: string;
 query?: string;
 className?: string;
}) {
 const { before, match, after } = splitSearchHighlight(text, query ?? "");
 if (!match) return <span className={className}>{text}</span>;

 return (
  <span className={className}>
   {before}
   <mark className="rounded-xs bg-primary/15 px-0.5 font-bold not-italic text-primary">
    {match}
   </mark>
   {after}
  </span>
 );
}

type SearchResultItemProps = {
 id: string;
 item: HanziHomeSearchIndexItem;
 selected: boolean;
 query?: string;
 matchedSnippet?: string;
 onSelect: () => void;
 onOpen: () => void;
};

export function SearchResultItem({
 id,
 item,
 selected,
 query,
 matchedSnippet,
 onSelect,
 onOpen,
}: SearchResultItemProps) {
 const t = useTranslations("Shell.search");
 const config = kindConfig[item.kind];
 const Icon = config.icon;
 const isVocabOrRadical = item.kind === "vocab" || item.kind === "radical";

 return (
  <Button
   id={id}
   type="button"
   role="option"
   aria-selected={selected}
   tabIndex={-1}
   onMouseEnter={onSelect}
   onClick={onOpen}
   variant={selected ? "active" : "ghost"}
   size="menu"
   align="start"
   wrap="normal"
   className="h-auto w-full min-w-0 max-w-full shrink-0 items-start gap-3 text-left"
  >
   <span className="pt-0.5">
    <IconTile size="sm" tone={config.tileTone}>
     <Icon />
    </IconTile>
   </span>
   <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
    <span className="flex min-w-0 items-center justify-between gap-2">
     <Typography
      as="span"
      variant="label"
      tone="default"
      weight="bold"
      clamp="one"
      className="block min-w-0 flex-1"
     >
      <span className={cn(isVocabOrRadical && "font-hanzi text-base")}>
       <HighlightedText text={item.title} query={query} />
      </span>
     </Typography>
     <Badge size="sm" variant={config.badgeVariant} className="shrink-0">
      {t(`kinds.${item.kind}`)}
     </Badge>
    </span>

    {matchedSnippet ? (
     <Typography
      as="span"
      variant="caption"
      tone="secondary"
      weight="medium"
      clamp="one"
      className="block min-w-0"
     >
      <em>
       <HighlightedText text={matchedSnippet} query={query} />
      </em>
     </Typography>
    ) : null}

    {item.subtitle ? (
     <Typography
      as="span"
      variant="caption"
      tone="muted"
      weight="medium"
      clamp="one"
      className="block min-w-0"
     >
      {item.subtitle}
     </Typography>
    ) : null}
   </span>
  </Button>
 );
}
