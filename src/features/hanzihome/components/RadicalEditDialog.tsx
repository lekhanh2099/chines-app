"use client";

import CodeMirror from "@uiw/react-codemirror";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileJson, ListChecks, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { z, ZodError } from "zod";

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
} from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import {
 HanziHomeMutationError,
 isHanziHomeMutationConflict,
} from "@/features/hanzihome/editing/mutation-error";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import type { StaticRadicalData } from "@/features/hanzihome/types";

type RadicalEditDialogProps = {
 radical: StaticRadicalData | null;
 open: boolean;
 onOpenChange: (open: boolean) => void;
};

type RadicalFormValues = {
 radical: string;
 nameVi: string;
 strokes: string;
 modernMeaning: string;
 historyMeaning: string;
 recognition: string;
 variantsText: string;
 relatedComponentsText: string;
 distinguishText: string;
 groupsText: string;
};

type EditMode = "fields" | "json";

const formId = "hanzihome-radical-edit-form";

const radicalComponentSchema = z.object({
 form: z.string().trim().min(1),
 note: z.string(),
});

const radicalGroupSchema = z.object({
 name: z.string().trim().min(1),
 chars: z.array(z.string().trim().min(1)),
});

const radicalColumnValuesSchema = z.strictObject({
 radical: z.string().trim().min(1, "Thiếu bộ thủ"),
 name_vi: z.string().nullable(),
 strokes: z.number().int().positive().nullable(),
 core_meaning: z.object({
  modern: z.string(),
  history: z.string(),
 }),
 recognition: z.string().nullable(),
 variants: z.array(radicalComponentSchema),
 related_components: z.array(radicalComponentSchema),
 distinguish: z.array(z.string()),
 groups: z.array(radicalGroupSchema),
});

const radicalFormSchema = z.object({
 radical: z.string().trim().min(1, "Thiếu bộ thủ"),
 nameVi: z.string(),
 strokes: z
  .string()
  .trim()
  .refine((value) => value === "" || /^[1-9]\d*$/.test(value), "Số nét phải là số dương."),
 modernMeaning: z.string(),
 historyMeaning: z.string(),
 recognition: z.string(),
 variantsText: z.string(),
 relatedComponentsText: z.string(),
 distinguishText: z.string(),
 groupsText: z.string(),
});

function jsonErrorMessage(error: unknown) {
 if (error instanceof SyntaxError) return "JSON chưa hợp lệ.";
 if (error instanceof ZodError) return error.issues[0]?.message ?? "JSON không đúng schema.";
 if (error instanceof Error) return error.message;
 return "Không thể đọc JSON.";
}

function renderComponentLines(components: Array<{ form: string; note: string }> | undefined) {
 return (components ?? []).map((component) => `${component.form} | ${component.note}`).join("\n");
}

function parseComponentLines(value: string) {
 return value
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
   const [form = "", ...noteParts] = line.split("|");
   return {
    form: form.trim(),
    note: noteParts.join("|").trim(),
   };
  })
  .filter((component) => component.form);
}

function renderGroups(groups: StaticRadicalData["groups"]) {
 return (groups ?? []).map((group) => `${group.name}: ${group.chars.join(" ")}`).join("\n");
}

function parseGroups(value: string) {
 return value
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
   const [name = "", charsText = ""] = line.split(":");
   return {
    name: name.trim(),
    chars: charsText
     .split(/[\s,，]+/)
     .map((char) => char.trim())
     .filter(Boolean),
   };
  })
  .filter((group) => group.name && group.chars.length > 0);
}

function renderStringList(values: string[] | undefined) {
 return (values ?? []).join("\n");
}

function parseStringList(value: string) {
 return value
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
}

function valuesFromRadical(radical: StaticRadicalData): RadicalFormValues {
 return {
  radical: radical.radical,
  nameVi: radical.nameVi ?? "",
  strokes: radical.strokes ? String(radical.strokes) : "",
  modernMeaning: radical.coreMeaning.modern ?? "",
  historyMeaning: radical.coreMeaning.history ?? "",
  recognition: radical.recognition ?? "",
  variantsText: renderComponentLines(radical.variants),
  relatedComponentsText: renderComponentLines(radical.relatedComponents),
  distinguishText: renderStringList(radical.distinguish),
  groupsText: renderGroups(radical.groups),
 };
}

function columnValuesFromForm(values: RadicalFormValues) {
 return {
  radical: values.radical.trim(),
  name_vi: values.nameVi.trim() || null,
  strokes: values.strokes.trim() ? Number(values.strokes.trim()) : null,
  core_meaning: {
   modern: values.modernMeaning.trim(),
   history: values.historyMeaning.trim(),
  },
  recognition: values.recognition.trim() || null,
  variants: parseComponentLines(values.variantsText),
  related_components: parseComponentLines(values.relatedComponentsText),
  distinguish: parseStringList(values.distinguishText),
  groups: parseGroups(values.groupsText),
 };
}

