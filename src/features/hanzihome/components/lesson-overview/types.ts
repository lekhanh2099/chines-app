import type {
 HanyuLesson,
 Section,
} from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

export type LessonDisplayMode = {
 showPinyin: boolean;
 showMeaning: boolean;
 hanziFont: HanziReaderFont;
 hanziSize: HanziReaderSize;
};

export type HanziReaderFont =
 | "system"
 | "songti"
 | "kai"
 | "pinyin"
 | "mengshen";
export type HanziReaderSize = "md" | "lg" | "xl" | "2xl" | "3xl";

export const DEFAULT_LESSON_DISPLAY_MODE: LessonDisplayMode = {
 showPinyin: true,
 showMeaning: false,
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
