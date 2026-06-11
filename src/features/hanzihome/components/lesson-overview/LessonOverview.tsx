"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BookOpenCheck, Database, GraduationCap, Tags, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LessonNoteAccessCard } from "@/features/hanzihome/components/LessonNoteAccessCard";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import type {
 GrammarViewModel,
 HanziHomeLesson,
 HanziHomeModule,
 HanziHomeVocabItem,
 UserLearningState,
} from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";
import { EditableNodeWrapper } from "@/features/hanzihome/editing";

import { BookSectionContent } from "./BookSectionContent";
import { sectionIcons } from "./section-icons";
import { DEFAULT_LESSON_DISPLAY_MODE, type BookSection, type LessonDisplayMode } from "./types";
import { arrayValue, asRecord, getBookSections, stringValue } from "./utils";

type LessonOverviewProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 onOpenModule: (module: HanziHomeModule) => void;
};

type LessonOverviewMode = "study" | "debug";

export function LessonOverview({ lesson, onOpenModule }: LessonOverviewProps) {
 const [overviewMode] = useState<LessonOverviewMode>("study");
 const fallbackMarkdown = lesson.notes?.overviewMarkdown?.trim();
 const sourceSections = useMemo(() => getBookSections(lesson.sourceLesson), [lesson.sourceLesson]);
 const showDebug = overviewMode === "debug";

 return (
  <div className="grid gap-3 sm:gap-4">
   {showDebug && sourceSections.length > 0 ? (
    <LessonSourceDataOverview lesson={lesson} sections={sourceSections} />
   ) : (
    <LessonStudyDashboard lesson={lesson} sections={sourceSections} onOpenModule={onOpenModule} />
   )}

   {fallbackMarkdown && !lesson.sourceLesson && (
    <Card padding="lg" className="rounded-xl">
     <MarkdownContent content={fallbackMarkdown} />
    </Card>
   )}

   <LessonNoteAccessCard lesson={lesson} />
  </div>
 );
}

const OVERVIEW_DISPLAY_MODE: LessonDisplayMode = {
 ...DEFAULT_LESSON_DISPLAY_MODE,
 showPinyin: true,
 showMeaning: true,
};

function LessonStudyDashboard({
 lesson,
 sections,
 onOpenModule,
}: {
 lesson: HanziHomeLesson;
 sections: BookSection[];
 onOpenModule: (module: HanziHomeModule) => void;
}) {
 const stats = getLessonSourceStats({ lesson, sections });
 const header = (
  <Card padding="lg" className="rounded-xl">
   <div className="grid gap-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-wide text-primary">Bài học</p>
      <h2 className="text-2xl font-black leading-tight text-text-primary">
       {stats.zhTitle || lesson.title}
      </h2>
      <p className="mt-1 text-sm font-bold text-text-muted">
       {stats.volume}
       {stats.pinyinTitle && ` · ${stats.pinyinTitle}`}
      </p>
     </div>

     <div className="flex flex-wrap gap-2">
      <OverviewStatPill label={`${lesson.vocab.length} từ`} />
      <OverviewStatPill label={`${lesson.grammar.length} ngữ pháp`} />
      <OverviewStatPill label={`${sections.length} phần`} />
     </div>
    </div>
   </div>
  </Card>
 );

 return (
  <div className="grid gap-3 sm:gap-4">
   {lesson.sourceLesson ? (
    <EditableNodeWrapper
     lessonId={lesson.id}
     entityType="lesson"
     entityId={lesson.sourceLesson.lesson.id}
     path={["lesson"]}
     value={lesson.sourceLesson.lesson}
     label="Thông tin bài học"
    >
     {header}
    </EditableNodeWrapper>
   ) : (
    header
   )}

   {(lesson.vocab.length > 0 || lesson.grammar.length > 0) && (
    <div className="grid gap-3 lg:grid-cols-2">
     {lesson.vocab.length > 0 && (
      <LessonPreviewCard
       icon={Tags}
       eyebrow="Từ vựng bài này"
       title={`${lesson.vocab.length} từ chính`}
       actionLabel="Mở từ vựng"
       onAction={() => onOpenModule("vocab")}
      >
       <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {lesson.vocab.map((word) => (
         <VocabPreviewRow key={word.runtimeId} word={word} />
        ))}
       </div>
      </LessonPreviewCard>
     )}

     {lesson.grammar.length > 0 && (
      <LessonPreviewCard
       icon={GraduationCap}
       eyebrow="Ngữ pháp bài này"
       title={`${lesson.grammar.length} điểm cần nắm`}
       actionLabel="Mở ngữ pháp"
       onAction={() => onOpenModule("grammar")}
      >
       <div className="grid max-h-80 gap-2 overflow-y-auto pr-1">
        {lesson.grammar.map((point, index) => (
         <GrammarPreviewRow key={point.id} point={point} index={index} />
        ))}
       </div>
      </LessonPreviewCard>
     )}
    </div>
   )}

   {sections.length > 0 && (
    <Card padding="lg" className="rounded-xl">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Lộ trình bài này
       </p>
       <h2 className="text-lg font-black text-text-primary">Học theo đúng cấu trúc sách</h2>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onOpenModule("lessonText")}>
       Mở bài khóa
      </Button>
     </div>

     <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((section, index) => (
       <StudyPathRow key={section.id} section={section} index={index} />
      ))}
     </div>
    </Card>
   )}
  </div>
 );
}

