"use client";

import { LessonNoteAccessCard } from "@/features/hanzihome/components/LessonNoteAccessCard";
import type {
 HanziHomeLesson,
 HanziHomeModule,
 UserLearningState,
} from "@/features/hanzihome/types";

type LessonOverviewProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 onOpenModule: (module: HanziHomeModule) => void;
};
export function LessonOverview({ lesson }: LessonOverviewProps) {
 return (
  <div className="grid gap-3">
   <LessonNoteAccessCard lesson={lesson} />
  </div>
 );
}
