import { TextLineCard } from "../TextLineCard";
import type { LessonDisplayMode } from "../types";
import { asRecord, stringValue } from "../utils";

export function SampleRetelling({
 value,
 displayMode,
}: {
 value: unknown;
 displayMode: LessonDisplayMode;
}) {
 const sample = asRecord(value);
 const zh = stringValue(sample, "zh") || stringValue(sample, "text");
 const vi = stringValue(sample, "vi") || stringValue(sample, "meaning_vi");

 if (!zh && !vi) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">Bài kể mẫu</p>
   <TextLineCard
    zh={zh || vi}
    pinyin={stringValue(sample, "pinyin")}
    vi={vi}
    displayMode={displayMode}
   />
  </div>
 );
}
