import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import { GraduationCap, Headphones, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EditableNodeWrapper } from "@/features/hanzihome/editing";
import type { StudyModule } from "@/features/hanzihome/context/types";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import type { BookSection } from "@/features/hanzihome/components/lesson-overview/types";
import { asRecord, stringValue } from "@/features/hanzihome/components/lesson-overview/utils";

import { GrammarPreviewRow } from "./GrammarPreviewRow";
import { LessonPreviewCard } from "./LessonPreviewCard";
import { OverviewStatPill } from "./OverviewStatPill";
import { StudyPathRow } from "./StudyPathRow";
import { VocabPreviewRow } from "./VocabPreviewRow";

function getLessonHeading(lesson: HanziHomeLesson) {
 const sourceRoot = asRecord(lesson.sourceLesson);
 const parsedLesson = asRecord(sourceRoot.lesson);
 const title = asRecord(parsedLesson.title);
 const metadata = asRecord(parsedLesson.metadata);

 return {
  zhTitle: stringValue(title, "zh") || lesson.title,
  pinyinTitle: stringValue(title, "pinyin"),
  volume:
   stringValue(metadata, "volume_vi") ||
   stringValue(metadata, "volume") ||
   lesson.bookTitle ||
   "Không rõ quyển",
 };
}

export function LessonStudyDashboard({
 lesson,
 sections,
 onOpenModule,
}: {
 lesson: HanziHomeLesson;
 sections: BookSection[];
 onOpenModule: (module: StudyModule) => void;
}) {
 const heading = getLessonHeading(lesson);
 const header = (
  <Card padding="lg" className="grid content-start gap-3">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0">
     <StudyInstructionText
      variant="overline"
      tone="primary"
      weight="black"
      tracking="wide"
      transform="uppercase"
     >
      Bài học
     </StudyInstructionText>
     <Typography as="h2" variant="sectionTitle" tone="default" weight="black" leading="tight">
      {heading.zhTitle}
     </Typography>
     <StudyInstructionText tone="muted" weight="bold">
      {heading.volume}
      {heading.pinyinTitle && ` · ${heading.pinyinTitle}`}
     </StudyInstructionText>
    </div>
    <div className="flex flex-wrap gap-2">
     {lesson.tags?.includes("listening") ? (
      <Button type="button" size="toolbar" onClick={() => onOpenModule("listening")}>
       <Headphones data-icon="inline-start" />
       Mở luyện nghe
      </Button>
     ) : null}
     <OverviewStatPill label={`${lesson.vocab.length} từ`} />
     <OverviewStatPill label={`${lesson.grammar.length} ngữ pháp`} />
     <OverviewStatPill label={`${sections.length} phần`} />
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
     value={{
      ...lesson.sourceLesson.lesson,
      source_file: lesson.sourceFile ?? "",
     }}
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
    <Card padding="lg" className="grid content-start gap-3">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
       <StudyInstructionText
        variant="overline"
        tone="muted"
        weight="black"
        tracking="wide"
        transform="uppercase"
       >
        Lộ trình bài này
       </StudyInstructionText>
       <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
        Học theo đúng cấu trúc sách
       </Typography>
      </div>
      <Button type="button" variant="outline" size="toolbar" onClick={() => onOpenModule("lessonText")}>
       Mở bài khóa
      </Button>
     </div>

     <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((section, index) => (
       <StudyPathRow key={section.id} section={section} index={index} />
      ))}
     </div>
    </Card>
   )}
  </div>
 );
}
