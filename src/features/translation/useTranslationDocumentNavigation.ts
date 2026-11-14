"use client";

import { useSearchParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";

import type { useTranslationAnswerDrafts } from "./useTranslationAnswerDrafts";
import type { useTranslationAttempts } from "./useTranslationAttempts";

export function useTranslationDocumentNavigation({
 resetDocumentDrafts,
 clearSaveError,
}: {
 resetDocumentDrafts: ReturnType<typeof useTranslationAnswerDrafts>["resetDocumentDrafts"];
 clearSaveError: ReturnType<typeof useTranslationAttempts>["clearSaveError"];
}) {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();

 const selectDocument = (documentId: string) => {
  const next = new URLSearchParams(searchParams.toString());
  next.set("document", documentId);
  resetDocumentDrafts(documentId);
  clearSaveError();
  router.push(`${pathname}?${next.toString()}`, { scroll: false });
 };
 const clearDocument = () => {
  const next = new URLSearchParams(searchParams.toString());
  next.delete("document");
  resetDocumentDrafts("");
  clearSaveError();
  router.push(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, { scroll: false });
 };

 return { selectDocument, clearDocument };
}
