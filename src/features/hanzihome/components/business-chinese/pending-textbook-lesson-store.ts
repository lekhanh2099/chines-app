"use client";

import { createStore, useSelector } from "@tanstack/react-store";

type PendingTextbookLessonState = {
 /** Id of the lesson the learner just picked, until its page has arrived. */
 lessonId: string;
};

const pendingTextbookLessonStore = createStore<PendingTextbookLessonState>({ lessonId: "" });

/**
 * Lesson content is loaded by the server, so switching lessons is a navigation.
 * The picked lesson is recorded here so the workspace can show its loading
 * state at once instead of the previous lesson.
 */
export function setPendingTextbookLesson(lessonId: string) {
 pendingTextbookLessonStore.setState(() => ({ lessonId }));
}

export function clearPendingTextbookLesson() {
 pendingTextbookLessonStore.setState(() => ({ lessonId: "" }));
}

export function usePendingTextbookLessonId() {
 return useSelector(pendingTextbookLessonStore, (state) => state.lessonId);
}
