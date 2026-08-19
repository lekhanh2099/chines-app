import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

export function VocabPreviewRow({ word }: { word: HanziHomeVocabItem }) {
 return (
  <div className="min-w-0 rounded-xl border border-border-default bg-bg-subtle p-3 grid gap-1">
   <div className="flex min-w-0 items-baseline gap-2">
    <StudyInstructionText
     variant="sectionTitle"
     tone="default"
     weight="black"
     clamp="one"
     lang="zh-CN"
    >
     {word.hanzi}
    </StudyInstructionText>
    <StudyInstructionText tone="primary" weight="bold" clamp="one">
     {word.pinyin}
    </StudyInstructionText>
   </div>
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="bold"
    clamp="one"
    tracking="wide"
    transform="uppercase"
   >
    {word.meaning.hanviet || word.category}
   </StudyInstructionText>
   <StudyInstructionText tone="secondary" weight="semibold" clamp="two">
    {getVocabDisplayMeaning(word)}
   </StudyInstructionText>
  </div>
 );
}
