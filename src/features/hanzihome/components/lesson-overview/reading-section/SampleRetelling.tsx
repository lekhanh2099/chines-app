import type { JsonFieldValue } from "@/types/json";
import { TextLineCard } from "../TextLineCard";
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
 const sample = asRecord(value);
 const zh = stringValue(sample, "zh") || stringValue(sample, "text");
 const vi = stringValue(sample, "vi") || stringValue(sample, "meaning_vi");

 if (!zh && !vi) return null;

 return (
  <div className="exercise-card-surface grid gap-2 rounded-xl border p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">Bài kể mẫu</p>
   <TextLineCard
    zh={zh || vi}
    pinyin={stringValue(sample, "pinyin")}
    vi={vi}
    displayMode={displayMode}
    annotationTarget={
     lessonId && nodeId ? { lessonId, nodeType: "reading_sample", nodeId } : undefined
    }
   />
  </div>
 );
}
