"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, ChevronDown } from "lucide-react";

import { getScrollContainerForTarget } from "@/components/layout/scroll/app-scroll";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuGroup,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { Typography } from "@/components/ui/display/typography";
import { HanziInlineText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 splitTrailingTranslation,
 stripLeadingEmoji,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { cn } from "@/lib/utils";

export function CompactSectionNavigation({
 sections,
 onSelect,
 className,
}: {
 readonly sections: TextbookLesson["sections"];
 readonly onSelect: (sectionId: string) => void;
 readonly className?: string;
}) {
 const t = useTranslations("BusinessChinese");

 if (sections.length <= 1) return null;

 return (
  <DropdownMenu modal={false}>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     variant="outline"
     size="toolbar"
     className={cn("gap-1.5 shrink-0", className)}
     aria-label={t("tocLabel")}
     title={t("tocLabel")}
    >
     <BookOpen className="size-3.5 text-accent-text shrink-0" />
     <span className="truncate max-w-[7rem] sm:max-w-[10rem]">{t("tocLabel")}</span>
     <ChevronDown className="size-3 text-muted-foreground shrink-0" />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="start" width="md">
    <DropdownMenuLabel>{t("tocLabel")}</DropdownMenuLabel>
    <DropdownMenuGroup>
     {sections.map((section) => (
      <DropdownMenuItem
       key={section.id}
       onClick={() => onSelect(section.id)}
       className="cursor-pointer"
      >
       <HanziInlineText text={stripLeadingEmoji(section.title)} />
      </DropdownMenuItem>
     ))}
    </DropdownMenuGroup>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}

export function MobileSectionNavigation({
 sections,
 onSelect,
 className,
}: {
 readonly sections: TextbookLesson["sections"];
 readonly onSelect: (sectionId: string) => void;
 readonly className?: string;
}) {
 return <CompactSectionNavigation sections={sections} onSelect={onSelect} className={className} />;
}

export function GrammarSectionNavigation({
 sections,
 onSelect,
}: {
 readonly sections: TextbookLesson["sections"];
 readonly onSelect: (sectionId: string) => void;
}) {
 const t = useTranslations("BusinessChinese");
 const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");

 useEffect(() => {
  const targets = sections
   .map((section) => document.getElementById(section.id))
   .filter((target) => target !== null);
  const first = targets[0];
  if (!first) return;
  const container = getScrollContainerForTarget(first);
  if (!container) return;

  let frame = 0;
  const updateActiveSection = () => {
   if (frame) return;
   frame = window.requestAnimationFrame(() => {
    frame = 0;
    const top = container.getBoundingClientRect().top;
    const atEnd =
     container.scrollTop > 0 &&
     Math.ceil(container.scrollTop + container.clientHeight) >= container.scrollHeight;
    const current = atEnd
     ? targets.at(-1)
     : targets.findLast((target) => target.getBoundingClientRect().top < top + 1);
    setActiveSectionId(current?.id ?? first.id);
   });
  };

  updateActiveSection();
  container.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", updateActiveSection);
  return () => {
   window.cancelAnimationFrame(frame);
   container.removeEventListener("scroll", updateActiveSection);
   window.removeEventListener("resize", updateActiveSection);
  };
 }, [sections]);

 return (
  <nav aria-label={t("tocLabel")} className="flex min-w-0 gap-2 overflow-x-auto p-1 scrollbar-soft">
   {sections.map((section, index) => {
    const title = stripLeadingEmoji(section.title);
    const heading = title.replace(/^(?:\([一二三四五六七八九十]+\)|\[\d+\]|\d+\.?)\s+/u, "");
    const shortTitle =
     title.match(/ – "([^"]+)"/u)?.[1] ??
     splitTrailingTranslation(heading.replace(/^Cấu trúc:\s*/u, "").split(" - ")[0]).source;
    const active = section.id === activeSectionId;

    return (
     <Button
      key={section.id}
      type="button"
      size="compact"
      variant={active ? "active" : "outline"}
      className="max-w-60"
      aria-controls={section.id}
      aria-current={active ? "location" : undefined}
      title={title}
      onClick={() => onSelect(section.id)}
     >
      <span className="min-w-0 truncate">
       <HanziInlineText text={`${index + 1}. ${shortTitle}`} />
      </span>
     </Button>
    );
   })}
  </nav>
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

 if (sections.length <= 1) return null;

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
       wrap={section.category === "grammar" ? "normal" : "nowrap"}
       className="min-w-0 w-full"
       title={stripLeadingEmoji(section.title)}
       onClick={() => onSelect(section.id)}
      >
       <span className={section.category === "grammar" ? "min-w-0" : "min-w-0 truncate"}>
        <HanziInlineText text={stripLeadingEmoji(section.title)} />
       </span>
      </Button>
     ))}
    </div>
   </div>
  </Card>
 );
}
