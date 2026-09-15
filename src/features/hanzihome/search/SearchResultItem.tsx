"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
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
 label: string;
 icon: typeof BookOpen;
 tileTone: "accent" | "neutral" | "info" | "success" | "warning";
 badgeVariant: "default" | "accent" | "warning" | "danger" | "success" | "info" | "purple";
};

const kindConfig: Record<HanziHomeSearchIndexItem["kind"], KindConfigEntry> = {
 vocab: {
  label: "Từ vựng",
  icon: Languages,
  tileTone: "accent",
  badgeVariant: "accent",
 },
 grammar: {
  label: "Ngữ pháp",
  icon: GraduationCap,
  tileTone: "info",
  badgeVariant: "purple",
 },
 lesson_text: {
  label: "Bài khóa",
  icon: BookText,
  tileTone: "info",
  badgeVariant: "info",
 },
 section: {
  label: "Đề mục",
  icon: BookOpen,
  tileTone: "info",
  badgeVariant: "default",
 },
 exercise: {
  label: "Bài tập",
  icon: SquareCheckBig,
  tileTone: "warning",
  badgeVariant: "warning",
 },
 radical: {
  label: "Bộ thủ",
  icon: Shapes,
  tileTone: "accent",
  badgeVariant: "accent",
 },
 note: {
  label: "Ghi chú",
  icon: NotebookPen,
  tileTone: "neutral",
  badgeVariant: "default",
 },
 navigation: {
  label: "Điều hướng",
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
 if (!query || !query.trim() || !text) {
  return <span className={className}>{text}</span>;
 }

 const trimmed = query.trim();
 const lowerText = text.toLowerCase();
 const lowerQuery = trimmed.toLowerCase();
 const index = lowerText.indexOf(lowerQuery);

 if (index === -1) {
  return <span className={className}>{text}</span>;
 }

 const before = text.slice(0, index);
 const match = text.slice(index, index + trimmed.length);
 const after = text.slice(index + trimmed.length);

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
      {config.label}
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
