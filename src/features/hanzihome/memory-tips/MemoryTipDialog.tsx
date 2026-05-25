"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
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
import {
  createMemoryTipPayloadSchema,
  memoryTipSourceTypeSchema,
  memoryTipTypeSchema,
  type CreateMemoryTipPayload,
  type MemoryTip,
  type UpdateMemoryTipPayload,
} from "./memory-tip.schema";
import {
  isDuplicateMemoryTipError,
  MemoryTipsApiError,
} from "./memory-tip-api";
import {
  useCreateMemoryTipMutation,
  useUpdateMemoryTipMutation,
} from "./useMemoryTips";

const memoryTipFormSchema = z.object({
  tipType: memoryTipTypeSchema,
  title: z.string().trim().min(1, "Vui lòng nhập tiêu đề"),
  body: z.string().trim().min(1, "Vui lòng nhập nội dung"),
  formula: z.string().trim(),
  exampleZh: z.string().trim(),
  examplePinyin: z.string().trim(),
  exampleVi: z.string().trim(),
  sourceType: memoryTipSourceTypeSchema,
  tagsText: z.string().trim(),
  isPinned: z.boolean(),
});

type MemoryTipFormValues = z.infer<typeof memoryTipFormSchema>;

type MemoryTipDialogProps = {
  trigger?: ReactNode;
  defaultValues?: Partial<CreateMemoryTipPayload>;
  tip?: MemoryTip;
  onCreated?: () => void;
  onSaved?: () => void;
};

function toTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toPayload(value: MemoryTipFormValues): CreateMemoryTipPayload {
  return createMemoryTipPayloadSchema.parse({
    tipType: value.tipType,
    title: value.title,
    body: value.body,
    formula: value.formula || undefined,
    exampleZh: value.exampleZh || undefined,
    examplePinyin: value.examplePinyin || undefined,
    exampleVi: value.exampleVi || undefined,
    sourceType: value.sourceType,
    tags: toTags(value.tagsText),
    isPinned: value.isPinned,
  });
}

function toUpdatePayload(value: MemoryTipFormValues): UpdateMemoryTipPayload {
  return {
    tipType: value.tipType,
    title: value.title,
    body: value.body,
    formula: value.formula || undefined,
    exampleZh: value.exampleZh || undefined,
    examplePinyin: value.examplePinyin || undefined,
    exampleVi: value.exampleVi || undefined,
    sourceType: value.sourceType,
    tags: toTags(value.tagsText),
    isPinned: value.isPinned,
  };
}

function getDefaultValues(
  defaultValues?: Partial<CreateMemoryTipPayload> | MemoryTip,
): MemoryTipFormValues {
  return {
    tipType: defaultValues?.tipType ?? "custom",
    title: defaultValues?.title ?? "",
    body: defaultValues?.body ?? "",
    formula: defaultValues?.formula ?? "",
    exampleZh: defaultValues?.exampleZh ?? "",
    examplePinyin: defaultValues?.examplePinyin ?? "",
    exampleVi: defaultValues?.exampleVi ?? "",
    sourceType: defaultValues?.sourceType ?? "custom",
    tagsText: defaultValues?.tags?.join(", ") ?? "",
    isPinned: defaultValues?.isPinned ?? false,
  };
}

