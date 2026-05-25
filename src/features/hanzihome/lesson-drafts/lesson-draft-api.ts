import { z } from "zod";

import {
  createLessonDraftRequestSchema,
  lessonDraftContentSchema,
  lessonDraftStatusSchema,
  updateLessonDraftRequestSchema,
  type CreateLessonDraftRequest,
  type LessonDraft,
  type UpdateLessonDraftRequest,
} from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";

const lessonDraftSchema = z.object({
  id: z.string(),
  userId: z.string(),
  lessonKey: z.string(),
  status: lessonDraftStatusSchema,
  titleZh: z.string(),
  titleVi: z.string().optional(),
  lessonNumber: z.number().optional(),
  content: lessonDraftContentSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const lessonDraftListResponseSchema = z.object({
  drafts: z.array(lessonDraftSchema),
});

const lessonDraftResponseSchema = z.object({
  draft: lessonDraftSchema,
});

const seedLessonDraftResponseSchema = z.object({
  draft: lessonDraftSchema,
  reused: z.boolean(),
});

const deleteLessonDraftResponseSchema = z.object({
  ok: z.literal(true),
});

const apiErrorResponseSchema = z.object({
  error: z.string(),
});

async function parseApiError(response: Response) {
  const json: unknown = await response.json().catch(() => null);
  const parsed = apiErrorResponseSchema.safeParse(json);

  if (parsed.success) {
    return parsed.data.error;
  }

  return `Request failed with status ${response.status}`;
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  parse: (json: unknown) => T,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json: unknown = await response.json();
  return parse(json);
}

export const lessonDraftQueryKeys = {
  all: ["hanzihome", "lesson-drafts"] as const,
  lists: () => [...lessonDraftQueryKeys.all, "list"] as const,
  detail: (draftId: string) =>
    [...lessonDraftQueryKeys.all, "detail", draftId] as const,
};

export async function getLessonDrafts(): Promise<LessonDraft[]> {
  return requestJson(
    "/api/hanzihome/lesson-drafts",
    { method: "GET" },
    (json) => lessonDraftListResponseSchema.parse(json).drafts,
  );
}

export async function getLessonDraft(draftId: string): Promise<LessonDraft> {
  return requestJson(
    `/api/hanzihome/lesson-drafts/${draftId}`,
    { method: "GET" },
    (json) => lessonDraftResponseSchema.parse(json).draft,
  );
}

export async function createLessonDraft(
  input: CreateLessonDraftRequest,
): Promise<LessonDraft> {
  const payload = createLessonDraftRequestSchema.parse(input);

  return requestJson(
    "/api/hanzihome/lesson-drafts",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    (json) => lessonDraftResponseSchema.parse(json).draft,
  );
}

export async function createLessonDraftFromSeed(
  lessonId: string,
): Promise<{ draft: LessonDraft; reused: boolean }> {
  const payload = z.object({ lessonId: z.string().trim().min(1) }).parse({
    lessonId,
  });

  return requestJson(
    "/api/hanzihome/lesson-drafts/from-seed",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    (json) => seedLessonDraftResponseSchema.parse(json),
  );
}

export async function updateLessonDraft(
  draftId: string,
  input: UpdateLessonDraftRequest,
): Promise<LessonDraft> {
  const payload = updateLessonDraftRequestSchema.parse(input);

  return requestJson(
    `/api/hanzihome/lesson-drafts/${draftId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    (json) => lessonDraftResponseSchema.parse(json).draft,
  );
}

export async function deleteLessonDraft(draftId: string): Promise<void> {
  await requestJson(
    `/api/hanzihome/lesson-drafts/${draftId}`,
    {
      method: "DELETE",
    },
    (json) => deleteLessonDraftResponseSchema.parse(json),
  );
}
