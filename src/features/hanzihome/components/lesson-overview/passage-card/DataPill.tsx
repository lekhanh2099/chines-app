import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
export function DataPill({
 label,
 pinyin,
 meaning,
 extra,
}: {
 label: string;
 pinyin?: string;
 meaning?: string;
 extra?: string;
}) {
 if (!label) return null;

 return (
  <StudyInstructionText
   as="span"
   weight="bold"
   className="study-content-surface rounded-lg border px-3 py-2"
  >
   {label}
   {pinyin && ` · ${pinyin}`}
   {meaning && ` · ${meaning}`}
   {extra && ` · ${extra}`}
  </StudyInstructionText>
 );
}
