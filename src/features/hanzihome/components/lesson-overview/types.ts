import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
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
 hanziFont: "system",
 hanziSize: "3xl",
 revealMode: "always",
};

export type BookSection = {
 id: string;
 title: string;
 subtitle?: string;
 type: Section["type"];
 order: number;
 section: Section;
};
