"use client";

import { useTranslations } from "next-intl";

import { NotePdfSizeError, NotePdfTypeError, NotePdfUnreadableError } from "./note-pdf-file";

/** The toast text for a failed PDF import. */
export function useNotePdfErrorMessage() {
 const t = useTranslations("Notes.editor.pdf");
 return (error: Error) =>
  t(
   error instanceof NotePdfTypeError
    ? "typeError"
    : error instanceof NotePdfSizeError
      ? "sizeError"
      : error instanceof NotePdfUnreadableError
        ? "unreadableError"
        : "importError",
  );
}