function StudyPathRow({ section, index }: { section: BookSection; index: number }) {
 const SectionIcon = sectionIcons[section.type] ?? BookOpenCheck;

 return (
  <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border-default bg-bg-subtle p-3">
   <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-primary">
    <SectionIcon className="h-4 w-4" />
   </span>
   <div className="min-w-0">
    <p className="truncate text-sm font-black text-text-primary">
     {index + 1}. {section.title}
    </p>
    {section.subtitle && (
     <p className="truncate text-xs font-semibold text-text-muted">{section.subtitle}</p>
    )}
   </div>
  </div>
 );
}

function getSectionPayloadCount(section: BookSection) {
 const sectionRecord = asRecord(section.section);

 return (
  arrayValue(sectionRecord, "items").length +
  arrayValue(sectionRecord, "blocks").length +
  arrayValue(sectionRecord, "lesson_parts").length +
  arrayValue(sectionRecord, "grammar_points").length +
  arrayValue(sectionRecord, "key_patterns").length +
  arrayValue(sectionRecord, "key_sentences").length +
  arrayValue(sectionRecord, "main_patterns").length +
  arrayValue(sectionRecord, "exercise_types").length
 );
}

function getLessonSourceStats({
 lesson,
 sections,
}: {
 lesson: HanziHomeLesson;
 sections: BookSection[];
}) {
 const sourceRoot = asRecord(lesson.sourceLesson);
 const source = asRecord(sourceRoot.source);
 const parsedLesson = asRecord(sourceRoot.lesson);
 const title = asRecord(parsedLesson.title);
 const sourceFiles = arrayValue(source, "source_files");
 const payloadCount = sections.reduce(
  (total, section) => total + getSectionPayloadCount(section),
  0,
 );

 return {
  title: stringValue(title, "vi") || stringValue(title, "zh") || lesson.title || "Bài học",
  zhTitle: stringValue(title, "zh"),
  pinyinTitle: stringValue(title, "pinyin"),
  volume: stringValue(source, "volume_vi") || stringValue(source, "volume") || "Không rõ quyển",
  sourceFiles,
  sectionCount: sections.length,
  payloadCount,
 };
}

function LessonSourceDataOverview({
 lesson,
 sections,
}: {
 lesson: HanziHomeLesson;
 sections: BookSection[];
}) {
 const stats = getLessonSourceStats({ lesson, sections });

 return (
  <Card padding="lg" className="rounded-xl">
   <div className="grid gap-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
       <Database className="h-5 w-5" />
      </span>
      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Static lesson data
       </p>
       <h2 className="text-lg font-black text-text-primary">Render theo dữ liệu gốc của bài</h2>
       <div className="mt-1 grid gap-1">
        <p className="text-sm font-semibold text-text-muted">
         {stats.volume} · {stats.title}
        </p>
        {stats.zhTitle && (
         <p className="text-sm font-bold text-text-primary" lang="zh-CN">
          {stats.zhTitle}
          {stats.pinyinTitle && ` · ${stats.pinyinTitle}`}
         </p>
        )}
       </div>
      </div>
     </div>

     <div className="flex flex-wrap justify-end gap-2">
      <OverviewStatPill label={`${stats.sectionCount} phần`} />
      <OverviewStatPill label={`${stats.payloadCount} payload`} />
      {stats.sourceFiles.length > 0 && (
       <OverviewStatPill label={`${stats.sourceFiles.length} file nguồn`} />
      )}
     </div>
    </div>

    {stats.sourceFiles.length > 0 && (
     <div className="flex flex-wrap gap-2">
      {stats.sourceFiles.map((fileValue, index) => {
       const file = asRecord(fileValue);
       const name = stringValue(file, "name") || `source-${index + 1}`;
       const type = stringValue(file, "type");

       return (
        <span
         key={`${name}-${index}`}
         className="rounded-full border border-border-default bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted"
        >
         {name}
         {type && ` · ${type}`}
        </span>
       );
      })}
     </div>
    )}

    <div className="grid max-h-[72vh] gap-3 overflow-y-auto pr-1">
     {sections.map((section, index) => (
      <OverviewBookSection key={section.id} section={section} index={index} />
     ))}
    </div>
   </div>
  </Card>
 );
}

