import {
 HanziText,
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/display/typography";
import { GraduationCap, Headphones, Tags } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { EditableNodeWrapper } from "@/features/hanzihome/editing";
import type { StudyModule } from "@/features/hanzihome/context/types";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";
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
  zhTitle: stringValue(title, "zh") || lesson.titleZh || lesson.title,
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
  <Card variant="section" padding="lg" className="grid content-start gap-4">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="grid min-w-0 gap-1">
     <Typography
      variant="overline"
      tone="primary"
      weight="black"
      tracking="wide"
      transform="uppercase"
     >
      Bài học
     </Typography>
     <HanziText as="h2" size="hero" tone="default" leading="tight">
      {heading.zhTitle}
     </HanziText>
     {heading.pinyinTitle && (
      <PinyinText as="p" variant="sectionTitle" tone="accent" weight="bold">
       {heading.pinyinTitle}
      </PinyinText>
     )}
     <Typography variant="caption" tone="muted" weight="bold">
      {heading.volume}
     </Typography>
    </div>
    {lesson.tags?.includes("listening") ? (
     <Button type="button" size="toolbar" onClick={() => onOpenModule("listening")}>
      <Headphones data-icon="inline-start" />
      Mở luyện nghe
     </Button>
    ) : null}
   </div>
   <div className="flex flex-wrap items-center gap-1.5">
    <OverviewStatPill label={`${lesson.vocab.length} từ vựng`} />
    <Typography as="span" variant="caption" tone="muted">
     ·
    </Typography>
    <OverviewStatPill label={`${lesson.grammar.length} điểm ngữ pháp`} />
    <Typography as="span" variant="caption" tone="muted">
     ·
    </Typography>
    <OverviewStatPill label={`${sections.length} phần học`} />
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
         <VocabPreviewRow
          key={word.runtimeId}
          hanzi={word.hanzi}
          pinyin={word.pinyin}
          hanviet={word.meaning.hanviet}
          category={word.category}
          meaning={getVocabDisplayMeaning(word)}
         />
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
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       onClick={() => onOpenModule("lessonText")}
      >
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
