"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";

import {
 HSK_GRAMMAR_LEVEL_META,
 HSK_GRAMMAR_LEVELS,
 isHskGrammarLevel,
} from "./hsk-grammar.constants";
import type { HskGrammarItem, HskGrammarLevel } from "./hsk-grammar.schemas";

function GrammarPointLabel({ item }: { item: HskGrammarItem }) {
 return `${item.source_no}. ${item.title_vi}`;
}

export function HskGrammarNavigation({
 level,
 items,
 selectedItemId,
 query,
 onQueryChange,
 onLevelChange,
 onItemChange,
}: {
 level: HskGrammarLevel;
 items: HskGrammarItem[];
 selectedItemId: string | null;
 query: string;
 onQueryChange: (value: string) => void;
 onLevelChange: (level: HskGrammarLevel) => void;
 onItemChange: (itemId: string) => void;
}) {
 const t = useTranslations("HskGrammar");

 return (
  <>
   <Card variant="section" padding="md" className="grid gap-3 xl:hidden">
    <div className="grid gap-3 sm:grid-cols-2">
     <Label variant="label" className="grid gap-1.5">
      <Typography variant="overline" tone="muted" weight="black">
       {t("navigation.level")}
      </Typography>
      <Select
       value={level}
       onValueChange={(value) => {
        if (isHskGrammarLevel(value)) onLevelChange(value);
       }}
      >
       <SelectTrigger width="full">
        <SelectValue />
       </SelectTrigger>
       <SelectContent align="start">
        {HSK_GRAMMAR_LEVELS.map((candidate) => (
         <SelectItem key={candidate} value={candidate}>
          {candidate} · {t("page.count", { count: HSK_GRAMMAR_LEVEL_META[candidate].itemCount })}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </Label>

     <Label variant="label" className="grid gap-1.5">
      <Typography variant="overline" tone="muted" weight="black">
       {t("navigation.point")}
      </Typography>
      <Select value={selectedItemId ?? undefined} onValueChange={onItemChange}>
       <SelectTrigger width="full">
        <SelectValue placeholder={t("navigation.point")} />
       </SelectTrigger>
       <SelectContent align="start">
        {items.map((item) => (
         <SelectItem key={item.id} value={item.id}>
          {GrammarPointLabel({ item })}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </Label>
    </div>

    <Label variant="label" className="grid gap-1.5">
     <Typography variant="overline" tone="muted" weight="black">
      {t("search.label")}
     </Typography>
     <Input
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      placeholder={t("search.placeholder")}
     />
    </Label>
   </Card>

   <Card
    variant="section"
    padding="md"
    className="hidden min-w-0 self-start xl:sticky xl:top-3 xl:grid xl:gap-3"
   >
    <div className="grid gap-1">
     <Typography variant="overline" tone="muted" weight="black">
      {t("navigation.level")}
     </Typography>
     <Typography variant="sectionTitle" weight="black">
      {level}
     </Typography>
     <Typography variant="caption" tone="muted">
      {t("page.count", { count: HSK_GRAMMAR_LEVEL_META[level].itemCount })}
     </Typography>
    </div>

    <div className="grid grid-cols-3 gap-1">
     {HSK_GRAMMAR_LEVELS.map((candidate) => (
      <Button
       key={candidate}
       type="button"
       size="toolbar"
       variant={candidate === level ? "active" : "navigation"}
       aria-pressed={candidate === level}
       onClick={() => onLevelChange(candidate)}
      >
       {candidate.replace("HSK", "")}
      </Button>
     ))}
    </div>

    <Separator />

    <Label variant="label" className="grid gap-1.5">
     <Typography variant="overline" tone="muted" weight="black">
      {t("search.label")}
     </Typography>
     <Input
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      placeholder={t("search.placeholder")}
     />
    </Label>

    <Separator />

    <div className="grid max-h-[70dvh] gap-1 overflow-y-auto overscroll-contain pr-1">
     {items.length > 0 ? (
      items.map((item) => {
       const active = item.id === selectedItemId;
       return (
        <Button
         key={item.id}
         type="button"
         size="menu"
         variant={active ? "menuActive" : "menu"}
         align="start"
         wrap="normal"
         aria-current={active ? "true" : undefined}
         onClick={() => onItemChange(item.id)}
        >
         <span className="grid min-w-0 gap-0.5 text-left">
          <Typography as="span" variant="caption" tone={active ? "default" : "muted"}>
           #{item.source_no}
          </Typography>
          <Typography as="span" variant="bodySmall" weight="bold" leading="compact">
           {item.title_vi}
          </Typography>
         </span>
        </Button>
       );
      })
     ) : (
      <Typography variant="bodySmall" tone="muted">
       {t("navigation.noResults")}
      </Typography>
     )}
    </div>
   </Card>
  </>
 );
}
