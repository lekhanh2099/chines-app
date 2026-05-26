"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateHanziHomeLessonPayloadSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import { useUpdateHanziHomeLesson } from "@/features/hanzihome/hooks/useUpdateHanziHomeLesson";
import type { HanziHomeLesson } from "@/features/hanzihome/types";

const lessonEditFormSchema = z.object({
  lessonNumber: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập số bài")
    .refine((value) => {
      const numberValue = Number(value);
      return Number.isInteger(numberValue) && numberValue > 0;
    }, "Số bài phải là số nguyên dương"),
  lessonOrder: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập thứ tự bài")
    .refine((value) => {
      const numberValue = Number(value);
      return Number.isInteger(numberValue) && numberValue > 0;
    }, "Thứ tự bài phải là số nguyên dương"),
  titleZh: z.string().trim().min(1, "Vui lòng nhập tên bài tiếng Trung"),
  titleVi: z.string().trim(),
});

type LessonEditFormValues = z.infer<typeof lessonEditFormSchema>;

function toLessonEditFormValues(lesson: HanziHomeLesson): LessonEditFormValues {
  return {
    lessonNumber: String(lesson.lessonNumber),
    lessonOrder: String(lesson.lessonOrder ?? lesson.lessonNumber),
    titleZh: lesson.titleZh,
    titleVi: lesson.titleVi ?? "",
  };
}

type LessonEditDialogProps = {
  lesson: HanziHomeLesson;
  onOpenGrammar: () => void;
  onOpenVocab: () => void;
};

export function LessonEditDialog({
  lesson,
  onOpenGrammar,
  onOpenVocab,
}: LessonEditDialogProps) {
  const [open, setOpen] = useState(false);
  const updateMutation = useUpdateHanziHomeLesson();
  const form = useAppForm({
    defaultValues: toLessonEditFormValues(lesson),
    validators: {
      onSubmit: lessonEditFormSchema,
    },
    onSubmit: async ({ value }) => {
      const payload = updateHanziHomeLessonPayloadSchema.parse({
        lessonNumber: Number(value.lessonNumber),
        lessonOrder: Number(value.lessonOrder),
        titleZh: value.titleZh,
        titleVi: value.titleVi || undefined,
      });

      try {
        await updateMutation.mutateAsync({
          lessonId: lesson.id,
          payload,
        });
        toast.success("Đã lưu bài học");
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Không lưu được bài học",
        );
      }
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          form.reset(toLessonEditFormValues(lesson));
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Pencil className="h-4 w-4" />
          Sửa thông tin
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg rounded-xl">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Sửa thông tin bài học</DialogTitle>
            <DialogDescription>
              Sửa metadata của lesson canonical. Từ vựng và ngữ pháp sửa trong
              từng tab tương ứng.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="gap-4">
            <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
              <p className="text-sm font-bold text-text-primary">
                Sửa nội dung bài
              </p>
              <p className="text-xs font-semibold text-text-muted">
                Metadata ở form này. Data học nằm trong tab Từ vựng và Ngữ pháp.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    onOpenVocab();
                  }}
                >
                  Sửa từ vựng
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    onOpenGrammar();
                  }}
                >
                  Sửa ngữ pháp
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <form.AppField name="lessonNumber">
                {(field) => (
                  <field.TextField
                    label="Số bài"
                    inputMode="numeric"
                    required
                    disabled={updateMutation.isPending}
                  />
                )}
              </form.AppField>

              <form.AppField name="lessonOrder">
                {(field) => (
                  <field.TextField
                    label="Thứ tự"
                    inputMode="numeric"
                    required
                    disabled={updateMutation.isPending}
                  />
                )}
              </form.AppField>
            </div>

            <form.AppField name="titleZh">
              {(field) => (
                <field.TextField
                  label="Tên bài tiếng Trung"
                  required
                  disabled={updateMutation.isPending}
                />
              )}
            </form.AppField>

            <form.AppField name="titleVi">
              {(field) => (
                <field.TextField
                  label="Tên bài tiếng Việt"
                  disabled={updateMutation.isPending}
                />
              )}
            </form.AppField>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={updateMutation.isPending}
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
