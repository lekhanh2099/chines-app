import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

export function VocabPreviewRow({
 hanzi,
 pinyin,
 hanviet,
 category,
 meaning,
}: {
 hanzi: string;
 pinyin: string;
 hanviet: string;
 category: string;
 meaning: string;
}) {
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
     {hanzi}
    </StudyInstructionText>
    <StudyInstructionText tone="primary" weight="bold" clamp="one">
     {pinyin}
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
    {hanviet || category}
   </StudyInstructionText>
   <StudyInstructionText tone="secondary" weight="semibold" clamp="two">
    {meaning}
   </StudyInstructionText>
  </div>
 );
}
