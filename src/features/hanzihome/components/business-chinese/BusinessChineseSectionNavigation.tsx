"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { HanziInlineText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { stripLeadingEmoji } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";

export function MobileSectionNavigation({
 sections,
 onSelect,
}: {
 sections: TextbookLesson["sections"];
 onSelect: (sectionId: string) => void;
}) {
 const t = useTranslations("BusinessChinese");

 return (
  <div className="2xl:hidden">
   <Select onValueChange={onSelect}>
    <SelectTrigger aria-label={t("tocLabel")} width="full">
     <SelectValue placeholder={t("tocLabel")} />
    </SelectTrigger>
    <SelectContent>
     {sections.map((section) => (
      <SelectItem key={section.id} value={section.id}>
       {stripLeadingEmoji(section.title)}
      </SelectItem>
     ))}
    </SelectContent>
   </Select>
  </div>
 );
}

export function DesktopSectionNavigation({
 sections,
 onSelect,
}: {
 sections: TextbookLesson["sections"];
 onSelect: (sectionId: string) => void;
}) {
 const t = useTranslations("BusinessChinese");

 return (
  <Card
   variant="section"
   padding="sm"
   className="hidden min-w-0 self-start 2xl:sticky 2xl:top-0 2xl:block"
  >
   <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
    <Typography variant="overline" tone="muted">
     {t("tocLabel")}
    </Typography>
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1">
     {sections.map((section) => (
      <Button
       key={section.id}
       type="button"
       variant="navigation"
       size="menu"
       align="start"
       className="min-w-0 w-full"
       title={stripLeadingEmoji(section.title)}
       onClick={() => onSelect(section.id)}
      >
       <span className="min-w-0 truncate">
        <HanziInlineText text={stripLeadingEmoji(section.title)} />
       </span>
      </Button>
     ))}
    </div>
   </div>
  </Card>
 );
}
