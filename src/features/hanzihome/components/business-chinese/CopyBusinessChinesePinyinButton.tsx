"use client";

import { ClipboardCopy } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { buildCopyablePinyin } from "@/features/hanzihome/pronunciation/copy-pinyin";
import { useCopyPinyin } from "@/features/hanzihome/pronunciation/useCopyPinyin";
import { useReaderPronunciationSessionOverrides } from "@/features/hanzihome/reader-adapters/reader-pronunciation-session";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";

/** Copies the block's contextual Pinyin, including learner-confirmed overrides. */
export function CopyBusinessChinesePinyinButton({
 pronunciationId,
 text,
 sourcePinyin,
 touchTarget = false,
}: {
 pronunciationId: string;
 text: string;
 sourcePinyin?: string;
 touchTarget?: boolean;
}) {
 const t = useTranslations("Reader.study.chrome.selection");
 const overrides = useReaderPronunciationSessionOverrides(pronunciationId);
 const copyPinyin = useCopyPinyin();
 const isCoarsePointer = useCoarsePointer();

 return (
  <Button
   type="button"
   variant="ghost"
   size={touchTarget || isCoarsePointer ? "icon" : "icon-xs"}
   className="shrink-0"
   title={t("copyPinyin")}
   aria-label={t("copyPinyin")}
   onClick={() =>
    copyPinyin(buildCopyablePinyin({ text, sourcePinyin: sourcePinyin ?? null, overrides }))
   }
  >
   <ClipboardCopy />
  </Button>
 );
}