function columnValuesFromRadical(radical: StaticRadicalData) {
 return {
  radical: radical.radical,
  name_vi: radical.nameVi ?? null,
  strokes: radical.strokes ?? null,
  core_meaning: {
   modern: radical.coreMeaning.modern ?? "",
   history: radical.coreMeaning.history ?? "",
  },
  recognition: radical.recognition ?? null,
  variants: radical.variants,
  related_components: radical.relatedComponents ?? [],
  distinguish: radical.distinguish,
  groups: radical.groups ?? [],
 };
}

function changedFields(
 before: Record<string, unknown>,
 after: Record<string, unknown>,
): Record<string, unknown> {
 return Object.fromEntries(
  Object.entries(after).filter(
   ([key, value]) => JSON.stringify(before[key]) !== JSON.stringify(value),
  ),
 );
}

async function updateRadical({
 radical,
 changes,
}: {
 radical: StaticRadicalData;
 changes: Record<string, unknown>;
}) {
 const expectedUpdatedAt = radical.editMeta?.updatedAt;
 if (!expectedUpdatedAt) throw new Error("Bộ thủ này chưa có DB write target.");

 const response = await fetch(`/api/hanzihome/content/radicals/${encodeURIComponent(radical.id)}`, {
  method: "PATCH",
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({
   reason: `Cập nhật bộ thủ ${radical.radical}`,
   expectedUpdatedAt,
   changes,
  }),
 });
 const payload: unknown = await response.json().catch(() => null);
 if (!response.ok) {
  const message =
   payload && typeof payload === "object" && "error" in payload
    ? String((payload as { error: unknown }).error)
    : `Không thể lưu bộ thủ (${response.status})`;
  const details =
   payload && typeof payload === "object" && "details" in payload
    ? (payload as { details: unknown }).details
    : undefined;
  throw new HanziHomeMutationError(message, response.status, details);
 }
 return payload;
}

