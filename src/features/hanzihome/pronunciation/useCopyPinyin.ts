"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

/** Writes Pinyin to the clipboard and reports the outcome with a toast. */
export function useCopyPinyin() {
 const t = useTranslations("Reader.study.chrome.selection");
 return useCallback(
  (pinyin: string) => {
   if (!pinyin) return;
   void navigator.clipboard
    .writeText(pinyin)
    .then(() => toast.success(t("pinyinCopied")))
    .catch(() => toast.error(t("copyFailed")));
  },
  [t],
 );
}
