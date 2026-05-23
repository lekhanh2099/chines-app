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
  bookId: z.string().trim().min(1, "Vui lòng chọn quyển/sách"),
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
  const initialBookId =
    selectedBookId ||
    books.find((book) => book.courseId === initialCourseId)?.id ||
    books[0]?.id ||
    "";

  const form = useAppForm({
    defaultValues: {
      courseId: initialCourseId,
      bookId: initialBookId,
      lessonNumber: String(suggestedLessonNumber),
      titleZh: "",
      titleVi: "",
    } satisfies CreateLessonDraftFormValues,
    validators: {
      onSubmit: createLessonDraftFormSchema,
    },
    onSubmit: async ({ value }) => {
      const course = courses.find((item) => item.id === value.courseId);
      const book = books.find((item) => item.id === value.bookId);

      const draft = await createMutation.mutateAsync({
        lessonNumber: Number(value.lessonNumber),
        lessonOrder: Number(value.lessonNumber),
        titleZh: value.titleZh.trim(),
        titleVi: value.titleVi.trim() || undefined,
        courseId: course?.id,
        courseTitle: course?.title,
        bookId: book?.id,
        bookTitle: book?.title,
        bookOrder: book?.order,
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

  const bookOptions: IOption[] = useMemo(
    () =>
      books
        .filter((book) => book.courseId === currentCourseId)
        .map((book) => ({
          value: book.id,
          label: book.title,
        })),
    [books, currentCourseId],
  );

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
                    form.setFieldValue("bookId", firstBook?.id || "");
                  }}
                />
              </label>
            );
          }}
        </form.AppField>

        <form.AppField name="bookId">
          {(field) => {
            const selectedOption =
              bookOptions.find((option) => option.value === field.state.value) ??
              null;

            return (
              <label className="grid gap-2">
                <span className="text-sm font-bold text-text-primary">
                  Quyển / sách
                </span>

                <Select
                  options={bookOptions}
                  selectValue={selectedOption}
                  triggerPlaceholder="Chọn quyển"
                  disabled={createMutation.isPending || bookOptions.length === 0}
                  onChange={(option: IOption | null) => {
                    field.handleChange(option?.value ? String(option.value) : "");
                  }}
                />
              </label>
            );
          }}
        </form.AppField>
      </div>

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
