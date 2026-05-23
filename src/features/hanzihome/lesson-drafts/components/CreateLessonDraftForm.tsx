"use client";

import { useMemo } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { useAppForm } from "@/components/form";
import Select from "@/components/ui/select/index";
import {
  useCreateLessonDraftMutation,
  type LessonDraft,
} from "@/features/hanzihome/lesson-drafts";
import type {
  HanziHomeCourse,
  HanziHomeCourseBook,
} from "@/features/hanzihome/types";
import type { IOption } from "@/types/option";

const createLessonDraftFormSchema = z.object({
  courseId: z.string().trim().min(1, "Vui lòng chọn course"),
  bookTitle: z.string().trim().min(1, "Vui lòng nhập quyển/sách"),
  lessonNumber: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập số bài")
    .refine((value) => {
      const numberValue = Number(value);
      return Number.isInteger(numberValue) && numberValue > 0;
    }, "Số bài phải là số nguyên dương"),
  titleZh: z.string().trim().min(1, "Vui lòng nhập tên bài tiếng Trung"),
  titleVi: z.string().trim(),
});

type CreateLessonDraftFormValues = z.infer<typeof createLessonDraftFormSchema>;

type CreateLessonDraftFormProps = {
  suggestedLessonNumber: number;
  courses: HanziHomeCourse[];
  books: HanziHomeCourseBook[];
  selectedCourseId: string;
  selectedBookId?: string;
  onCreated?: (draft: LessonDraft) => void;
};

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return slug || "book";
}

function createDraftBookId(courseId: string, bookTitle: string) {
  return `${courseId}-${slugify(bookTitle)}`;
}

export function CreateLessonDraftForm({
  suggestedLessonNumber,
  courses,
  books,
  selectedCourseId,
  selectedBookId,
  onCreated,
}: CreateLessonDraftFormProps) {
  const createMutation = useCreateLessonDraftMutation();

  const fallbackCourse = courses[0];
  const initialCourseId = selectedCourseId || fallbackCourse?.id || "";
  const initialBook =
    books.find((book) => book.id === selectedBookId) ||
    books.find((book) => book.courseId === initialCourseId);

  const form = useAppForm({
    defaultValues: {
      courseId: initialCourseId,
      bookTitle: initialBook?.title || "",
      lessonNumber: String(suggestedLessonNumber),
      titleZh: "",
      titleVi: "",
    } satisfies CreateLessonDraftFormValues,
    validators: {
      onSubmit: createLessonDraftFormSchema,
    },
    onSubmit: async ({ value }) => {
      const course = courses.find((item) => item.id === value.courseId);
      const normalizedBookTitle = value.bookTitle.trim();

      const existingBook = books.find(
        (book) =>
          book.courseId === value.courseId &&
          book.title.trim().toLowerCase() === normalizedBookTitle.toLowerCase(),
      );

      const courseBooks = books.filter((book) => book.courseId === value.courseId);
      const nextBookOrder =
        courseBooks.length > 0
          ? Math.max(...courseBooks.map((book) => book.order)) + 1
          : 1;

      const draft = await createMutation.mutateAsync({
        lessonNumber: Number(value.lessonNumber),
        lessonOrder: Number(value.lessonNumber),
        titleZh: value.titleZh.trim(),
        titleVi: value.titleVi.trim() || undefined,
        courseId: course?.id,
        courseTitle: course?.title,
        bookId:
          existingBook?.id || createDraftBookId(value.courseId, normalizedBookTitle),
        bookTitle: existingBook?.title || normalizedBookTitle,
        bookOrder: existingBook?.order ?? nextBookOrder,
      });

      toast.success(`Đã tạo nháp: ${draft.titleZh}`);
      form.reset();
      onCreated?.(draft);
    },
  });

  const currentCourseId = form.state.values.courseId;

  const courseOptions: IOption[] = useMemo(
    () =>
      courses.map((course) => ({
        value: course.id,
        label: course.title,
      })),
    [courses],
  );

  const currentCourseBooks = useMemo(
    () => books.filter((book) => book.courseId === currentCourseId),
    [books, currentCourseId],
  );

  const bookSuggestionsId = `book-suggestions-${currentCourseId || "default"}`;

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <form.AppField name="courseId">
          {(field) => {
            const selectedOption =
              courseOptions.find((option) => option.value === field.state.value) ??
              null;

            return (
              <label className="grid gap-2">
                <span className="text-sm font-bold text-text-primary">
                  Course
                </span>

                <Select
                  options={courseOptions}
                  selectValue={selectedOption}
                  triggerPlaceholder="Chọn course"
                  disabled={createMutation.isPending}
                  onChange={(option: IOption | null) => {
                    const nextCourseId = option?.value ? String(option.value) : "";
                    const firstBook = books.find(
                      (book) => book.courseId === nextCourseId,
                    );

                    field.handleChange(nextCourseId);
                    form.setFieldValue("bookTitle", firstBook?.title || "");
                  }}
                />
              </label>
            );
          }}
        </form.AppField>

        <form.AppField name="bookTitle">
          {(field) => (
            <field.TextField
              label="Quyển / sách"
              placeholder="Ví dụ: HSK 4 - Bài học chính"
              required
              disabled={createMutation.isPending}
              list={bookSuggestionsId}
            />
          )}
        </form.AppField>
      </div>

      <datalist id={bookSuggestionsId}>
        {currentCourseBooks.map((book) => (
          <option key={book.id} value={book.title} />
        ))}
      </datalist>

      <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <form.AppField name="lessonNumber">
          {(field) => (
            <field.TextField
              label="Số bài"
              placeholder="26"
              inputMode="numeric"
              required
              disabled={createMutation.isPending}
            />
          )}
        </form.AppField>

        <form.AppField name="titleZh">
          {(field) => (
            <field.TextField
              label="Tên bài tiếng Trung"
              placeholder="例如：我想创建一个新课"
              required
              disabled={createMutation.isPending}
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name="titleVi">
        {(field) => (
          <field.TextField
            label="Tên bài tiếng Việt"
            placeholder="Ví dụ: Tôi muốn tạo một bài mới"
            disabled={createMutation.isPending}
          />
        )}
      </form.AppField>

      {createMutation.error && (
        <p role="alert" className="text-sm font-bold text-destructive">
          {createMutation.error.message}
        </p>
      )}

      <form.AppForm>
        <form.Actions
          submitLabel="Tạo bài nháp"
          disabled={createMutation.isPending}
        />
      </form.AppForm>
    </form>
  );
}
