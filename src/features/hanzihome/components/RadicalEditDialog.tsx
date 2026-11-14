"use client";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/forms/label";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonObject } from "@/types/json";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo, useState } from "react";
import { FileJson, ListChecks, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { z, ZodError } from "zod";

import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/actions/button";
import { focusWithinRingClassName } from "@/components/ui/focus-ring";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import { Tabs } from "@/components/ui/navigation/tabs";
import { isHanziHomeMutationConflict } from "@/features/hanzihome/editing/mutation-error";
import { useRadicalMutation } from "@/features/hanzihome/editing/useRadicalMutation";
import {
 radicalFormSchema,
 radicalColumnValuesSchema,
 valuesFromRadical,
 columnValuesFromRadical,
 columnValuesFromForm,
 changedFields,
 isValidRadicalStrokeText,
} from "@/features/hanzihome/editing/radical-edit-utils";
import type { StaticRadicalData } from "@/features/hanzihome/types";

type RadicalEditDialogProps = {
 radical: z.infer<z.ZodNullable<z.ZodType<StaticRadicalData>>>;
 open: boolean;
 onOpenChange: (open: boolean) => void;
};

const EditModeSchema = z.enum(["fields", "json"]);
type EditMode = z.infer<typeof EditModeSchema>;

const formId = "hanzihome-radical-edit-form";

function RadicalEditDialogContent({
 radical,
 onOpenChange,
}: {
 radical: StaticRadicalData;
 onOpenChange: (open: boolean) => void;
}) {
 const t = useTranslations("Radicals");
 const formSchema = useMemo(
  () =>
   radicalFormSchema.extend({
    radical: z.string().trim().min(1, t("required")),
    strokes: z.string().trim().refine(isValidRadicalStrokeText, t("positiveStrokes")),
   }),
  [t],
 );
 const mutation = useRadicalMutation();
 const initialValues = useMemo(() => valuesFromRadical(radical), [radical]);
 const before = useMemo(() => columnValuesFromRadical(radical), [radical]);
 const [mode, setMode] = useState<EditMode>(EditModeSchema.enum.fields);
 const [jsonValue, setJsonValue] = useState(() => JSON.stringify(before, null, 2));
 const [jsonError, setJsonError] = useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const [isJsonSubmitting, setIsJsonSubmitting] = useState(false);

 const submitColumnValues = async (after: JsonObject) => {
  const changes = changedFields(before, after);
  if (Object.keys(changes).length === 0) {
   toast.info(t("unchanged"));
   return;
  }

  try {
   await mutation.mutateAsync({ radical, changes });
   toast.success(t("saved"));
   onOpenChange(false);
  } catch (error) {
   if (isHanziHomeMutationConflict(error)) {
    toast.error(t("conflict"));
    onOpenChange(false);
    return;
   }
   toast.error(t("saveError"));
  }
 };

 const submitJson = async () => {
  try {
   const parsed = radicalColumnValuesSchema.parse(JSON.parse(jsonValue));
   setJsonError(null);
   setIsJsonSubmitting(true);
   await submitColumnValues(parsed);
  } catch (error) {
   setJsonError(
    error instanceof SyntaxError
     ? t("invalidJson")
     : error instanceof ZodError
       ? t("schemaJson")
       : t("readJson"),
   );
  } finally {
   setIsJsonSubmitting(false);
  }
 };

 const form = useAppForm({
  defaultValues: initialValues,
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => {
   const after = columnValuesFromForm(value);
   await submitColumnValues(after);
  },
 });

 return (
  <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden">
   <DialogHeader>
    <DialogTitle>{t("editTitle", { radical: radical.radical })}</DialogTitle>
    <DialogDescription>{t("editHelp")}</DialogDescription>
   </DialogHeader>
   <DialogBody className="max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
    <div className="grid gap-4">
     <Tabs
      value={mode}
      onValueChange={setMode}
      items={[
       { key: "fields", label: t("fields"), icon: ListChecks },
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
         {(field) => <field.TextField label={t("radical")} required />}
        </form.AppField>
        <form.AppField name="strokes">
         {(field) => <field.TextField label={t("strokeCount")} inputMode="numeric" />}
        </form.AppField>
       </div>
       <form.AppField name="nameVi">
        {(field) => <field.TextField label={t("nameVi")} />}
       </form.AppField>
       <form.AppField name="modernMeaning">
        {(field) => <field.Textarea label={t("modern")} />}
       </form.AppField>
       <form.AppField name="historyMeaning">
        {(field) => <field.Textarea label={t("history")} />}
       </form.AppField>
       <form.AppField name="variantsText">
        {(field) => (
         <field.Textarea label={t("variants")} description={t("componentHelp")} font="mono" />
        )}
       </form.AppField>
       <form.AppField name="relatedComponentsText">
        {(field) => (
         <field.Textarea
          label={t("related")}
          description={t("componentHelp")}
          density="comfortable"
          font="mono"
         />
        )}
       </form.AppField>
       <form.AppField name="recognition">
        {(field) => <field.Textarea label={t("recognition")} />}
       </form.AppField>
       <form.AppField name="distinguishText">
        {(field) => <field.Textarea label={t("distinguish")} description={t("distinguishHelp")} />}
       </form.AppField>
       <form.AppField name="groupsText">
        {(field) => <field.Textarea label={t("groups")} description={t("groupHelp")} font="mono" />}
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
       <Label id="hanzihome-radical-json-edit-label" variant="label" tone="default" weight="bold">
        JSON
       </Label>
       <div
        className={`h-[clamp(26rem,58dvh,42rem)] overflow-hidden rounded-xl border border-border-default bg-bg-primary shadow-inner [&_.cm-activeLine]:bg-primary/5 [&_.cm-activeLineGutter]:bg-primary/10 [&_.cm-content]:min-h-full [&_.cm-content]:py-3 [&_.cm-editor]:h-full [&_.cm-editor]:bg-bg-primary [&_.cm-focused]:outline-none [&_.cm-gutters]:border-border-default [&_.cm-gutters]:bg-bg-elevated/70 [&_.cm-line]:px-3 [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-xs [&_.cm-theme-light]:h-full ${focusWithinRingClassName}`}
       >
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
       {jsonError ? (
        <StudyInstructionText variant="bodySmall" tone="danger" weight="medium">
         {jsonError}
        </StudyInstructionText>
       ) : null}
      </form>
     )}
    </div>
   </DialogBody>
   <DialogFooter>
    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
     {t("cancel")}
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
     {t("reset")}
    </Button>
    <form.Subscribe selector={(state) => state.isSubmitting}>
     {(isSubmitting) => (
      <Button type="submit" form={formId} disabled={isSubmitting || isJsonSubmitting}>
       {isSubmitting || isJsonSubmitting ? t("saving") : t("save")}
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
