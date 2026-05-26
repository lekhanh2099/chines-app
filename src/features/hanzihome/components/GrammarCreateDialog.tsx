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
import { createHanziHomeGrammarPayloadSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import { useCreateHanziHomeGrammar } from "@/features/hanzihome/hooks/useCreateHanziHomeGrammar";

const grammarCreateFormSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tiêu đề"),
  core: z.string().trim(),
  formula: z.string().trim(),
});

type GrammarCreateFormValues = z.infer<typeof grammarCreateFormSchema>;

const defaultValues: GrammarCreateFormValues = {
  title: "",
  core: "",
  formula: "",
};

type GrammarCreateDialogProps = {
  lessonId: string;
};

export function GrammarCreateDialog({ lessonId }: GrammarCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateHanziHomeGrammar();
  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: grammarCreateFormSchema,
    },
    onSubmit: async ({ value }) => {
      const formulas = value.formula ? [value.formula] : [];
      const payload = createHanziHomeGrammarPayloadSchema.parse({
        lessonId,
        title: value.title,
        cleanTitle: value.title,
        core: value.core,
        structuresView: formulas,
        notes: [],
        examplesParsed: [],
        detailSections: [],
      });

      try {
        await createMutation.mutateAsync(payload);
        toast.success("Đã thêm ngữ pháp");
        form.reset(defaultValues);
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Không thêm được ngữ pháp",
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
          Thêm ngữ pháp
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
            <DialogTitle>Thêm ngữ pháp</DialogTitle>
            <DialogDescription>
              Thêm điểm ngữ pháp vào bài hiện tại bằng dữ liệu Supabase
              user-owned.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="gap-4">
            <form.AppField name="title">
              {(field) => <field.TextField label="Tiêu đề" required />}
            </form.AppField>

            <form.AppField name="formula">
              {(field) => <field.TextField label="Công thức" />}
            </form.AppField>

            <form.AppField name="core">
              {(field) => <field.Textarea label="Giải thích chính" />}
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
