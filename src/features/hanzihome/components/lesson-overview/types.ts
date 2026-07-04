import type {
 HanyuLesson,
 Section,
} from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import type {
 HanziReaderFont,
 HanziReaderSize,
 LessonTextDisplaySettings,
} from "@/features/hanzihome/types";

export type LessonDisplayMode = LessonTextDisplaySettings;
export type { HanziReaderFont, HanziReaderSize };

export const DEFAULT_LESSON_DISPLAY_MODE: LessonDisplayMode = {
 showPinyin: true,
 showMeaning: false,
 showAnswers: false,
 hanziFont: "songti",
 hanziSize: "3xl",
};

export type BookSection = {
 id: string;
 title: string;
 subtitle?: string;
 type: Section["type"];
 order: number;
 section: Section;
};

export type SourceLessonOverviewProps = {
 lessonDocument: HanyuLesson;
};
