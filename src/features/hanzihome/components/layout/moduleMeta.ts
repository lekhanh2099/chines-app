import {
 BookOpen,
 FileText,
 GraduationCap,
 Headphones,
 Home,
 Keyboard,
 NotebookPen,
 RotateCcw,
 ScrollText,
 type LucideIcon,
} from "lucide-react";

import type { HanziHomeStudyTab } from "@/features/hanzihome/components/HanziHomeStudyTabs";
import type { StudyModule } from "@/features/hanzihome/context/types";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

export type ModuleMeta = {
 key: StudyModule;
 label: string;
 icon: LucideIcon;
};

export const moduleMeta = {
 overview: { key: "overview", label: "Tổng quan", icon: Home },
 lessonText: { key: "lessonText", label: "Bài khóa", icon: FileText },
 listening: { key: "listening", label: "Luyện nghe", icon: Headphones },
 dictation: { key: "dictation", label: "Nghe chép", icon: Keyboard },
 script: { key: "script", label: "Script", icon: ScrollText },
 notes: { key: "notes", label: "Ghi chú", icon: NotebookPen },
 vocab: { key: "vocab", label: "Từ vựng", icon: BookOpen },
 grammar: { key: "grammar", label: "Ngữ pháp", icon: GraduationCap },
 review: { key: "review", label: "Ôn tập", icon: RotateCcw },
} satisfies Record<StudyModule, ModuleMeta>;

const standardModuleKeys = [
 "overview",
 "lessonText",
 "notes",
 "vocab",
 "grammar",
 "review",
] as const satisfies readonly StudyModule[];

const listeningModuleKeys = ["listening", "dictation"] as const satisfies readonly StudyModule[];

export function tabsForLesson(lesson: HanziHomeLesson) {
 const keys = lesson.tags?.includes("listening") ? listeningModuleKeys : standardModuleKeys;
 return keys.map((key) => moduleMeta[key]) satisfies HanziHomeStudyTab<StudyModule>[];
}
