export type RevealStage = 0 | 1 | 2;

export function nextRevealStage(stage: RevealStage): RevealStage {
 return ((stage + 1) % 3) as RevealStage;
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
