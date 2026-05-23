"use client";

import { z } from "zod";
import { toast } from "sonner";

import { useAppForm } from "@/components/form";
import { useCreateLessonDraftMutation } from "@/features/hanzihome/lesson-drafts";

const createLessonDraftFormSchema = z.object({
  lessonNumber: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập số bài")
    .refine((value) => {
      const numberValue = Number(value);
      return Number.isInteger(numberValue) && numberValue > 0;
    }, "Số bài phải là số nguyên dương"),
  titleZh: z.string().trim().min(1, "Vui lòng nhập tên bài tiếng Trung"),
  titleVi: z.string().trim().optional(),
});

type CreateLessonDraftFormValues = z.infer<typeof createLessonDraftFormSchema>;

type CreateLessonDraftFormProps = {
  suggestedLessonNumber: number;
  onCreated?: () => void;
};

export function CreateLessonDraftForm({
  suggestedLessonNumber,
  onCreated,
}: CreateLessonDraftFormProps) {
  const createMutation = useCreateLessonDraftMutation();

  const defaultValues: CreateLessonDraftFormValues = {
    lessonNumber: String(suggestedLessonNumber),
    titleZh: "",
    titleVi: "",
  };

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: createLessonDraftFormSchema,
    },
    onSubmit: async ({ value }) => {
      const draft = await createMutation.mutateAsync({
        lessonNumber: Number(value.lessonNumber),
        titleZh: value.titleZh.trim(),
        titleVi: value.titleVi?.trim() || undefined,
      });

      toast.success(`Đã tạo nháp: ${draft.titleZh}`);
      form.reset();
      onCreated?.();
    },
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <form.AppField
          name="lessonNumber"
          children={(field) => (
            <field.TextField
              label="Số bài"
              placeholder="26"
              inputMode="numeric"
              required
              disabled={createMutation.isPending}
            />
          )}
        />

        <form.AppField
          name="titleZh"
          children={(field) => (
            <field.TextField
              label="Tên bài tiếng Trung"
              placeholder="例如：我想创建一个新课"
              required
              disabled={createMutation.isPending}
            />
          )}
        />
      </div>

      <form.AppField
        name="titleVi"
        children={(field) => (
          <field.TextField
            label="Tên bài tiếng Việt"
            placeholder="Ví dụ: Tôi muốn tạo một bài mới"
            disabled={createMutation.isPending}
          />
        )}
      />

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
