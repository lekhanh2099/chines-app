"use client";

import type {
 HanziHomeCatalogData,
 HanziHomeLesson,
 UserLearningState,
} from "@/features/hanzihome/types";
import type {
 UpdateGrammarCorePayload,
 UpdateGrammarDetailSectionPayload,
 UpdateGrammarExamplePayload,
 UpdateVocabCorePayload,
 UpdateVocabDetailSectionPayload,
 UpdateVocabExamplePayload,
} from "@/features/hanzihome/schemas/node-edit.schema";
import type {
 AggregateFilters,
 AggregateKind,
 AggregateResourceItem,
} from "./hanzihome-content-resources";

type CatalogApiResponse = {
 catalog: HanziHomeCatalogData;
};

type CourseLessonsApiResponse = {
 lessons: HanziHomeLesson[];
};

type LessonApiResponse = {
 lesson: HanziHomeLesson;
};

type AggregateApiResponse = {
 items: AggregateResourceItem[];
};

type LearningStateApiResponse = {
 state: UserLearningState;
};

async function fetchJson<T>(url: string): Promise<T> {
 const response = await fetch(url, {
  headers: {
   Accept: "application/json",
  },
 });

 if (!response.ok) {
  throw new Error(`HanziHome request failed: ${response.status}`);
 }

 return response.json() as Promise<T>;
}

async function patchJson<T>(url: string, body: unknown): Promise<T> {
 const response = await fetch(url, {
  method: "PATCH",
  headers: {
   Accept: "application/json",
   "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
 });

 if (!response.ok) {
  throw new Error(`HanziHome patch failed: ${response.status}`);
 }

 return response.json() as Promise<T>;
}

export async function fetchHanziHomeCatalog(options: {
 includeLessons?: boolean;
}): Promise<HanziHomeCatalogData> {
 const params = new URLSearchParams();

 if (options.includeLessons) {
  params.set("includeLessons", "1");
 }

 const url = params.size ? `/api/hanzihome/catalog?${params.toString()}` : "/api/hanzihome/catalog";
 const payload = await fetchJson<CatalogApiResponse>(url);

 return payload.catalog;
}

export async function fetchHanziHomeCourseLessons(courseId: string): Promise<HanziHomeLesson[]> {
 if (!courseId) return [];

 const payload = await fetchJson<CourseLessonsApiResponse>(
  `/api/hanzihome/catalog?courseId=${encodeURIComponent(courseId)}`,
 );

 return payload.lessons;
}

export async function fetchHanziHomeLessonDetail(
 lessonId: string,
): Promise<HanziHomeLesson | null> {
 if (!lessonId) return null;

 const payload = await fetchJson<LessonApiResponse>(
  `/api/hanzihome/lessons/${encodeURIComponent(lessonId)}`,
 );

 return payload.lesson;
}

export async function fetchHanziHomeAggregateItems({
 kind,
 filters,
}: {
 kind: AggregateKind;
 filters: AggregateFilters;
}): Promise<AggregateResourceItem[]> {
 const params = new URLSearchParams();

 if (filters.courseId) params.set("courseId", filters.courseId);
 if (filters.bookId) params.set("bookId", filters.bookId);
 if (filters.lessonId) params.set("lessonId", filters.lessonId);
 if (filters.q.trim()) params.set("q", filters.q.trim());

 const url = params.size
  ? `/api/hanzihome/aggregate/${kind}?${params.toString()}`
  : `/api/hanzihome/aggregate/${kind}`;
 const payload = await fetchJson<AggregateApiResponse>(url);

 return payload.items;
}

export async function fetchHanziHomeLearningState(): Promise<UserLearningState> {
 const payload = await fetchJson<LearningStateApiResponse>("/api/learning-state");

 return payload.state;
}

export async function saveHanziHomeLearningState(
 state: UserLearningState,
): Promise<UserLearningState> {
 const response = await fetch("/api/learning-state", {
  method: "PUT",
  headers: {
   Accept: "application/json",
   "Content-Type": "application/json",
  },
  body: JSON.stringify(state),
 });

 if (!response.ok) {
  throw new Error(`HanziHome learning state save failed: ${response.status}`);
 }

 const payload = (await response.json()) as LearningStateApiResponse;

 return payload.state;
}

export async function updateHanziHomeVocabCore(vocabId: string, payload: UpdateVocabCorePayload) {
 return patchJson<{ item: unknown }>(
  `/api/hanzihome/edit/vocab/${encodeURIComponent(vocabId)}/core`,
  payload,
 );
}

export async function updateHanziHomeVocabExample(
 exampleId: string,
 payload: UpdateVocabExamplePayload,
) {
 return patchJson<{ item: unknown }>(
  `/api/hanzihome/edit/vocab/examples/${encodeURIComponent(exampleId)}`,
  payload,
 );
}

export async function updateHanziHomeVocabDetailSection(
 sectionId: string,
 payload: UpdateVocabDetailSectionPayload,
) {
 return patchJson<{ item: unknown }>(
  `/api/hanzihome/edit/vocab/detail-sections/${encodeURIComponent(sectionId)}`,
  payload,
 );
}

export async function updateHanziHomeGrammarCore(
 grammarId: string,
 payload: UpdateGrammarCorePayload,
) {
 return patchJson<{ item: unknown }>(
  `/api/hanzihome/edit/grammar/${encodeURIComponent(grammarId)}/core`,
  payload,
 );
}

export async function updateHanziHomeGrammarExample(
 exampleId: string,
 payload: UpdateGrammarExamplePayload,
) {
 return patchJson<{ item: unknown }>(
  `/api/hanzihome/edit/grammar/examples/${encodeURIComponent(exampleId)}`,
  payload,
 );
}

export async function updateHanziHomeGrammarDetailSection(
 sectionId: string,
 payload: UpdateGrammarDetailSectionPayload,
) {
 return patchJson<{ item: unknown }>(
  `/api/hanzihome/edit/grammar/detail-sections/${encodeURIComponent(sectionId)}`,
  payload,
 );
}
