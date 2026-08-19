"use client";

import { Typography } from "@/components/ui/typography";
import { useMemo, useState } from "react";
import { z } from "zod";

import { useAppForm } from "@/components/form";

import type { EditAdapter } from "../../adapters/types";
import { OptionalFieldsMultiSelect, type OptionalFieldGroup } from "./OptionalFieldsMultiSelect";

export type StructuredNodeFormProps = {
 value: Parameters<EditAdapter["toValues"]>[0];
 adapter: EditAdapter;
 formId: string;
 onSubmit: (value: ReturnType<EditAdapter["toNode"]>) => void;
};

export function StructuredNodeForm({ value, adapter, formId, onSubmit }: StructuredNodeFormProps) {
 const initialValues = useMemo(() => adapter.toValues(value), [adapter, value]);
 const editableFields = useMemo(
  () => adapter.fields.filter((field) => field.kind !== "json"),
  [adapter],
 );
 const defaultVisibleFieldKeys = useMemo(
  () => editableFields.filter((field) => field.defaultVisible !== false).map((field) => field.key),
  [editableFields],
 );
 const optionalFields = useMemo(
  () => editableFields.filter((field) => field.defaultVisible === false),
  [editableFields],
 );
 const optionalFieldGroups = useMemo(() => {
  const groups = new Map<string, OptionalFieldGroup>();
  for (const field of optionalFields) {
   const current = groups.get(field.label) ?? { label: field.label, keys: [] };
   current.keys.push(field.key);
   groups.set(field.label, current);
  }
  return Array.from(groups.values());
 }, [optionalFields]);
 const [visibleFieldKeys, setVisibleFieldKeys] = useState(() => new Set(defaultVisibleFieldKeys));
 const visibleFields = useMemo(
  () => editableFields.filter((field) => visibleFieldKeys.has(field.key)),
  [editableFields, visibleFieldKeys],
 );
 const selectedOptionalGroups = useMemo(
  () => optionalFieldGroups.filter((group) => group.keys.every((key) => visibleFieldKeys.has(key))),
  [optionalFieldGroups, visibleFieldKeys],
 );
 const formSchema = useMemo(
  () =>
   z.record(z.string(), z.string()).superRefine((values, context) => {
    for (const field of visibleFields) {
     if (field.required && !(values[field.key] ?? "").trim()) {
      context.addIssue({
       code: "custom",
       path: [field.key],
       message: "Trường này không được để trống.",
      });
     }
    }
   }),
  [visibleFields],
 );
 const form = useAppForm({
  defaultValues: initialValues,
  validators: { onSubmit: formSchema },
  onSubmit: ({ value: values }) => onSubmit(adapter.toNode(value, { ...initialValues, ...values })),
 });
 const toggleOptionalFieldGroup = (keys: string[], checked: boolean) => {
  setVisibleFieldKeys((current) => {
   const next = new Set(current);
   for (const key of keys) {
    if (checked) next.add(key);
    else next.delete(key);
   }
   return next;
  });
 };

 return (
  <form
   id={formId}
   className="grid gap-4"
   onSubmit={(event) => {
    event.preventDefault();
    void form.handleSubmit();
   }}
  >
   {optionalFieldGroups.length > 0 ? (
    <OptionalFieldsMultiSelect
     groups={optionalFieldGroups}
     selectedGroups={selectedOptionalGroups}
     selectedKeys={visibleFieldKeys}
     onToggleGroup={toggleOptionalFieldGroup}
     onReset={() => setVisibleFieldKeys(new Set(defaultVisibleFieldKeys))}
     onSelectAll={() => setVisibleFieldKeys(new Set(editableFields.map((field) => field.key)))}
    />
   ) : null}

   {visibleFields.map((field, index) => {
    const previousGroup = visibleFields[index - 1]?.group;
    return (
     <div key={field.key} className="grid gap-4">
      {field.group && field.group !== previousGroup ? (
       <div className="border-t border-border-default pt-4 first:border-t-0 first:pt-0">
        <Typography as="h3" variant="cardTitle" tone="default" weight="bold">
         {field.group}
        </Typography>
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
