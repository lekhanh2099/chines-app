"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetHeader } from "@/components/ui/sheet";
import { GrammarPointList } from "@/features/hanzihome/components/GrammarPointList";
import {
 GrammarPointReader,
 StructuredGrammarContent,
} from "@/features/hanzihome/components/GrammarPointReader";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import type {
 GrammarViewModel,
 HanziHomeLesson,
 LearningStatus,
 UserLearningState,
} from "@/features/hanzihome/types";
import {
 EditableNodeWrapper,
 type DraftPatchPath,
} from "@/features/hanzihome/editing";
import { LessonModuleFrame } from "./lesson-overview/LessonModuleFrame";

type GrammarWorkspaceProps = {
 lesson: HanziHomeLesson;
 state: UserLearningState;
 compact?: boolean;
 onBookmark: (id: string) => void;
 onMarkStatus: (id: string, status: LearningStatus) => void;
};

const ALL_GRAMMAR_POINTS_ID = "__all__";
const READING_VIEW_ID = "__reading__";

type GrammarReading = {
 title: string;
 contentMd: string;
 preview?: string;
};

const readingHeadingPattern =
 /^##\s*(BÀI ĐỌC(?:\s+THÊM) ?(?:\s+ÁP DỤNG) ?|BÀI ĐỌC THÊM ÁP DỤNG NGỮ PHÁP)\b/i;
const topLevelHeadingPattern = /^##\s+/;

function normalizeNewlines(value: string) {
 return value.replace(/\r\n/g, "\n");
}