export function MemoryTipDialog({
  trigger,
  defaultValues,
  tip,
  onCreated,
  onSaved,
}: MemoryTipDialogProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateMemoryTipMutation();
  const updateMutation = useUpdateMemoryTipMutation();
  const initialValues = useMemo(
    () => getDefaultValues(tip ?? defaultValues),
    [defaultValues, tip],
  );
  const isEditMode = Boolean(tip);
  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: memoryTipFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (tip) {
          await updateMutation.mutateAsync({
            tipId: tip.id,
            input: toUpdatePayload(value),
          });
          toast.success("Đã cập nhật nhắc nhanh");
          onSaved?.();
        } else {
          await createMutation.mutateAsync(toPayload(value));
          toast.success("Đã thêm nhắc nhanh");
          onCreated?.();
        }

        form.reset();
        setOpen(false);
      } catch (error) {
        if (isDuplicateMemoryTipError(error)) {
          toast.info("Tip này đã được lưu rồi.");
          return;
        }

        toast.error(
          error instanceof MemoryTipsApiError
            ? error.message
            : isEditMode
              ? "Không thể cập nhật nhắc nhanh"
              : "Không thể thêm nhắc nhanh",
        );
      }
    },
  });
  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    form.state.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="sm">
            + Thêm
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Sửa nhắc nhanh" : "Thêm nhắc nhanh"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật công thức, mẹo phân biệt hoặc ví dụ dễ quên."
              : "Lưu công thức, mẹo phân biệt hoặc ví dụ dễ quên để nhắc lại nhanh."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <DialogBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <form.AppField name="tipType">
                {(field) => (
                  <field.Select
                    label="Loại"
                    options={[
                      { value: "grammar", label: "Ngữ pháp" },
                      { value: "vocab", label: "Từ vựng" },
                      { value: "formula", label: "Công thức" },
                      { value: "custom", label: "Tự thêm" },
                    ]}
                    disabled={isSubmitting}
                  />
                )}
              </form.AppField>

              <form.AppField name="sourceType">
                {(field) => (
                  <field.Select
                    label="Nguồn"
                    options={[
                      { value: "custom", label: "Tự thêm" },
                      { value: "grammar", label: "Ngữ pháp" },
                      { value: "vocab", label: "Từ vựng" },
                      { value: "lesson", label: "Bài học" },
                    ]}
                    disabled={isSubmitting}
                  />
                )}
              </form.AppField>
            </div>

            <form.AppField name="title">
              {(field) => (
                <field.TextField
                  label="Tiêu đề"
                  placeholder="Ví dụ: 又 và 再 không giống nhau"
                  required
                  disabled={isSubmitting}
                />
              )}
            </form.AppField>

            <form.AppField name="body">
              {(field) => (
                <field.Textarea
                  label="Nội dung chính"
                  placeholder="Nhắc ngắn gọn điểm dễ quên."
                  required
                  disabled={isSubmitting}
                />
              )}
            </form.AppField>

            <form.AppField name="formula">
              {(field) => (
                <field.TextField
                  label="Công thức"
                  placeholder="S + 把 + O + V + 结果"
                  disabled={isSubmitting}
                />
              )}
            </form.AppField>

            <div className="grid gap-4 sm:grid-cols-3">
              <form.AppField name="exampleZh">
                {(field) => (
                  <field.TextField
                    label="Ví dụ tiếng Trung"
                    placeholder="我把作业写完了。"
                    disabled={isSubmitting}
                  />
                )}
              </form.AppField>

              <form.AppField name="examplePinyin">
                {(field) => (
                  <field.TextField
                    label="Pinyin"
                    placeholder="Wǒ bǎ..."
                    disabled={isSubmitting}
                  />
                )}
              </form.AppField>

              <form.AppField name="exampleVi">
                {(field) => (
                  <field.TextField
                    label="Nghĩa tiếng Việt"
                    placeholder="Tôi làm xong bài tập rồi."
                    disabled={isSubmitting}
                  />
                )}
              </form.AppField>
            </div>

            <form.AppField name="tagsText">
              {(field) => (
                <field.TextField
                  label="Tags"
                  placeholder="grammar, 把字句"
                  description="Ngăn cách nhiều tag bằng dấu phẩy."
                  disabled={isSubmitting}
                />
              )}
            </form.AppField>

            <form.AppField name="isPinned">
              {(field) => (
                <field.Checkbox label="Ghim tip này" disabled={isSubmitting} />
              )}
            </form.AppField>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditMode ? "Cập nhật" : "Lưu nhắc nhanh"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
