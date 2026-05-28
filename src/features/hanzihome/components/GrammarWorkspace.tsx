"use client";

import { useMemo, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetHeader } from "@/components/ui/sheet";
import { InlineDraftItemEditDialog } from "@/features/hanzihome/components/InlineDraftItemEditDialog";
import { GrammarPointList } from "@/features/hanzihome/components/GrammarPointList";
import { GrammarPointReader } from "@/features/hanzihome/components/GrammarPointReader";
import { GrammarPracticeMini } from "@/features/hanzihome/components/GrammarPracticeMini";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import type {
 GrammarViewModel,
 HanziHomeLesson,
 LearningStatus,
 UserLearningState,
} from "@/features/hanzihome/types";

type GrammarWorkspaceProps = {
 lesson: HanziHomeLesson;
 state: UserLearningState;
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
 onBookmark,
 onMarkStatus,
}: GrammarWorkspaceProps) {
 const [selectedPointId, setSelectedPointId] = useState<string | null>(
  lesson.grammar[0]?.id || null,
 );
 const [isGrammarSidebarOpen, setIsGrammarSidebarOpen] = useState(true);
 const [isGrammarSidebarSheetOpen, setIsGrammarSidebarSheetOpen] =
  useState(false);

 const reading = useMemo(
  () =>
   extractReadingFromMarkdown(lesson.notes?.applicationMarkdown) ??
   extractReadingFromMarkdown(lesson.notes?.overviewMarkdown) ??
   extractGrammarReading(lesson.grammar),
  [
   lesson.grammar,
   lesson.notes?.applicationMarkdown,
   lesson.notes?.overviewMarkdown,
  ],
 );
 const effectiveSelectedPointId = useMemo(() => {
  if (selectedPointId === ALL_GRAMMAR_POINTS_ID) return ALL_GRAMMAR_POINTS_ID;
  if (selectedPointId === READING_VIEW_ID) {
   return reading ? READING_VIEW_ID : lesson.grammar[0]?.id || null;
  }
  if (
   selectedPointId &&
   lesson.grammar.some((point) => point.id === selectedPointId)
  ) {
   return selectedPointId;
  }

  return lesson.grammar[0]?.id || null;
 }, [lesson.grammar, reading, selectedPointId]);
 const isAllView = effectiveSelectedPointId === ALL_GRAMMAR_POINTS_ID;
 const isReadingView = effectiveSelectedPointId === READING_VIEW_ID;

 const selectedPoint = useMemo(
  () =>
   isAllView || isReadingView
    ? null
    : lesson.grammar.find((point) => point.id === effectiveSelectedPointId) ||
      lesson.grammar[0] ||
      null,
  [effectiveSelectedPointId, isAllView, isReadingView, lesson.grammar],
 );

 const progress = state.progress.grammar || {};
 const bookmarks = state.bookmarks.grammar || [];

 const relatedVocab = useMemo(() => {
  if (!selectedPoint) return [];

  const text = [
   selectedPoint.cleanTitle,
   selectedPoint.core,
   selectedPoint.structuresView.join(" "),
   selectedPoint.examplesParsed.map((example) => example.zh).join(" "),
  ].join(" ");

  return lesson.vocab.filter((word) => text.includes(word.word)).slice(0, 8);
 }, [lesson.vocab, selectedPoint]);

 const renderGrammarSidebar = () => (
  <div className="grid content-start gap-3">
   <GrammarPointList
    points={lesson.grammar}
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

   {!isAllView && !isReadingView && (
    <GrammarPracticeMini point={selectedPoint} />
   )}

   {reading && (
    <GrammarReadingSidebarCard
     reading={reading}
     selected={isReadingView}
     onSelect={() => {
      setSelectedPointId(READING_VIEW_ID);
      setIsGrammarSidebarSheetOpen(false);
     }}
    />
   )}
  </div>
 );

 const readerContent = isAllView ? (
  <AllGrammarPointReader points={lesson.grammar} draftId={lesson.draftId} />
 ) : isReadingView && reading ? (
  <GrammarReadingReader reading={reading} />
 ) : (
  <GrammarPointReader
   point={selectedPoint}
   status={selectedPoint ? progress[selectedPoint.id]?.status || "new" : "new"}
   bookmarked={selectedPoint ? bookmarks.includes(selectedPoint.id) : false}
   relatedVocab={relatedVocab}
   lessonId={lesson.id}
   canEditDbContent={Boolean(
    lesson.isDbBacked &&
     !lesson.draftId &&
     lesson.courseId !== "hanyu-jiaocheng",
   )}
   editDraftId={lesson.draftId}
   editItemId={selectedPoint?.id}
   onBookmark={() => selectedPoint && onBookmark(selectedPoint.id)}
   onMarkStatus={(status) =>
    selectedPoint && onMarkStatus(selectedPoint.id, status)
   }
  />
 );

 return (
  <div className="grid gap-3">
   <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-default bg-bg-primary/95 p-2 shadow-theme-sm backdrop-blur">
    <div className="min-w-0">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Ngữ pháp bài này
     </p>
     <p className="truncate text-sm font-bold text-text-secondary">
      {lesson.grammar.length} điểm · {isAllView ? "Xem toàn bộ" : isReadingView ? "Bài đọc áp dụng" : selectedPoint?.cleanTitle || "Chọn điểm ngữ pháp"}
     </p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
     <Button
      type="button"
      variant="outline"
      size="sm"
      className="lg:hidden"
      onClick={() => setIsGrammarSidebarSheetOpen(true)}
     >
      <PanelLeftOpen className="h-4 w-4" />
      Điểm ngữ pháp
     </Button>

     <Button
      type="button"
      variant="outline"
      size="sm"
      className="hidden lg:inline-flex"
      onClick={() => setIsGrammarSidebarOpen((current) => !current)}
     >
      {isGrammarSidebarOpen ? (
       <PanelLeftClose className="h-4 w-4" />
      ) : (
       <PanelLeftOpen className="h-4 w-4" />
      )}
      {isGrammarSidebarOpen ? "Ẩn danh sách" : "Điểm ngữ pháp"}
     </Button>
    </div>
   </div>

   <div
    className={[
     "grid min-w-0 gap-3",
     isGrammarSidebarOpen
      ? "lg:grid-cols-[minmax(20rem,23.75rem)_minmax(0,1fr)]"
      : "lg:grid-cols-1",
    ].join(" ")}
   >
    {isGrammarSidebarOpen && (
     <aside className="hidden min-w-0 lg:block lg:sticky lg:top-20 lg:self-start">
      {renderGrammarSidebar()}
     </aside>
    )}

    <div className="min-w-0">{readerContent}</div>
   </div>

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

function GrammarReadingSidebarCard({
 reading,
 selected,
 onSelect,
}: {
 reading: GrammarReading;
 selected: boolean;
 onSelect: () => void;
}) {
 return (
  <Button
   type="button"
   variant={selected ? "default" : "outline"}
   className={
    selected
     ? "h-auto min-w-0 justify-start rounded-xl p-3 text-left shadow-theme-sm"
     : "h-auto min-w-0 justify-start rounded-xl bg-bg-primary p-3 text-left"
   }
   onClick={onSelect}
  >
   <span className="grid min-w-0 gap-1">
    <span className="text-sm font-black">Bài đọc áp dụng</span>
    <span className="text-xs font-semibold leading-relaxed opacity-80">
     Đọc đoạn văn dùng các điểm ngữ pháp trong bài.
    </span>
    {reading.preview && (
     <span className="truncate text-xs font-semibold opacity-70">
      {reading.preview}
     </span>
    )}
   </span>
  </Button>
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

function hasExampleDetailSection(point: GrammarViewModel) {
 return Boolean(
  point.detailSections?.some((section) =>
   section.title.toLocaleLowerCase("vi-VN").includes("ví dụ"),
  ),
 );
}

function AllGrammarPointReader({
 points,
 draftId,
}: {
 points: GrammarViewModel[];
 draftId?: string;
}) {
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

       {draftId && (
        <InlineDraftItemEditDialog
         kind="grammar"
         draftId={draftId}
         itemId={point.id}
        />
       )}
      </div>

      {point.core && (
       <p className="text-sm font-semibold leading-relaxed text-text-secondary">
        {point.core}
       </p>
      )}

      {point.structuresView.length > 0 && (
       <section className="grid gap-2">
        <h3 className="text-sm font-black text-text-primary">Công thức</h3>
        {point.structuresView.map((structure) => (
         <p
          key={structure}
          className="rounded-xl border border-info/30 bg-info-subtle p-3 text-sm font-black text-info-text"
         >
          {structure}
         </p>
        ))}
       </section>
      )}

      {point.detailSections && point.detailSections.length > 0 && (
       <section className="grid gap-2">
        <h3 className="text-sm font-black text-text-primary">
         Chi tiết nhập từ markdown
        </h3>
        {point.detailSections.map((section) => (
         <div
          key={section.key}
          className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3"
         >
          <h4 className="text-sm font-black text-text-primary">
           {section.title}
          </h4>
          {section.lines.map((line, lineIndex) => (
           <p
            key={`${section.key}-${lineIndex}`}
            className="text-sm leading-relaxed text-text-secondary"
           >
            {line}
           </p>
          ))}
         </div>
        ))}
       </section>
      )}

      {!hasExampleDetailSection(point) && point.examplesParsed.length > 0 && (
       <section className="grid gap-2">
        <h3 className="text-sm font-black text-text-primary">Ví dụ</h3>
        {point.examplesParsed.slice(0, 5).map((example) => (
         <div
          key={`${point.id}-${example.zh}-${example.vi}`}
          className="rounded-xl bg-bg-subtle p-3"
         >
          <p className="font-black leading-relaxed text-text-primary">
           {example.zh}
          </p>
          {example.vi && (
           <p className="text-sm font-semibold leading-relaxed text-text-secondary">
            {example.vi}
           </p>
          )}
         </div>
        ))}
       </section>
      )}

      {point.notes.length > 0 && (
       <section className="grid gap-2">
        <h3 className="text-sm font-black text-text-primary">Lưu ý</h3>
        {point.notes.slice(0, 5).map((note) => (
         <p key={note} className="text-sm leading-relaxed text-text-secondary">
          {note}
         </p>
        ))}
       </section>
      )}
     </div>
    </article>
   ))}
  </div>
 );
}