function RadicalEditDialogContent({
 radical,
 onOpenChange,
}: {
 radical: StaticRadicalData;
 onOpenChange: (open: boolean) => void;
}) {
 const queryClient = useQueryClient();
 const initialValues = useMemo(() => valuesFromRadical(radical), [radical]);
 const before = useMemo(() => columnValuesFromRadical(radical), [radical]);
 const [mode, setMode] = useState<EditMode>("fields");
 const [jsonValue, setJsonValue] = useState(() => JSON.stringify(before, null, 2));
 const [jsonError, setJsonError] = useState<string | null>(null);
 const [isJsonSubmitting, setIsJsonSubmitting] = useState(false);

 const submitColumnValues = async (after: Record<string, unknown>) => {
  const changes = changedFields(before, after);
  if (Object.keys(changes).length === 0) {
   toast.info("Không có thay đổi để lưu.");
   return;
  }

  try {
   await updateRadical({ radical, changes });
   await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalogRoot });
   await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.searchIndexRoot });
   toast.success("Đã lưu bộ thủ vào Supabase.");
   onOpenChange(false);
  } catch (error) {
   if (isHanziHomeMutationConflict(error)) {
    await queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.catalogRoot });
    toast.error("Bộ thủ đã thay đổi, đang tải lại.");
    onOpenChange(false);
    return;
   }
   toast.error(error instanceof Error ? error.message : "Không thể lưu bộ thủ.");
  }
 };

 const submitJson = async () => {
  try {
   const parsed = radicalColumnValuesSchema.parse(JSON.parse(jsonValue));
   setJsonError(null);
   setIsJsonSubmitting(true);
   await submitColumnValues(parsed);
  } catch (error) {
   setJsonError(jsonErrorMessage(error));
  } finally {
   setIsJsonSubmitting(false);
  }
 };

 const form = useAppForm({
  defaultValues: initialValues,
  validators: { onSubmit: radicalFormSchema },
  onSubmit: async ({ value }) => {
   const after = columnValuesFromForm(value);
   await submitColumnValues(after);
  },
 });

 return (
  <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden">
   <DialogHeader>
    <DialogTitle>Sửa bộ thủ {radical.radical}</DialogTitle>
    <DialogDescription>Lưu từng field của một dòng bộ thủ trong Supabase.</DialogDescription>
   </DialogHeader>
   <DialogBody className="max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
    <div className="grid gap-4">
     <Tabs
      value={mode}
      onValueChange={setMode}
      items={[
       { key: "fields", label: "Field", icon: ListChecks },
       { key: "json", label: "JSON", icon: FileJson },
      ]}
     />

     {mode === "fields" ? (
      <form
       id={formId}
       className="grid gap-4"
       onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
       }}
      >
       <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <form.AppField name="radical">
         {(field) => <field.TextField label="Bộ thủ" required />}
        </form.AppField>
        <form.AppField name="strokes">
         {(field) => <field.TextField label="Số nét" inputMode="numeric" />}
        </form.AppField>
       </div>
       <form.AppField name="nameVi">
        {(field) => <field.TextField label="Tên tiếng Việt" />}
       </form.AppField>
       <form.AppField name="modernMeaning">
        {(field) => <field.Textarea label="Ý nghĩa hiện đại" textareaClassName="min-h-24" />}
       </form.AppField>
       <form.AppField name="historyMeaning">
        {(field) => <field.Textarea label="Nguồn gốc / lịch sử" textareaClassName="min-h-24" />}
       </form.AppField>
       <form.AppField name="variantsText">
        {(field) => (
         <field.Textarea
          label="Biến thể"
          description="Mỗi dòng: dạng | ghi chú"
          textareaClassName="min-h-28 font-mono text-sm"
         />
        )}
       </form.AppField>
       <form.AppField name="relatedComponentsText">
        {(field) => (
         <field.Textarea
          label="Thành phần liên quan"
          description="Mỗi dòng: dạng | ghi chú"
          textareaClassName="min-h-32 font-mono text-sm"
         />
        )}
       </form.AppField>
       <form.AppField name="recognition">
        {(field) => <field.Textarea label="Nhận diện" textareaClassName="min-h-24" />}
       </form.AppField>
       <form.AppField name="distinguishText">
        {(field) => (
         <field.Textarea
          label="Phân biệt"
          description="Mỗi dòng là một ghi chú."
          textareaClassName="min-h-28"
         />
        )}
       </form.AppField>
       <form.AppField name="groupsText">
        {(field) => (
         <field.Textarea
          label="Nhóm chữ thường gặp"
          description="Mỗi dòng: Tên nhóm: 字 字 字"
          textareaClassName="min-h-24 font-mono text-sm"
         />
        )}
       </form.AppField>
      </form>
     ) : (
      <form
       id={formId}
       className="grid gap-3"
       onSubmit={(event) => {
        event.preventDefault();
        void submitJson();
       }}
      >
       <label
        id="hanzihome-radical-json-edit-label"
        className="text-sm font-bold text-text-primary"
       >
        JSON
       </label>
       <div className="h-[clamp(26rem,58dvh,42rem)] overflow-hidden rounded-xl border border-border-default bg-bg-primary shadow-inner focus-within:ring-2 focus-within:ring-ring [&_.cm-activeLine]:bg-primary/5 [&_.cm-activeLineGutter]:bg-primary/10 [&_.cm-content]:min-h-full [&_.cm-content]:py-3 [&_.cm-editor]:h-full [&_.cm-editor]:bg-bg-primary [&_.cm-focused]:outline-none [&_.cm-gutters]:border-border-default [&_.cm-gutters]:bg-bg-elevated/70 [&_.cm-line]:px-3 [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-xs [&_.cm-theme-light]:h-full">
        <CodeMirror
         aria-labelledby="hanzihome-radical-json-edit-label"
         value={jsonValue}
         height="100%"
         basicSetup={{
          autocompletion: true,
          bracketMatching: true,
          closeBrackets: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          lineNumbers: true,
         }}
         placeholder={`{\n  "radical": "人"\n}`}
         theme="light"
         onChange={(nextValue) => {
          setJsonValue(nextValue);
          if (jsonError) setJsonError(null);
         }}
        />
       </div>
       {jsonError ? <p className="text-sm font-medium text-destructive">{jsonError}</p> : null}
      </form>
     )}
    </div>
   </DialogBody>
   <DialogFooter>
    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
     Hủy
    </Button>
    <Button
     type="button"
     variant="outline"
     onClick={() => {
      form.reset();
      setJsonValue(JSON.stringify(before, null, 2));
      setJsonError(null);
     }}
    >
     <RotateCcw className="h-4 w-4" />
     Reset
    </Button>
    <form.Subscribe selector={(state) => state.isSubmitting}>
     {(isSubmitting) => (
      <Button type="submit" form={formId} disabled={isSubmitting || isJsonSubmitting}>
       {isSubmitting || isJsonSubmitting ? "Đang lưu..." : "Lưu"}
      </Button>
     )}
    </form.Subscribe>
   </DialogFooter>
  </DialogContent>
 );
}

export function RadicalEditDialog({ radical, open, onOpenChange }: RadicalEditDialogProps) {
 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   {radical ? (
    <RadicalEditDialogContent key={radical.id} radical={radical} onOpenChange={onOpenChange} />
   ) : null}
  </Dialog>
 );
}
