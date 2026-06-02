import {
 BookOpen,
 GraduationCap,
 ListChecks,
 MessageSquareText,
 NotebookText,
 PenLine,
 ScrollText,
 Tags,
} from "lucide-react";

import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

export const sectionIcons: Partial<Record<Section["type"], typeof BookOpen>> = {
 text: BookOpen,
 vocabulary: Tags,
 proper_nouns: Tags,
 notes: NotebookText,
 grammar: GraduationCap,
 exercises: ListChecks,
 communication: MessageSquareText,
 reading: ScrollText,
 character_writing: PenLine,
 summary: ScrollText,
};

export { BookOpen };
