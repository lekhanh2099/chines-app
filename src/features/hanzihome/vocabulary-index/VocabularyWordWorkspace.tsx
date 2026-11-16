"use client";

import { Fragment, useEffect } from "react";
import { ArrowRight } from "lucide-react";
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
import {
 HanziAwareText,
 HanziText,
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import {
 explainedCharactersIn,
 radicalCharacterHref,
} from "@/features/hanzihome/radical-characters/radical-character-forms";
import { useRadicalCharacterIndex } from "@/features/hanzihome/radical-characters/useRadicalCharacterIndex";
import { Link } from "@/i18n/navigation";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";

import type { VocabularyEntry } from "./vocabulary-index";
import { wordPinyinKey } from "./word-key";

const headerOwnerId = "vocabulary-word";

/** Detail page of one store word: its meaning in every lesson and the notes of its characters. */
export function VocabularyWordWorkspace({ entries }: { entries: VocabularyEntry[] }) {
 const hanzi = entries[0]?.hanzi ?? "";
 const t = useTranslations("Inspector.store");
 const tShell = useTranslations("Shell");
 const characters = explainedCharactersIn(hanzi);
 const characterIndex = useRadicalCharacterIndex(characters.length > 0);

 useEffect(() => {
  headerToolbarStore.actions.setOwnedContent(
   headerOwnerId,
   <AppHeaderBreadcrumb aria-label={t("breadcrumbAria")} className="min-w-0 max-w-full">
    <AppHeaderBreadcrumbItem className="shrink-0">
     <AppHeaderBreadcrumbLink href="/inspector">
      {tShell("navigation.items.inspector")}
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator />
    <AppHeaderBreadcrumbItem className="min-w-0">
     <AppHeaderBreadcrumbPage>{hanzi}</AppHeaderBreadcrumbPage>
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>,
  );
 }, [hanzi, t, tShell]);
 useEffect(() => () => headerToolbarStore.actions.clearOwnedContent(headerOwnerId), []);

 return (
  <div className="hanzihome-static-page grid w-full min-w-0 content-start gap-4">
   {entries.map((entry, index) => (
    <Fragment key={`${entry.hanzi}:${wordPinyinKey(entry.hanzi, entry.pinyin)}`}>
     <Card variant="section" padding="md" className="flex min-w-0 flex-wrap items-center gap-4">
      <HanziText
       as={index === 0 ? "h1" : "h2"}
       size="hero"
       tone="primary"
       weight="black"
       leading="none"
      >
       {entry.hanzi}
      </HanziText>
      <div className="grid min-w-0 flex-1 gap-1">
       {entry.pinyin ? (
        <PinyinText variant="sectionTitle" tone="accent" weight="bold">
         {entry.pinyin}
        </PinyinText>
       ) : null}
       {entry.hanViet ? (
        <StudyInstructionText as="span" variant="label" tone="purple" transform="uppercase">
         {entry.hanViet}
        </StudyInstructionText>
       ) : null}
      </div>
      <MandarinSpeakButton text={entry.hanzi} touchTarget />
     </Card>

     <section className="grid min-w-0 gap-2" aria-label={t("meaningsTitle")}>
      <div className="grid gap-0.5">
       <Typography as="h2" variant="sectionTitle">
        {t("meaningsTitle")}
       </Typography>
       <Typography as="span" variant="caption" tone="muted">
        {t("meaningsCount", { count: entry.occurrences.length })}
       </Typography>
      </div>
      <ul className="grid min-w-0 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
       {entry.occurrences.map((occurrence) => (
        <li key={`${occurrence.source.href}:${occurrence.meaning}`} className="min-w-0">
         <Card variant="default" padding="md" className="grid h-full content-start gap-1.5">
          <Link
           href={occurrence.source.href}
           className="flex min-w-0 items-center gap-1 text-xs font-bold text-success-text hover:underline"
          >
           <span className="truncate">{occurrence.source.label}</span>
           <ArrowRight className="size-3.5 shrink-0" />
          </Link>
          <HanziAwareText text={occurrence.meaning} variant="body" tone="default" />
         </Card>
        </li>
       ))}
      </ul>
     </section>
    </Fragment>
   ))}

   {characters.length > 0 ? (
    <section className="grid min-w-0 gap-2" aria-label={t("charactersTitle")}>
     <Typography as="h2" variant="sectionTitle">
      {t("charactersTitle")}
     </Typography>
     <ul className="grid min-w-0 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
      {characters.map((character) => {
       const [note] = characterIndex.data?.notesByForm.get(character) ?? [];
       return note ? (
        <li key={character} className="min-w-0">
         <Card variant="default" padding="md" className="grid h-full content-start gap-1.5">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
           <Link
            href={radicalCharacterHref(character)}
            aria-label={t("openCharacter", { hanzi: note.character.hanzi })}
           >
            <HanziText as="span" size="card" tone="primary" weight="black" leading="none">
             {note.character.hanzi}
            </HanziText>
           </Link>
           <PinyinText tone="accent" weight="bold">
            {note.character.pinyin}
           </PinyinText>
           <StudyInstructionText as="span" variant="caption" tone="purple" transform="uppercase">
            {note.character.hanViet}
           </StudyInstructionText>
          </div>
          <HanziAwareText
           text={`${note.character.components} · ${note.radical.radical} (${note.radical.hanViet})`}
           variant="caption"
           tone="success"
          />
          <HanziAwareText text={note.character.explanation} variant="bodySmall" tone="default" />
         </Card>
        </li>
       ) : null;
      })}
     </ul>
    </section>
   ) : null}
  </div>
 );
}