function cleanMarkdownInline(value: string) {
 return value
  .replace(/^#+\s*/, "")
  .replace(/\*\*([^*\n]+)\*\*/g, "$1")
  .replace(/__([^_\n]+)__/g, "$1")
  .replace(/`([^`\n]+)`/g, "$1")
  .trim();
}

function getReadingPreview(contentMd: string) {
 return normalizeNewlines(contentMd)
  .split("\n")
  .map((line) =>
   cleanMarkdownInline(line)
    .replace(/^[-*+]\s+/, "")
    .trim(),
  )
  .find(Boolean);
}

function extractGrammarReading(
 points: GrammarViewModel[],
): GrammarReading | null {
 for (const point of points) {
  const contentMd = point.contentMd?.trim();
  if (!contentMd) continue;

  const lines = normalizeNewlines(contentMd).split("\n");
  const headingIndex = lines.findIndex((line) =>
   readingHeadingPattern.test(line.trim()),
  );

  if (headingIndex === -1) continue;

  const heading = lines[headingIndex] ?? "";
  const endIndex = lines.findIndex((line, index) => {
   if (index <= headingIndex) return false;
   return topLevelHeadingPattern.test(line.trim());
  });
  const bodyLines =
   endIndex === -1
    ? lines.slice(headingIndex + 1)
    : lines.slice(headingIndex + 1, endIndex);
  const readingContentMd = bodyLines.join("\n").trim();

  if (!readingContentMd) continue;

  return {
   title: cleanMarkdownInline(heading) || "Bài đọc áp dụng",
   contentMd: readingContentMd,
   preview: getReadingPreview(readingContentMd),
  };
 }

 return null;
}

function extractReadingFromMarkdown(contentMd?: string): GrammarReading | null {
 const normalizedContent = contentMd?.trim();
 if (!normalizedContent) return null;

 const lines = normalizeNewlines(normalizedContent).split("\n");
 const headingIndex = lines.findIndex((line) =>
  readingHeadingPattern.test(line.trim()),
 );

 if (headingIndex === -1) {
  return {
   title: "Bài đọc áp dụng",
   contentMd: normalizedContent,
   preview: getReadingPreview(normalizedContent),
  };
 }

 const heading = lines[headingIndex] ?? "";

 // applicationMarkdown is already a dedicated reading document.
 // Do not stop at the next H2, because the reading itself may contain
 // an inner title like "## 谢大力的一天".
 const readingContentMd = lines
  .slice(headingIndex + 1)
  .join("\n")
  .trim();

 if (!readingContentMd) return null;

 return {
  title: cleanMarkdownInline(heading) || "Bài đọc áp dụng",
  contentMd: readingContentMd,
  preview: getReadingPreview(readingContentMd),
 };
}

export function GrammarWorkspace({
 lesson,
 state,
 compact = false,
 onBookmark,
 onMarkStatus,
}: GrammarWorkspaceProps) {
 const grammarPoints = lesson.grammar;
 const vocabItems = lesson.vocab;
 const [selectedPointId, setSelectedPointId] = useState<string | null>(
  grammarPoints[0]?.id || null,
 );
 const [isGrammarSidebarOpen, setIsGrammarSidebarOpen] = useState(true);
 const [isGrammarSidebarSheetOpen, setIsGrammarSidebarSheetOpen] =
  useState(false);

 const reading = useMemo(
  () =>
   extractReadingFromMarkdown(lesson.notes?.applicationMarkdown) ??
   extractReadingFromMarkdown(lesson.notes?.overviewMarkdown) ??
   extractGrammarReading(grammarPoints),
  [
   grammarPoints,
   lesson.notes?.applicationMarkdown,
   lesson.notes?.overviewMarkdown,
  ],
 );
 const effectiveSelectedPointId = useMemo(() => {
  if (selectedPointId === ALL_GRAMMAR_POINTS_ID) return ALL_GRAMMAR_POINTS_ID;
  if (selectedPointId === READING_VIEW_ID) {
   return reading ? READING_VIEW_ID : grammarPoints[0]?.id || null;
  }
  if (
   selectedPointId &&
   grammarPoints.some((point) => point.id === selectedPointId)
  ) {
   return selectedPointId;
  }

  return grammarPoints[0]?.id || null;
 }, [grammarPoints, reading, selectedPointId]);
 const isAllView = effectiveSelectedPointId === ALL_GRAMMAR_POINTS_ID;
 const isReadingView = effectiveSelectedPointId === READING_VIEW_ID;

 const selectedPoint = useMemo(
  () =>
   isAllView || isReadingView
   ? null
   : grammarPoints.find((point) => point.id === effectiveSelectedPointId) ||
     grammarPoints[0] ||
     null,
  [effectiveSelectedPointId, grammarPoints, isAllView, isReadingView],
 );

 const progress = state.progress.grammar || {};
 const bookmarks = state.bookmarks.grammar || [];
 const selectedPointPath = useMemo<DraftPatchPath | null>(() => {
  if (!selectedPoint) return null;

  const index = lesson.grammar.findIndex((point) => point.id === selectedPoint.id);
  return index >= 0 ? ["grammar", index] : null;
 }, [lesson.grammar, selectedPoint]);

 const relatedVocab = useMemo(() => {
  if (!selectedPoint) return [];

  const text = [
   selectedPoint.cleanTitle,
   selectedPoint.core,
   selectedPoint.structuresView.join(" "),
   selectedPoint.examplesParsed.map((example) => example.zh).join(" "),
  ].join(" ");

  return vocabItems.filter((word) => text.includes(word.hanzi)).slice(0, 8);
 }, [selectedPoint, vocabItems]);

 const renderGrammarSidebar = () => (
  <div className="grid min-w-0 max-w-full content-start gap-3 overflow-hidden">
   <GrammarPointList
    points={grammarPoints}
    selectedPointId={
     isAllView || isReadingView
      ? effectiveSelectedPointId
      : selectedPoint?.id || null
    }
    progress={progress}
    onSelectPoint={(pointId) => {
     setSelectedPointId(pointId);
     setIsGrammarSidebarSheetOpen(false);
    }}
    allPointId={ALL_GRAMMAR_POINTS_ID}
   />
  </div>
 );

 const readerContent = isAllView ? (
  <AllGrammarPointReader points={grammarPoints} />
 ) : isReadingView && reading ? (
  <GrammarReadingReader reading={reading} />
 ) : selectedPoint && selectedPointPath ? (
  <EditableNodeWrapper
   lessonId={lesson.id}
   entityType="grammar_point"
   entityId={selectedPoint.id}
   path={selectedPointPath}
   value={selectedPoint}
   label={selectedPoint.cleanTitle}
  >
   <GrammarPointReader
    point={selectedPoint}
    status={progress[selectedPoint.id]?.status || "new"}
    bookmarked={bookmarks.includes(selectedPoint.id)}
    relatedVocab={relatedVocab}
    lessonId={lesson.id}
    onBookmark={() => onBookmark(selectedPoint.id)}
    onMarkStatus={(status) => onMarkStatus(selectedPoint.id, status)}
   />
  </EditableNodeWrapper>
 ) : (
  <GrammarPointReader
   point={selectedPoint}
   status={selectedPoint ? progress[selectedPoint.id]?.status || "new" : "new"}
   bookmarked={selectedPoint ? bookmarks.includes(selectedPoint.id) : false}
   relatedVocab={relatedVocab}
   lessonId={lesson.id}
   onBookmark={() => selectedPoint && onBookmark(selectedPoint.id)}
   onMarkStatus={(status) =>
    selectedPoint && onMarkStatus(selectedPoint.id, status)
   }
  />
 );

 return (
  <div className="grid gap-3">
   <LessonModuleFrame
    title="Ngữ pháp"
    subtitle={
     selectedPoint?.cleanTitle ||
     (isAllView ? "Xem toàn bộ điểm ngữ pháp" : "Bài đọc áp dụng")
    }
    sidebarLabel="Điểm ngữ pháp"
    sidebarSummary={`${grammarPoints.length} mục`}
    sidebarOpen={isGrammarSidebarOpen}
    onSidebarOpenChange={setIsGrammarSidebarOpen}
    sidebar={renderGrammarSidebar()}
    compact={compact}
    actions={
     <Button
      type="button"
      variant="outline"
      size="sm"
      className="lg:hidden"
      onClick={() => setIsGrammarSidebarSheetOpen(true)}
     >
      Mở danh sách
     </Button>
    }
   >
    {readerContent}
   </LessonModuleFrame>

   <Sheet
    open={isGrammarSidebarSheetOpen}
    onOpenChange={setIsGrammarSidebarSheetOpen}
    side="right"
    className="p-4 sm:max-w-md"
   >
    <SheetHeader
     title="Điểm ngữ pháp"
     onClose={() => setIsGrammarSidebarSheetOpen(false)}
    />
    {renderGrammarSidebar()}
   </Sheet>
  </div>
 );
}

function GrammarReadingReader({ reading }: { reading: GrammarReading }) {
 return (
  <Card
   padding="lg"
   className="rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
  >
   <article className="grid gap-3">
    <div className="grid gap-1">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      {reading.title}
     </p>
     <h2 className="text-2xl font-black tracking-normal text-text-primary">
      Bài đọc áp dụng
     </h2>
    </div>

    <MarkdownContent content={reading.contentMd} className="gap-3" />
   </article>
  </Card>
 );
}

function AllGrammarPointReader({ points }: { points: GrammarViewModel[] }) {
 return (
  <div className="grid gap-4">
   {points.map((point, index) => (
    <article
     key={point.id}
     className="rounded-xl border border-border-default bg-bg-primary p-4 shadow-theme-sm"
    >
     <div className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div className="grid gap-1">
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         Điểm ngữ pháp {index + 1}
        </p>

        <h2 className="text-xl font-black text-text-primary">
         {point.cleanTitle}
        </h2>
       </div>
      </div>

      <StructuredGrammarContent point={point} exampleLimit={5} />
     </div>
    </article>
   ))}
  </div>
 );
}
