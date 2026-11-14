"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import type { NoteContextLabels } from "./noteContext";

export function useNoteContextLabels(): NoteContextLabels {
 const t = useTranslations("Notes.context");

 return useMemo(
  () => ({
   relations: {
    main: t("relations.main"),
    lesson_text: t("relations.lesson_text"),
    vocab: t("relations.vocab"),
    grammar: t("relations.grammar"),
    annotation: t("relations.annotation"),
   },
   categories: {
    grammar: t("categories.grammar"),
    vocabulary: t("categories.vocabulary"),
    culture: t("categories.culture"),
    general: t("categories.general"),
   },
   lessonNote: t("lessonNote"),
   quickNote: t("quickNote"),
   normalNote: t("normalNote"),
   noLesson: t("noLesson"),
   quickBadge: t("quickBadge"),
   untitled: t("untitled"),
   lessonNumber: (number: number) => t("lessonNumber", { number }),
   bookLesson: (book: string, number: number) => t("bookLesson", { book, number }),
  }),
  [t],
 );
}
