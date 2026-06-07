"use client";

import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type {
 EditAdapter,
 EditFieldDefinition,
 EditFieldKind,
} from "../../adapters/types";

export type StructuredNodeFormProps = {
 value: unknown;
 adapter: EditAdapter;
 formId: string;
 onSubmit: (value: unknown) => void;
 onValidityChange?: (valid: boolean) => void;
 onDraftChange?: (value: unknown) => void;
};

type FormFieldDefinition = EditFieldDefinition & {
 reason: string;
};

function asEditableRecord(value: unknown): { [key: string]: unknown } {
 return value && typeof value === "object" && !Array.isArray(value)
  ? { ...value }
  : {};
}

function getAutoFieldKind(value: unknown): EditFieldKind {
 if (typeof value === "number") return "number";
 if (typeof value === "boolean") return "boolean";
 if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
  return "string-list";
 }
 if (
  value &&
  (typeof value === "object" || Array.isArray(value))
 ) {
  return "json";
 }
 return "textarea";
}

function buildAutoFields(
 value: unknown,
 adapterFields: EditFieldDefinition[],
): FormFieldDefinition[] {
 const record = asEditableRecord(value);
 const declaredKeys = new Set(adapterFields.map((field) => field.key));

 return Object.entries(record)
  .filter(([key]) => !declaredKeys.has(key))
  .map(([key, fieldValue]) => {
   const kind = getAutoFieldKind(fieldValue);
   return {
    key,
    label: key,
    kind,
    reason:
     kind === "json"
      ? "Field này là object/array nested, cần adapter riêng trước khi edit."
      : "Field này chưa có trong adapter edit.",
   };
  });
}

export function StructuredNodeForm({
 value,
 adapter,
 formId,
 onSubmit,
 onValidityChange,
 onDraftChange,
}: StructuredNodeFormProps) {
 const autoFields = useMemo(
  () => buildAutoFields(value, adapter.fields),
  [adapter.fields, value],
 );
 const editableFields = useMemo(
  () => adapter.fields.filter((field) => field.kind !== "json"),
  [adapter.fields],
 );
 const unsupportedFields = useMemo(
  () => [
   ...adapter.fields
    .filter((field) => field.kind === "json")
    .map((field) => ({
     ...field,
     reason:
      "Field này dùng JSON nested nên cần adapter riêng trước khi edit trong Study/Edit Mode.",
    })),
   ...autoFields,
  ],
  [adapter.fields, autoFields],
 );
 const initialValues = useMemo(
  () => adapter.toValues(value),
  [adapter, value],
 );
 const [values, setValues] = useState(initialValues);
 const invalidFields = editableFields.filter(
  (field) => field.required && !(values[field.key] ?? "").trim(),
 );
 const hasValidationError = invalidFields.length > 0;

 const buildNode = (nextValues: Record<string, string>) => {
  return adapter.toNode(value, nextValues);
 };

 useEffect(() => {
  onValidityChange?.(!hasValidationError);
 }, [hasValidationError, onValidityChange]);

 const updateValue = (key: string, nextValue: string) => {
  setValues((current) => {
   const next = { ...current, [key]: nextValue };
   onValidityChange?.(
    editableFields.every(
     (field) => !field.required || Boolean((next[field.key] ?? "").trim()),
    ),
   );
   onDraftChange?.(buildNode(next));
   return next;
  });
 };

 return (
  <form
   id={formId}
   className="grid gap-4"
   onSubmit={(event) => {
    event.preventDefault();
    if (hasValidationError) return;
    onSubmit(buildNode(values));
   }}
  >
   {editableFields.map((field) => {
    const inputId = `${formId}-${field.key}`;
    const fieldValue = values[field.key] ?? "";
    const hasError = Boolean(
     field.required && invalidFields.some((item) => item.key === field.key),
    );

    return (
     <label key={field.key} htmlFor={inputId} className="grid gap-1.5">
      <span className="text-sm font-black text-text-primary">
       {field.label}
       {field.required ? " *" : ""}
      </span>
      {field.description ? (
       <span className="text-xs font-semibold text-text-muted">
        {field.description}
       </span>
      ) : null}
      {field.kind === "textarea" || field.kind === "string-list" ? (
       <Textarea
        id={inputId}
        value={fieldValue}
        aria-invalid={hasError}
        className="min-h-24"
        onChange={(event) => updateValue(field.key, event.target.value)}
       />
      ) : field.kind === "boolean" ? (
       <select
        id={inputId}
        value={fieldValue}
        aria-invalid={hasError}
        className="h-10 rounded-lg border border-border-default bg-bg-primary px-3 text-sm font-semibold text-text-primary"
        onChange={(event) => updateValue(field.key, event.target.value)}
       >
        <option value="true">true</option>
        <option value="false">false</option>
       </select>
      ) : (
       <Input
        id={inputId}
        value={fieldValue}
        type={field.kind === "number" ? "number" : "text"}
        aria-invalid={hasError}
        onChange={(event) => updateValue(field.key, event.target.value)}
       />
      )}
      {field.kind === "string-list" ? (
       <span className="text-xs font-semibold text-text-muted">
        Mỗi dòng là một giá trị.
       </span>
      ) : null}
      {hasError ? (
       <span className="text-xs font-bold text-danger-text">
        Trường này không được để trống.
       </span>
      ) : null}
     </label>
    );
   })}
   {unsupportedFields.length > 0 ? (
    <div className="grid gap-2 rounded-xl border border-dashed border-warning/40 bg-warning-subtle p-3">
     <p className="text-xs font-black uppercase tracking-wide text-warning-text">
      Field chưa hỗ trợ edit trực tiếp
     </p>
     <div className="grid gap-1">
      {unsupportedFields.map((field) => (
       <p
        key={field.key}
        className="text-xs font-semibold leading-relaxed text-text-secondary"
       >
        <span className="font-black text-text-primary">{field.label}</span>
        {" · "}
        {field.reason}
       </p>
      ))}
     </div>
    </div>
   ) : null}
  </form>
 );
}