function OverviewStatPill({ label }: { label: string }) {
 return (
  <span className="rounded-full border border-border-default bg-bg-subtle px-3 py-1 text-xs font-black uppercase tracking-wide text-text-muted">
   {label}
  </span>
 );
}

function OverviewBookSection({ section, index }: { section: BookSection; index: number }) {
 const SectionIcon = sectionIcons[section.type] ?? BookOpenCheck;
 const payloadCount = getSectionPayloadCount(section);

 return (
  <article className="rounded-xl border border-border-default bg-bg-subtle p-3 sm:p-4">
   <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
    <div className="flex min-w-0 items-start gap-3">
     <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-primary">
      <SectionIcon className="h-4 w-4" />
     </span>
     <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       Phần {index + 1} · {section.type}
      </p>
      <h3 className="text-base font-black text-text-primary">{section.title}</h3>
      {section.subtitle && (
       <p className="text-sm font-semibold text-text-muted">{section.subtitle}</p>
      )}
     </div>
    </div>

    <span className="shrink-0 rounded-full border border-border-default bg-bg-primary px-3 py-1 text-xs font-black text-text-muted">
     {payloadCount} mục
    </span>
   </div>

   <BookSectionContent section={section.section} displayMode={OVERVIEW_DISPLAY_MODE} debugMode />
  </article>
 );
}

function LessonPreviewCard({
 icon: Icon,
 eyebrow,
 title,
 actionLabel,
 onAction,
 children,
}: {
 icon: LucideIcon;
 eyebrow: string;
 title: string;
 actionLabel: string;
 onAction: () => void;
 children: ReactNode;
}) {
 return (
  <Card padding="lg" className="rounded-xl">
   <div className="grid gap-3">
    <div className="flex items-start justify-between gap-3">
     <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
       <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">{eyebrow}</p>
       <h2 className="text-lg font-black text-text-primary">{title}</h2>
      </div>
     </div>

     <Button type="button" variant="outline" size="sm" onClick={onAction}>
      {actionLabel}
     </Button>
    </div>

    {children}
   </div>
  </Card>
 );
}

function VocabPreviewRow({ word }: { word: HanziHomeVocabItem }) {
 return (
  <div className="min-w-0 rounded-xl border border-border-default bg-bg-subtle p-3">
   <div className="flex min-w-0 items-baseline gap-2">
    <span className="truncate text-lg font-black text-text-primary" lang="zh-CN">
     {word.hanzi}
    </span>
    <span className="truncate text-sm font-bold text-primary">{word.pinyin}</span>
   </div>

   <p className="mt-1 truncate text-xs font-bold uppercase tracking-wide text-text-muted">
    {word.meaning.hanviet || word.category}
   </p>

   <p className="mt-1 line-clamp-2 text-sm font-semibold text-text-secondary">
    {getVocabDisplayMeaning(word)}
   </p>
  </div>
 );
}

function GrammarPreviewRow({ point, index }: { point: GrammarViewModel; index: number }) {
 return (
  <div className="min-w-0 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">Điểm {index + 1}</p>

   <h3 className="mt-1 truncate text-base font-black text-text-primary">{point.cleanTitle}</h3>

   <p className="mt-1 line-clamp-2 text-sm font-semibold text-text-secondary">
    {point.core || point.structuresView[0] || "Chưa có mô tả"}
   </p>

   {point.structuresView[0] && (
    <p className="mt-2 truncate rounded-lg border border-info/25 bg-info-subtle px-2 py-1 text-sm font-black text-info-text">
     {point.structuresView[0]}
    </p>
   )}
  </div>
 );
}
