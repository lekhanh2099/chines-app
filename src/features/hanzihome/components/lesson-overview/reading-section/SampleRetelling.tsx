import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonFieldValue } from "@/types/json";
import { useTranslations } from "next-intl";
import { PassageCard } from "../PassageCard";
import type { LessonDisplayMode } from "../types";
import { asRecord, stringValue } from "../utils";

export function SampleRetelling({
 value,
 displayMode,
 lessonId,
 nodeId,
}: {
 value: JsonFieldValue;
 displayMode: LessonDisplayMode;
 lessonId?: string;
 nodeId?: string;
}) {
 const t = useTranslations("Reader.study.chrome.segment");
 const sample = asRecord(value);
 const zh = stringValue(sample, "zh") || stringValue(sample, "text");
 const vi = stringValue(sample, "vi") || stringValue(sample, "meaning_vi");

 if (!zh && !vi) return null;

 return zh ? (
  <PassageCard
   itemId={nodeId ?? "sample-retelling"}
   title={t("sampleRetelling")}
   passage={{ zh, pinyin: stringValue(sample, "pinyin"), vi }}
   displayMode={displayMode}
   lessonId={lessonId}
  />
 ) : (
  <StudyInstructionText>{vi}</StudyInstructionText>
 );
}
