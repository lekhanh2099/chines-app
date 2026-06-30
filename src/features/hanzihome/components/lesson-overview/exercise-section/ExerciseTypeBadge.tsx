import {
 BookOpenText,
 Languages,
 ListChecks,
 MessageCircleMore,
 PencilLine,
 Shuffle,
 SpellCheck2,
} from "lucide-react";

import type { ExerciseRendererMeta } from "./exercise-renderer-registry";

const familyIcons = {
 phonetics: Languages,
 substitution: Shuffle,
 fill_blank: ListChecks,
 answer_pattern: ListChecks,
 correct_sentence: SpellCheck2,
 multiple_choice: ListChecks,
 dialogue: MessageCircleMore,
 communication: MessageCircleMore,
 matching: SpellCheck2,
 reading: BookOpenText,
 reorder: Shuffle,
 writing: PencilLine,
 reference: PencilLine,
 generic: ListChecks,
} as const;

export function ExerciseTypeBadge({ meta }: { meta: ExerciseRendererMeta }) {
 const Icon = familyIcons[meta.family];

 return (
  <span className="study-chip-accent inline-flex w-fit items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black">
   <Icon className="h-3.5 w-3.5" />
   {meta.label}
  </span>
 );
}
