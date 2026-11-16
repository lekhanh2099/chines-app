"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Typography } from "@/components/ui/display/typography";
import { DetailHint } from "@/features/hanzihome/components/DetailHint";
import { Spinner } from "@/components/ui/feedback/spinner";
import {
 HanziAwareText,
 HanziText,
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Link } from "@/i18n/navigation";

import { explainedCharactersIn, radicalCharacterHref } from "./radical-character-forms";
import { useRadicalCharacterIndex } from "./useRadicalCharacterIndex";

/**
 * An (i) beside a word whose characters are explained in the radical notes.
 * Hover (or tap on touch) previews the explanations; pressing it with a mouse or
 * keyboard opens the radical detail page. Renders nothing for unexplained words.
 */
export function CharacterNoteHint({ text }: { text: string }) {
 const t = useTranslations("Radicals.characterNotes");
 const [open, setOpen] = useState(false);
 const characters = explainedCharactersIn(text);
 const index = useRadicalCharacterIndex(open && characters.length > 0);
 const [firstCharacter] = characters;
 if (firstCharacter === undefined) return null;
 const detailHref = radicalCharacterHref(firstCharacter);

 return (
  <DetailHint href={detailHref} label={t("hintAria", { text })} open={open} onOpenChange={setOpen}>
   {index.data ? (
    characters.map((character) => {
     const [note] = index.data.notesByForm.get(character) ?? [];
     return note ? (
      <div key={character} className="grid gap-1">
       <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <HanziText as="span" size="card" weight="black" leading="none">
         {note.character.hanzi}
        </HanziText>
        <PinyinText tone="accent" weight="bold">
         {note.character.pinyin}
        </PinyinText>
        <StudyInstructionText as="span" variant="caption" tone="muted" transform="uppercase">
         {note.character.hanViet}
        </StudyInstructionText>
       </div>
       <HanziAwareText
        text={t("components", {
         components: note.character.components,
         radical: note.radical.radical,
         name: note.radical.hanViet,
        })}
        variant="caption"
        tone="muted"
       />
       <HanziAwareText text={note.character.explanation} variant="bodySmall" tone="secondary" />
       <Link
        href={radicalCharacterHref(character)}
        className="flex items-center gap-1 text-sm font-bold text-primary"
       >
        {t("openDetail", { hanzi: note.character.hanzi })}
        <ArrowRight className="size-3.5" />
       </Link>
      </div>
     ) : null;
    })
   ) : index.isError ? (
    <Typography as="p" variant="bodySmall" tone="danger">
     {t("loadError")}
    </Typography>
   ) : (
    <Spinner />
   )}
  </DetailHint>
 );
}
