import type { HanziHomeCourseBook } from "@/features/hanzihome/types";

export type CourseStats = {
 books: HanziHomeCourseBook[];
 lessonCount: number;
 vocabCount: number;
 grammarCount: number;
 fallbackLessonId?: string;
};
