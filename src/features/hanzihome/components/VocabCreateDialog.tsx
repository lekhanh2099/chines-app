"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { createHanziHomeVocabPayloadSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import { useCreateHanziHomeVocab } from "@/features/hanzihome/hooks/useCreateHanziHomeVocab";

const vocabCreateFormSchema = z.object({
  word: z.string().trim().min(1, "Vui lòng nhập từ"),
  pinyin: z.string().trim().min(1, "Vui lòng nhập pinyin"),
  hanViet: z.string().trim().min(1, "Vui lòng nhập Hán Việt"),
  meaning: z.string().trim().min(1, "Vui lòng nhập nghĩa"),
  category: z.string().trim().min(1, "Vui lòng nhập nhóm"),
});

type VocabCreateFormValues = z.infer<typeof vocabCreateFormSchema>;

const defaultValues: VocabCreateFormValues = {
  word: "",
  pinyin: "",
  hanViet: "",
  meaning: "",
  category: "Từ vựng",
};

type VocabCreateDialogProps = {
  lessonId: string;
};

export function VocabCreateDialog({ lessonId }: VocabCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateHanziHomeVocab();
  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: vocabCreateFormSchema,
    },
    onSubmit: async ({ value }) => {
      const payload = createHanziHomeVocabPayloadSchema.parse({
        lessonId,
        word: value.word,
        pinyin: value.pinyin,
        hanViet: value.hanViet,
        meaning: value.meaning,
        category: value.category,
        examplesParsed: [],
        detailSections: [],
      });

      try {
        await createMutation.mutateAsync(payload);
        toast.success("Đã thêm từ vựng");
        form.reset(defaultValues);
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Không thêm được từ vựng",
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
          form.reset(defaultValues);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          Thêm từ
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
            <DialogTitle>Thêm từ vựng</DialogTitle>
            <DialogDescription>
              Thêm từ vào bài hiện tại bằng dữ liệu Supabase user-owned.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <form.AppField name="word">
                {(field) => <field.TextField label="Từ" required />}
              </form.AppField>
              <form.AppField name="pinyin">
                {(field) => <field.TextField label="Pinyin" required />}
              </form.AppField>
              <form.AppField name="hanViet">
                {(field) => <field.TextField label="Hán Việt" required />}
              </form.AppField>
              <form.AppField name="category">
                {(field) => <field.TextField label="Nhóm" required />}
              </form.AppField>
            </div>

            <form.AppField name="meaning">
              {(field) => <field.TextField label="Nghĩa" required />}
            </form.AppField>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={createMutation.isPending}
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Đang thêm..." : "Thêm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
