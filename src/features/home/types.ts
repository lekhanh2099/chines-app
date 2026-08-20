import type { HanziHomeModule, ReviewResult } from "@/features/hanzihome/types";
import type { NoteListItem } from "@/services/notes.service";

export type HomeLessonTarget = {
 href: string;
 title: string;
 titleZh: string;
 courseTitle: string;
 lessonNumber: number;
 module: HanziHomeModule;
 isRecent: boolean;
};

export type HomeLearningPulse = {
 trackedCount: number;
 reviewCount: number;
 knownCount: number;
 reviewedTodayCount: number;
 bookmarkedCount: number;
 srsDueCount: number;
 learningLoopDueCount: number;
 readerCompletedCount: number;
 readerDocumentCount: number;
 overviewUnavailable: boolean;
};

export type HomeRecentActivityItem = {
 key: string;
 label: string;
 kindLabel: string;
 result: ReviewResult;
 answeredAt: string;
};

export type HomeDashboardModel = {
 lesson: HomeLessonTarget | null;
 learningPulse: HomeLearningPulse;
 recentActivity: HomeRecentActivityItem[];
 recentNotes: NoteListItem[];
 isLoading: boolean;
};
