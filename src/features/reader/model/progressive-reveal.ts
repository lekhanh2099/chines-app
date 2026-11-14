import { z } from "zod";

// Shared reveal transitions; persisted lesson settings stay HanziHome-owned.

export const RevealStageSchema = z.union([z.literal(0), z.literal(1), z.literal(2)]);
export type RevealStage = z.infer<typeof RevealStageSchema>;

export function nextRevealStage(stage: RevealStage): RevealStage {
 return RevealStageSchema.parse((stage + 1) % 3);
}

export function nextAvailableRevealStage(
 stage: RevealStage,
 options: { hasPinyin: boolean; hasMeaning: boolean },
): RevealStage {
 let candidate = nextRevealStage(stage);

 while ((candidate === 1 && !options.hasPinyin) || (candidate === 2 && !options.hasMeaning)) {
  candidate = nextRevealStage(candidate);
 }

 return candidate;
}

export function shouldAdvanceReveal({
 tapMode,
 hasSelection,
 interactiveChild,
 key,
}: {
 tapMode: boolean;
 hasSelection: boolean;
 interactiveChild: boolean;
 key?: string;
}): boolean {
 if (!tapMode || hasSelection || interactiveChild) return false;
 return key === undefined || key === "Enter" || key === " ";
}
