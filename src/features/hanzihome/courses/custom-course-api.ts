import {
  createHanziHomeCourseBookRequestSchema,
  createHanziHomeCourseRequestSchema,
  hanziHomeCourseBookSchema,
  hanziHomeCourseCatalogResponseSchema,
  hanziHomeCourseSchema,
  type CreateHanziHomeCourseBookRequest,
  type CreateHanziHomeCourseRequest,
} from "@/features/hanzihome/courses/course.schema";

const createHanziHomeCourseResponseSchema = {
  parse(json: unknown) {
    return {
      course: hanziHomeCourseSchema.parse(
        (json as { course?: unknown }).course,
      ),
      book: hanziHomeCourseBookSchema.parse((json as { book?: unknown }).book),
    };
  },
};

const createHanziHomeCourseBookResponseSchema = {
  parse(json: unknown) {
    return {
      book: hanziHomeCourseBookSchema.parse(
        (json as { book?: unknown }).book,
      ),
    };
  },
};

const apiErrorResponseSchema = {
  safeParse(json: unknown) {
    if (
      json &&
      typeof json === "object" &&
      "error" in json &&
      typeof (json as { error?: unknown }).error === "string"
    ) {
      return {
        success: true as const,
        data: {
          error: (json as { error: string }).error,
        },
      };
    }

    return {
      success: false as const,
    };
  },
};

async function parseApiError(response: Response) {
  const json: unknown = await response.json().catch(() => null);
  const parsed = apiErrorResponseSchema.safeParse(json);

  if (parsed.success) return parsed.data.error;

  return `Request failed with status ${response.status}`;
}

export async function getCustomHanziHomeCourseCatalog() {
  const response = await fetch("/api/hanzihome/courses", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json: unknown = await response.json();

  return hanziHomeCourseCatalogResponseSchema.parse(json);
}

export async function createCustomHanziHomeCourse(
  input: CreateHanziHomeCourseRequest,
) {
  const payload = createHanziHomeCourseRequestSchema.parse(input);

  const response = await fetch("/api/hanzihome/courses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json: unknown = await response.json();

  return createHanziHomeCourseResponseSchema.parse(json);
}

export async function createCustomHanziHomeCourseBook(
  input: CreateHanziHomeCourseBookRequest,
) {
  const payload = createHanziHomeCourseBookRequestSchema.parse(input);

  const response = await fetch("/api/hanzihome/course-books", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json: unknown = await response.json();

  return createHanziHomeCourseBookResponseSchema.parse(json);
}

export async function forkSeedHanziHomeCourse(courseId: string) {
 const response = await fetch(`/api/hanzihome/seed/courses/${courseId}/fork`, {
  method: "POST",
 });

 if (!response.ok) {
  throw new Error(await parseApiError(response));
 }

 const json: unknown = await response.json();

 if (!json || typeof json !== "object") {
  throw new Error("Invalid fork seed course response");
 }

 return json as {
  courseId: string;
  lessonId: string | null;
  reused: boolean;
 };
}
