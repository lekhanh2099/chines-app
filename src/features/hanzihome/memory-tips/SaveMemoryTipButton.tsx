"use client";

import { Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/actions/button";
import { Spinner } from "@/components/ui/feedback/spinner";
import { isDuplicateMemoryTipError, MemoryTipsApiError } from "./memory-tip-api";
import type { CreateMemoryTipPayload } from "./memory-tip.schema";
import { useCreateMemoryTipMutation } from "./useMemoryTips";
import { z } from "zod";

const SaveMemoryTipButtonVariantSchema = z.enum(["outline", "ghost"]);

type SaveMemoryTipButtonProps = {
 payload: CreateMemoryTipPayload;
 variant?: z.infer<typeof SaveMemoryTipButtonVariantSchema>;
};

export function SaveMemoryTipButton({
 payload,
 variant = SaveMemoryTipButtonVariantSchema.enum.outline,
}: SaveMemoryTipButtonProps) {
 const t = useTranslations("MemoryTips");
 const createMutation = useCreateMemoryTipMutation();

 return (
  <Button
   type="button"
   variant={variant}
   disabled={createMutation.isPending}
   onClick={async () => {
    try {
     await createMutation.mutateAsync(payload);
     toast.success(t("saveButton.saved"));
    } catch (error) {
     if (isDuplicateMemoryTipError(error)) {
      toast.info(t("dialog.duplicate"));
      return;
     }

     toast.error(error instanceof MemoryTipsApiError ? error.message : t("saveButton.saveError"));
    }
   }}
  >
   {createMutation.isPending ? (
    <Spinner data-icon="inline-start" />
   ) : (
    <Lightbulb data-icon="inline-start" />
   )}
   {t("saveButton.label")}
  </Button>
 );
}
