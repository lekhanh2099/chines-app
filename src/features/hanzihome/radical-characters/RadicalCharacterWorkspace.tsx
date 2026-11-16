"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbPage,
 AppHeaderBreadcrumbSeparator,
} from "@/components/layout/header/app-header-breadcrumb";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { RadicalDetailPanel } from "@/features/hanzihome/components/RadicalDetailPanel";
import {
 HanziAwareText,
 HanziText,
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";

import { RadicalCharacterNotes } from "./RadicalCharacterNotes";
import type { RadicalCharacterSet } from "./radical-characters.schemas";

const headerOwnerId = "radical-character";

/** Detail page of one explained character: its note, its radical and the radical's other characters. */
export function RadicalCharacterWorkspace({
 set,
 hanzi,
}: {
 set: RadicalCharacterSet;
 hanzi: string;
}) {
 const t = useTranslations("Radicals.characterNotes");
 const tShell = useTranslations("Shell");
 // The radical itself is catalog content; only rows that exist there are shown.
 const catalog = useHanziHomeCatalogQuery({ includeRadicals: true, enabled: set.radicalId !== "" });
 const radical = catalog.data.radicals.find((item) => item.id === set.radicalId);
 const character = set.groups
  .flatMap((group) => group.characters)
  .find((item) => [item.hanzi, ...item.otherForms].includes(hanzi));

 useEffect(() => {
  headerToolbarStore.actions.setOwnedContent(
   headerOwnerId,
   <AppHeaderBreadcrumb aria-label={t("breadcrumbAria")} className="min-w-0 max-w-full">
    <AppHeaderBreadcrumbItem className="shrink-0">
     <AppHeaderBreadcrumbLink href="/radicals">
      {tShell("breadcrumbs.radicals")}
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator />
    <AppHeaderBreadcrumbItem className="min-w-0">
     <AppHeaderBreadcrumbPage>
      {t("sheetTitle", { radical: set.radical, name: set.hanViet })} · {hanzi}
     </AppHeaderBreadcrumbPage>
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>,
  );
 }, [hanzi, set.hanViet, set.radical, t, tShell]);
 useEffect(() => () => headerToolbarStore.actions.clearOwnedContent(headerOwnerId), []);

 return (
  <div className="hanzihome-static-page grid w-full min-w-0 content-start gap-4">
   {character ? (
    <Card variant="section" padding="md" className="grid gap-3">
     <div className="flex min-w-0 items-center gap-4">
      <HanziText as="h1" size="hero" weight="black" leading="none">
       {character.hanzi}
      </HanziText>
      <div className="grid min-w-0 flex-1 gap-1">
       <div className="flex min-w-0 flex-wrap items-baseline gap-x-3">
        <PinyinText variant="sectionTitle" tone="accent" weight="bold">
         {character.pinyin}
        </PinyinText>
        <StudyInstructionText as="span" variant="label" tone="muted" transform="uppercase">
         {character.hanViet}
        </StudyInstructionText>
        {character.otherForms.map((form) => (
         <HanziText key={form} as="span" size="card" tone="muted" leading="none">
          {form}
         </HanziText>
        ))}
       </div>
       <HanziAwareText
        text={t("components", {
         components: character.components,
         radical: set.radical,
         name: set.hanViet,
        })}
        variant="bodySmall"
        tone="muted"
       />
      </div>
      <MandarinSpeakButton text={character.hanzi} touchTarget />
     </div>
     <HanziAwareText text={character.explanation} variant="body" tone="default" />
    </Card>
   ) : null}

   <Card variant="section" padding="md" className="grid gap-3">
    <Typography as="h2" variant="sectionTitle">
     {t("radicalTitle", { radical: set.radical, name: set.hanViet })}
    </Typography>
    {radical ? (
     <RadicalDetailPanel radical={radical} editMode={false} onEdit={() => undefined} />
    ) : (
     <StudyInstructionText tone="muted">
      {set.radicalId === ""
       ? t("notInCatalog")
       : catalog.isPending
         ? t("radicalLoading")
         : t("radicalUnavailable")}
     </StudyInstructionText>
    )}
   </Card>

   <RadicalCharacterNotes set={set} focusCharacter={hanzi} />
  </div>
 );
}
