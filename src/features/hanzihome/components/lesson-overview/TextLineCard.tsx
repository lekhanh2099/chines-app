import type { LessonDisplayMode } from "./types";

export function TextLineCard({
 speaker,
 zh,
 pinyin,
 vi,
 displayMode = { showPinyin: true, showMeaning: true },
}: {
 speaker?: string;
 zh: string;
 pinyin?: string;
 vi?: string;
 displayMode?: LessonDisplayMode;
}) {
 return (
  <div className="grid gap-1 rounded-xl border border-border-default bg-bg-primary p-3">
   {speaker && (
    <p className="text-xs font-black uppercase tracking-wide text-accent-text">
     {speaker}
    </p>
   )}
   <p
    className="text-lg font-black leading-relaxed text-text-primary"
    lang="zh-CN"
   >
    {zh}
   </p>
   {displayMode.showPinyin && pinyin && (
    <p className="text-sm font-bold italic text-text-muted">{pinyin}</p>
   )}
   {displayMode.showMeaning && vi && (
    <p className="text-sm font-semibold leading-relaxed text-text-secondary">
     {vi}
    </p>
   )}
  </div>
 );
}
