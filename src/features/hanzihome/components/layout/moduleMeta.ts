import {
 BookOpen,
 FileText,
 ListChecks,
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
 icon: LucideIcon;
};

export const moduleMeta = {
 overview: { key: "overview", icon: Home },
 lessonText: { key: "lessonText", icon: FileText },
 practice: { key: "practice", icon: ListChecks },
 listening: { key: "listening", icon: Headphones },
 dictation: { key: "dictation", icon: Keyboard },
 script: { key: "script", icon: ScrollText },
 notes: { key: "notes", icon: NotebookPen },
 vocab: { key: "vocab", icon: BookOpen },
 grammar: { key: "grammar", icon: GraduationCap },
 review: { key: "review", icon: RotateCcw },
} satisfies Record<StudyModule, ModuleMeta>;

const standardModuleKeys = [
 "overview",
 "lessonText",
 "notes",
 "vocab",
 "grammar",
 "review",
 "practice",
] satisfies readonly StudyModule[];

const listeningModuleKeys = ["listening", "dictation"] satisfies readonly StudyModule[];

export function tabsForLesson(
 lesson: HanziHomeLesson,
 labelForModule: (key: StudyModule) => string,
) {
 const keys = lesson.tags?.includes("listening") ? listeningModuleKeys : standardModuleKeys;
 return keys.map((key) => ({
  ...moduleMeta[key],
  label: labelForModule(key),
 })) satisfies HanziHomeStudyTab<StudyModule>[];
}
