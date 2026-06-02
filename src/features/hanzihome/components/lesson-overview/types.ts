import type {
 HanyuLesson,
 Section,
} from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

export type LessonDisplayMode = {
 showPinyin: boolean;
 showMeaning: boolean;
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
