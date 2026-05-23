"use client";

import { toast } from "sonner";

import { useAppForm } from "@/components/form";
import { useUpdateLessonDraftMutation } from "@/features/hanzihome/lesson-drafts";
import type { LessonDraft } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import {
  lessonDraftMetadataFormSchema,
  toLessonDraftMetadataFormValues,
} from "@/features/hanzihome/lesson-drafts/utils/lesson-draft-form";

type LessonDraftMetadataFormProps = {
  draft: LessonDraft;
};

export function LessonDraftMetadataForm({ draft }: LessonDraftMetadataFormProps) {
  const updateMutation = useUpdateLessonDraftMutation();

  const form = useAppForm({
    defaultValues: toLessonDraftMetadataFormValues(draft),
    validators: {
      onSubmit: lessonDraftMetadataFormSchema,
    },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync({
        draftId: draft.id,
        input: {
          lessonNumber: Number(value.lessonNumber),
          titleZh: value.titleZh.trim(),
          titleVi: value.titleVi.trim() || undefined,
        },
      });

      toast.success("Đã lưu thông tin bài");
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
        <form.AppField name="lessonNumber">
          {(field) => (
            <field.TextField
              label="Số bài"
              placeholder="26"
              inputMode="numeric"
              required
              disabled={updateMutation.isPending}
            />
          )}
        </form.AppField>

        <form.AppField name="titleZh">
          {(field) => (
            <field.TextField
              label="Tên bài tiếng Trung"
              placeholder="例如：我想创建一个新课"
              required
              disabled={updateMutation.isPending}
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name="titleVi">
        {(field) => (
          <field.TextField
            label="Tên bài tiếng Việt"
            placeholder="Ví dụ: Tôi muốn tạo một bài mới"
            disabled={updateMutation.isPending}
          />
        )}
      </form.AppField>

      {updateMutation.error && (
        <p role="alert" className="text-sm font-bold text-destructive">
          {updateMutation.error.message}
        </p>
      )}

      <form.AppForm>
        <form.Actions
          submitLabel="Lưu thông tin bài"
          disabled={updateMutation.isPending}
        />
      </form.AppForm>
    </form>
  );
}
