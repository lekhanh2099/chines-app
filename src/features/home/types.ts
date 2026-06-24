import type { HanziHomeModule } from "@/features/hanzihome/types";
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

export type HomeDashboardModel = {
 lesson: HomeLessonTarget | null;
 recentNotes: NoteListItem[];
 isLoading: boolean;
};
