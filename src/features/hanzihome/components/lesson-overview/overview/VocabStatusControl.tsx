"use client";

import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { Chip } from "@/components/ui/actions/chip";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";

const markableStatusSchema = z.enum(["learning", "hard", "known"]);

type StatusChoice = {
 status: z.output<typeof markableStatusSchema>;
 variant: NonNullable<ComponentProps<typeof Chip>["variant"]>;
};

const statusChoices: readonly StatusChoice[] = [
 { status: "learning", variant: "accent" },
 { status: "hard", variant: "warning" },
 { status: "known", variant: "success" },
];

/**
 * Marks a word as learning, hard or known. Pressing the current status clears
 * it back to new.
 */
export function VocabStatusControl({ progressId, hanzi }: { progressId: string; hanzi: string }) {
 const t = useTranslations("Vocab.cards.status");
 const learning = useLearningState();
 const current = learning.state.progress.vocab?.[progressId]?.status ?? "new";

 return (
  <div
   className="flex flex-wrap items-center gap-1.5"
   role="group"
   aria-label={t("aria", { hanzi })}
  >
   {statusChoices.map(({ status, variant }) => (
    <Chip
     key={status}
     size="sm"
     pressed={current === status}
     variant={current === status ? variant : "outline"}
     onClick={() => learning.updateVocabProgress(progressId, current === status ? "new" : status)}
    >
     {t(status)}
    </Chip>
   ))}
  </div>
 );
}
