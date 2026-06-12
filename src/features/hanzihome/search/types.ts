import type { HanziHomeModule } from "@/features/hanzihome/types";

export type HanziHomeSearchKind =
 | "vocab"
 | "grammar"
 | "lesson_text"
 | "section"
 | "exercise"
 | "radical"
 | "note"
 | "navigation";

export type HanziHomeSearchIndexItem = {
 id: string;
 kind: HanziHomeSearchKind;
 title: string;
 subtitle?: string;
 searchText: string;
 courseId?: string;
 courseTitle?: string;
 bookId?: string;
 lessonId?: string;
 lessonNumber?: number;
 module?: HanziHomeModule;
 targetId?: string;
 href?: string;
 metadata?: Record<string, string | number | boolean | null>;
};

export type HanziHomeSearchOptions = {
 limit?: number;
 kinds?: HanziHomeSearchKind[];
 courseId?: string;
 lessonId?: string;
 includeGlobal?: boolean;
 activeLessonBoost?: boolean;
};

export type HanziHomeSearchResult = {
 item: HanziHomeSearchIndexItem;
 score: number;
};

export type HanziHomeSearchNavigationIntent = {
 id: string;
 courseId?: string;
 lessonId?: string;
 lessonNumber?: number;
 module?: HanziHomeModule;
 targetId?: string;
};
