"use client";

import { z } from "zod";
import { JsonValueSchema, type JsonFieldValue } from "@/types/json";

import {
 aggregateApiResponseSchema,
 catalogApiResponseSchema,
 courseLessonsApiResponseSchema,
 learningStateApiResponseSchema,
 lessonApiResponseSchema,
 lessonVocabularyApiResponseSchema,
} from "@/features/hanzihome/hanzihome-api.schemas";
import type {
 HanziHomeCatalogData,
 HanziHomeLesson,
 UserLearningState,
} from "@/features/hanzihome/types";
import type {
 AggregateFilters,
 AggregateKind,
 AggregateResourceItem,
} from "./hanzihome-content-resources";

type Nullable<T> = T | null;

export class HanziHomeApiError extends Error {
 constructor(
  message: string,
  readonly status: number,
  readonly details?: JsonFieldValue,
 ) {
  super(message);
  this.name = "HanziHomeApiError";
 }
}

async function parseJsonResponse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
 const payload = JsonValueSchema.parse(await response.json().catch(() => null));

 if (!response.ok) {
  throw new HanziHomeApiError(
   `HanziHome request failed: ${response.status}`,
   response.status,
   payload,
  );
 }

 const parsed = schema.safeParse(payload);
 if (!parsed.success) {
  throw new HanziHomeApiError(
   "HanziHome response did not match the expected contract",
   response.status,
   JsonValueSchema.parse(z.flattenError(parsed.error)),
  );
 }

 return parsed.data;
}

async function fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
 const response = await fetch(url, {
  cache: "no-store",
  headers: {
   Accept: "application/json",
  },
 });

 return parseJsonResponse(response, schema);
}

export async function fetchHanziHomeCatalog(options: {
 includeLessons?: boolean;
 includeRadicals?: boolean;
}): Promise<HanziHomeCatalogData> {
 const params = new URLSearchParams();

 if (options.includeLessons) {
  params.set("includeLessons", "1");
 }
 if (options.includeRadicals) {
  params.set("includeRadicals", "1");
 }

 const url = params.size ? `/api/hanzihome/catalog?${params.toString()}` : "/api/hanzihome/catalog";
 const payload = await fetchJson(url, catalogApiResponseSchema);

 return payload.catalog;
}

export async function fetchHanziHomeCourseLessons(courseId: string): Promise<HanziHomeLesson[]> {
 if (!courseId) return [];

 const payload = await fetchJson(
  `/api/hanzihome/catalog?courseId=${encodeURIComponent(courseId)}`,
  courseLessonsApiResponseSchema,
 );

 return payload.lessons;
}

export async function fetchHanziHomeLessonDetail(
 lessonId: string,
): Promise<Nullable<z.output<typeof lessonApiResponseSchema>["lesson"]>> {
 if (!lessonId) return null;

 const payload = await fetchJson(
  `/api/hanzihome/lessons/${encodeURIComponent(lessonId)}`,
  lessonApiResponseSchema,
 );

 return payload.lesson;
}

export async function fetchHanziHomeLessonVocabulary(
 lessonId: string,
): Promise<Nullable<z.output<typeof lessonVocabularyApiResponseSchema>["resource"]>> {
 if (!lessonId) return null;
 const payload = await fetchJson(
  `/api/hanzihome/lessons/${encodeURIComponent(lessonId)}/vocabulary`,
  lessonVocabularyApiResponseSchema,
 );
 return payload.resource;
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
 const payload = await fetchJson(url, aggregateApiResponseSchema);

 return payload.items;
}

export async function fetchHanziHomeLearningState(): Promise<UserLearningState> {
 const payload = await fetchJson("/api/learning-state", learningStateApiResponseSchema);

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

 const payload = await parseJsonResponse(response, learningStateApiResponseSchema);

 return payload.state;
}
