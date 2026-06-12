"use client";

import { useMemo, type ReactNode } from "react";

import { useDraftPatchedLesson } from "@/features/hanzihome/editing";
import { useHanziHomeSearchNavigationIntent } from "@/features/hanzihome/search/searchNavigationStore";
import type {
 HanziHomeLesson,
 LearningStatus,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";

import { createHanziHomeFeatureStore } from "./hanzihomeFeatureStore";
import { HanziHomeFeatureStoreProvider } from "./hanzihomeFeatureContext";
import { createHanziHomeFeatureActions } from "./actions";
import { createHanziHomeFeatureServices } from "./services";
import type { StudyModule } from "./types";

export function HanziHomeFeatureProvider({
 lesson,
 learningState,
 activeModule,
 onSelectModule,
 onBookmarkVocab,
 onMarkVocab,
 onBookmarkGrammar,
 onMarkGrammar,
 onAnswerReview,
 children,
}: {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 activeModule: StudyModule;
 onSelectModule: (module: StudyModule) => void;
 onBookmarkVocab: (id: string) => void;
 onMarkVocab: (id: string, status: LearningStatus) => void;
 onBookmarkGrammar: (id: string) => void;
 onMarkGrammar: (id: string, status: LearningStatus) => void;
 onAnswerReview: (
  item: { type: "vocab" | "grammar" | "radical"; id: string },
  result: ReviewResult,
 ) => void;
 children: ReactNode;
}) {
 const patchedLesson = useDraftPatchedLesson(lesson);
 const searchIntent = useHanziHomeSearchNavigationIntent();
 const matchingIntent = searchIntent?.lessonId === lesson.id ? searchIntent : null;
 const store = useMemo(
  () =>
   createHanziHomeFeatureStore({
    vocabSelectedWordId:
     matchingIntent?.module === "vocab" ? (matchingIntent.targetId ?? null) : null,
    grammarSelectedPointId:
     matchingIntent?.module === "grammar" ? (matchingIntent.targetId ?? null) : null,
    lessonTextSelectedSectionId:
     matchingIntent?.module === "lessonText"
      ? (matchingIntent.targetId ?? "__all_lesson_sections__")
      : "__all_lesson_sections__",
   }),
  [matchingIntent?.module, matchingIntent?.targetId],
 );
 const actions = useMemo(() => createHanziHomeFeatureActions(store), [store]);
 const services = useMemo(() => createHanziHomeFeatureServices(lesson), [lesson]);
 const runtime = useMemo(
  () => ({
   originalLesson: lesson,
   lesson: patchedLesson,
   learningState,
   activeModule,
   selectModule: onSelectModule,
   bookmarkVocab: onBookmarkVocab,
   markVocab: onMarkVocab,
   bookmarkGrammar: onBookmarkGrammar,
   markGrammar: onMarkGrammar,
   answerReview: onAnswerReview,
  }),
  [
   activeModule,
   learningState,
   lesson,
   onAnswerReview,
   onBookmarkGrammar,
   onBookmarkVocab,
   onMarkGrammar,
   onMarkVocab,
   onSelectModule,
   patchedLesson,
  ],
 );
 const value = useMemo(
  () => ({ store, actions, services, runtime }),
  [actions, runtime, services, store],
 );

 return <HanziHomeFeatureStoreProvider value={value}>{children}</HanziHomeFeatureStoreProvider>;
}
