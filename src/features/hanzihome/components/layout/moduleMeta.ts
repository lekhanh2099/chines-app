import {
 BookOpen,
 FileText,
 GraduationCap,
 Home,
 NotebookPen,
 RotateCcw,
 type LucideIcon,
} from "lucide-react";

import type { HanziHomeStudyTab } from "@/features/hanzihome/components/HanziHomeStudyTabs";
import type { StudyModule } from "@/features/hanzihome/context/types";
import { studyModules } from "@/features/hanzihome/context/workspaceLayout";

export type ModuleMeta = {
 key: StudyModule;
 label: string;
 icon: LucideIcon;
};

export const moduleMeta = {
 overview: { key: "overview", label: "Tổng quan", icon: Home },
 lessonText: { key: "lessonText", label: "Bài khóa", icon: FileText },
 notes: { key: "notes", label: "Ghi chú", icon: NotebookPen },
 vocab: { key: "vocab", label: "Từ vựng", icon: BookOpen },
 grammar: { key: "grammar", label: "Ngữ pháp", icon: GraduationCap },
 review: { key: "review", label: "Ôn tập", icon: RotateCcw },
} satisfies Record<StudyModule, ModuleMeta>;

export const flatTabs = studyModules.map(
 (key) => moduleMeta[key],
) satisfies HanziHomeStudyTab<StudyModule>[];
