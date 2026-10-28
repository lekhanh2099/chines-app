"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";

import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/actions/button";
import { Spinner } from "@/components/ui/feedback/spinner";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/overlays/dialog";
import {
 createMemoryTipPayloadSchema,
 memoryTipSchema,
 memoryTipSourceTypeSchema,
 memoryTipTypeSchema,
 type CreateMemoryTipPayload,
 type MemoryTip,
 type UpdateMemoryTipPayload,
} from "./memory-tip.schema";
import { isDuplicateMemoryTipError, MemoryTipsApiError } from "./memory-tip-api";
import { useCreateMemoryTipMutation, useUpdateMemoryTipMutation } from "./useMemoryTips";

const memoryTipFormSchema = z.object({
 tipType: memoryTipTypeSchema,
 title: z.string().trim().min(1),
 body: z.string().trim().min(1),
 formula: z.string().trim(),
 exampleZh: z.string().trim(),
 examplePinyin: z.string().trim(),
 exampleVi: z.string().trim(),
 sourceType: memoryTipSourceTypeSchema,
 tagsText: z.string().trim(),
 isPinned: z.boolean(),
});
type MemoryTipDefaults = z.infer<
 z.ZodUnion<[ReturnType<typeof createMemoryTipPayloadSchema.partial>, typeof memoryTipSchema]>
>;

type MemoryTipFormValues = z.infer<typeof memoryTipFormSchema>;

type MemoryTipDialogProps = {
 trigger?: ReactNode;
 defaultValues?: Partial<CreateMemoryTipPayload>;
 tip?: MemoryTip;
 open?: boolean;
 onOpenChange?: (open: boolean) => void;
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

function getDefaultValues(defaultValues?: MemoryTipDefaults): MemoryTipFormValues {
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
 open,
 onOpenChange,
 onCreated,
 onSaved,
}: MemoryTipDialogProps) {
 const t = useTranslations("MemoryTips");
 const common = useTranslations("Common.actions");
 const formSchema = useMemo(
  () =>
   memoryTipFormSchema.extend({
    title: z.string().trim().min(1, t("dialog.titleRequired")),
    body: z.string().trim().min(1, t("dialog.bodyRequired")),
   }),
  [t],
 );
 const [internalOpen, setInternalOpen] = useState(false);
 const createMutation = useCreateMemoryTipMutation();
 const updateMutation = useUpdateMemoryTipMutation();
 const initialValues = useMemo(() => getDefaultValues(tip ?? defaultValues), [defaultValues, tip]);
 const isEditMode = Boolean(tip);
 const resolvedOpen = open ?? internalOpen;
 const updateOpen = (nextOpen: boolean) => {
  if (onOpenChange) onOpenChange(nextOpen);
  else setInternalOpen(nextOpen);
 };
 const form = useAppForm({
  defaultValues: initialValues,
  validators: {
   onSubmit: formSchema,
  },
  onSubmit: async ({ value }) => {
   try {
    if (tip) {
     await updateMutation.mutateAsync({
      tipId: tip.id,
      input: toUpdatePayload(value),
     });
     toast.success(t("dialog.updated"));
     onSaved?.();
    } else {
     await createMutation.mutateAsync(toPayload(value));
     toast.success(t("dialog.created"));
     onCreated?.();
    }

    form.reset();
    updateOpen(false);
   } catch (error) {
    if (isDuplicateMemoryTipError(error)) {
     toast.info(t("dialog.duplicate"));
     return;
    }

    toast.error(
     error instanceof MemoryTipsApiError
      ? error.message
      : isEditMode
        ? t("toast.updateError")
        : t("dialog.createError"),
    );
   }
  },
 });
 const isSubmitting =
  createMutation.isPending || updateMutation.isPending || form.state.isSubmitting;

 return (
  <Dialog open={resolvedOpen} onOpenChange={updateOpen}>
   {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
   {!trigger && open === undefined ? (
    <DialogTrigger asChild>
     <Button type="button" variant="outline" size="toolbar">
      {t("dialog.addShort")}
     </Button>
    </DialogTrigger>
   ) : null}

   <DialogContent closeLabel={common("close")}>
    <DialogHeader>
     <DialogTitle>{isEditMode ? t("dialog.editTitle") : t("dialog.createTitle")}</DialogTitle>
     <DialogDescription>
      {isEditMode ? t("dialog.editDescription") : t("dialog.createDescription")}
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
          label={t("dialog.type")}
          options={[
           { value: "grammar", label: t("types.grammar") },
           { value: "vocab", label: t("types.vocab") },
           { value: "formula", label: t("types.formula") },
           { value: "custom", label: t("types.custom") },
          ]}
          disabled={isSubmitting}
         />
        )}
       </form.AppField>

       <form.AppField name="sourceType">
        {(field) => (
         <field.Select
          label={t("dialog.source")}
          options={[
           { value: "custom", label: t("types.custom") },
           { value: "grammar", label: t("types.grammar") },
           { value: "vocab", label: t("types.vocab") },
           { value: "lesson", label: t("dialog.lesson") },
          ]}
          disabled={isSubmitting}
         />
        )}
       </form.AppField>
      </div>

      <form.AppField name="title">
       {(field) => (
        <field.TextField
         label={t("dialog.titleLabel")}
         placeholder={t("dialog.titlePlaceholder")}
         required
         disabled={isSubmitting}
        />
       )}
      </form.AppField>

      <form.AppField name="body">
       {(field) => (
        <field.Textarea
         label={t("dialog.bodyLabel")}
         placeholder={t("dialog.bodyPlaceholder")}
         required
         disabled={isSubmitting}
        />
       )}
      </form.AppField>

      <form.AppField name="formula">
       {(field) => (
        <field.TextField
         label={t("types.formula")}
         placeholder="S + 把 + O + V + 结果"
         disabled={isSubmitting}
        />
       )}
      </form.AppField>

      <div className="grid gap-4 sm:grid-cols-3">
       <form.AppField name="exampleZh">
        {(field) => (
         <field.TextField
          label={t("dialog.exampleZh")}
          placeholder="我把作业写完了。"
          disabled={isSubmitting}
         />
        )}
       </form.AppField>

       <form.AppField name="examplePinyin">
        {(field) => (
         <field.TextField label="Pinyin" placeholder="Wǒ bǎ..." disabled={isSubmitting} />
        )}
       </form.AppField>

       <form.AppField name="exampleVi">
        {(field) => (
         <field.TextField
          label={t("dialog.exampleVi")}
          placeholder={t("dialog.exampleViPlaceholder")}
          disabled={isSubmitting}
         />
        )}
       </form.AppField>
      </div>

      <form.AppField name="tagsText">
       {(field) => (
        <field.TextField
         label={t("dialog.tags")}
         placeholder="grammar, 把字句"
         description={t("dialog.tagsDescription")}
         disabled={isSubmitting}
        />
       )}
      </form.AppField>

      <form.AppField name="isPinned">
       {(field) => <field.Checkbox label={t("dialog.pinTip")} disabled={isSubmitting} />}
      </form.AppField>
     </DialogBody>

     <DialogFooter>
      <Button
       type="button"
       variant="outline"
       disabled={isSubmitting}
       onClick={() => updateOpen(false)}
      >
       {common("cancel")}
      </Button>
      <Button type="submit" disabled={isSubmitting}>
       {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
       {isEditMode ? t("dialog.update") : t("dialog.save")}
      </Button>
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 );
}
