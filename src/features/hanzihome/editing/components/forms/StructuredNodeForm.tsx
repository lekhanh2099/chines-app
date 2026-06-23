"use client";

import { useMemo } from "react";
import { z } from "zod";

import { useAppForm } from "@/components/form";

import type { EditAdapter } from "../../adapters/types";

export type StructuredNodeFormProps = {
 value: unknown;
 adapter: EditAdapter;
 formId: string;
 onSubmit: (value: unknown) => void;
};

export function StructuredNodeForm({ value, adapter, formId, onSubmit }: StructuredNodeFormProps) {
 const initialValues = useMemo(() => adapter.toValues(value), [adapter, value]);
 const editableFields = useMemo(
  () => adapter.fields.filter((field) => field.kind !== "json"),
  [adapter],
 );
 const formSchema = useMemo(
  () =>
   z.record(z.string(), z.string()).superRefine((values, context) => {
    for (const field of editableFields) {
     if (field.required && !(values[field.key] ?? "").trim()) {
      context.addIssue({
       code: "custom",
       path: [field.key],
       message: "Trường này không được để trống.",
      });
     }
    }
   }),
  [editableFields],
 );
 const form = useAppForm({
  defaultValues: initialValues,
  validators: { onSubmit: formSchema },
  onSubmit: ({ value: values }) => onSubmit(adapter.toNode(value, values)),
 });

 return (
  <form
   id={formId}
   className="grid gap-4"
   onSubmit={(event) => {
    event.preventDefault();
    void form.handleSubmit();
   }}
  >
   {editableFields.map((field, index) => {
    const previousGroup = editableFields[index - 1]?.group;
    return (
     <div key={field.key} className="grid gap-4">
      {field.group && field.group !== previousGroup ? (
       <div className="border-t border-border-default pt-4 first:border-t-0 first:pt-0">
        <h3 className="font-bold text-text-primary">{field.group}</h3>
       </div>
      ) : null}
      <form.AppField name={field.key}>
       {(formField) =>
        field.kind === "textarea" || field.kind === "string-list" ? (
         <formField.Textarea
          label={field.label}
          description={
           field.kind === "string-list" ? "Mỗi dòng là một giá trị." : field.description
          }
          required={field.required}
         />
        ) : field.kind === "boolean" ? (
         <formField.Select
          label={field.label}
          description={field.description}
          required={field.required}
          options={[
           { value: "true", label: "Có" },
           { value: "false", label: "Không" },
          ]}
         />
        ) : (
         <formField.TextField
          label={field.label}
          description={field.description}
          required={field.required}
          type={field.kind === "number" ? "number" : "text"}
         />
        )
       }
      </form.AppField>
     </div>
    );
   })}
  </form>
 );
}
