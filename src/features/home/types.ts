import type { ReviewResult, UserLearningState } from "@/features/hanzihome/types";
import type { NoteListItem } from "@/services/notes/notes.service";

export type HomeLessonTarget = {
 href: string;
 title: string;
 titleZh: string;
 courseTitle: string;
 lessonNumber: number;
 module: NonNullable<UserLearningState["settings"]["bookResume"]>[string]["module"];
 isRecent: boolean;
};

export type HomeCourseGroup = {
 id: string;
 title: string;
 books: { id: string; title: string; lesson: HomeLessonTarget | null }[];
};

/** One library book with its resume (or start) target; `id` is the `bookResume` key. */
export type HomeResumeBook = HomeCourseGroup["books"][number];

type HomeLearningPulse = {
 trackedCount: number;
 reviewCount: number;
 knownCount: number;
 reviewedTodayCount: number;
 bookmarkedCount: number;
 srsDueCount: number;
 learningLoopDueCount: number;
 readerCompletedCount: number;
 readerDocumentCount: number;
 overviewAvailable: boolean;
 overviewLoading: boolean;
 overviewUnavailable: boolean;
 reviewedTodayAvailable: boolean;
 reviewedTodayLoading: boolean;
 reviewedTodayUnavailable: boolean;
};

export type HomeRecentActivityItem = {
 key: string;
 label: string;
 kindLabel: string;
 result: ReviewResult;
 answeredAt: string;
};

export type HomeDashboardModel = {
 courses: HomeCourseGroup[];
 /** Books being studied, most recent first (see `buildHomeResumeBooks`). */
 resumeBooks: HomeResumeBook[];
 catalogUnavailable: boolean;
 learningPulse: HomeLearningPulse;
 recentActivity: HomeRecentActivityItem[];
 recentActivityLoading: boolean;
 recentActivityUnavailable: boolean;
 retryRecentActivity: () => void;
 retryLearningOverview: () => void;
 retryReviewedToday: () => void;
 recentNotes: NoteListItem[];
 recentNotesLoading: boolean;
 recentNotesUnavailable: boolean;
 retryRecentNotes: () => void;
 isLoading: boolean;
};
