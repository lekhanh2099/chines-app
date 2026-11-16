"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { Typography } from "@/components/ui/display/typography";
import {
 HanziAwareText,
 HanziText,
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { radicalCharacterHref } from "./radical-character-forms";
import type { RadicalCharacterSet, RadicalCharacterView } from "./radical-characters.schemas";

/** Explained characters of one radical by meaning group; `focusCharacter` is highlighted. */
export function RadicalCharacterNotes({
 set,
 focusCharacter,
}: {
 set: RadicalCharacterSet;
 focusCharacter: string;
}) {
 const t = useTranslations("Radicals.characterNotes");
 const [view, setView] = useState<RadicalCharacterView>("grid");
 const count = set.groups.reduce((sum, group) => sum + group.characters.length, 0);

 return (
  <section className="grid min-w-0 gap-4" aria-label={t("title")}>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div className="grid gap-0.5">
     <Typography as="h2" variant="sectionTitle">
      {t("title")}
     </Typography>
     <Typography as="span" variant="caption" tone="muted">
      {t("count", { count })}
     </Typography>
    </div>
    <SegmentedControl<RadicalCharacterView>
     value={view}
     items={[
      { key: "grid", label: t("grid"), icon: LayoutGrid },
      { key: "list", label: t("list"), icon: List },
     ]}
     onChange={setView}
     density="toolbar"
     aria-label={t("viewAria")}
     className="w-auto"
    />
   </div>
   {set.groups.map((group) => (
    <div key={group.name} className="grid min-w-0 gap-2">
     <HanziAwareText text={group.name} variant="label" tone="accent" weight="black" />
     <ul
      className={cn(
       "grid min-w-0 gap-2",
       view === "grid" ? "sm:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1",
      )}
     >
      {group.characters.map((character) => {
       const focused = [character.hanzi, ...character.otherForms].includes(focusCharacter);
       return (
        <li key={character.hanzi} className="min-w-0">
         <Card
          variant={focused ? "elevated" : "default"}
          padding="md"
          aria-current={focused ? "true" : undefined}
          className="grid h-full content-start gap-2"
         >
          <div className="flex min-w-0 items-start gap-2">
           <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
            <Link
             href={radicalCharacterHref(character.hanzi)}
             aria-label={t("openDetail", { hanzi: character.hanzi })}
            >
             <HanziText as="span" size="card" tone="primary" weight="black" leading="none">
              {character.hanzi}
             </HanziText>
            </Link>
            {character.otherForms.map((form) => (
             <HanziText key={form} as="span" size="large" tone="muted" leading="none">
              {form}
             </HanziText>
            ))}
            <PinyinText tone="accent" weight="bold">
             {character.pinyin}
            </PinyinText>
            <StudyInstructionText as="span" variant="caption" tone="purple" transform="uppercase">
             {character.hanViet}
            </StudyInstructionText>
            {focused ? (
             <Badge variant="accent" size="sm" casing="natural">
              {t("viewing")}
             </Badge>
            ) : null}
           </div>
           <MandarinSpeakButton text={character.hanzi} />
          </div>
          <div className="grid gap-0.5">
           <Typography as="span" variant="overline" tone="muted">
            {t("componentsHeader")}
           </Typography>
           <HanziAwareText text={character.components} variant="bodySmall" tone="success" />
          </div>
          <div className="grid gap-0.5">
           <Typography as="span" variant="overline" tone="muted">
            {t("explanationHeader")}
           </Typography>
           <HanziAwareText text={character.explanation} variant="bodySmall" tone="default" />
          </div>
         </Card>
        </li>
       );
      })}
     </ul>
    </div>
   ))}
  </section>
 );
}
