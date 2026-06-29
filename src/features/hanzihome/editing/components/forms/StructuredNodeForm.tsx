"use client";

import { Popover } from "@base-ui/react";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo, useState } from "react";
import { Check, ChevronDown, FileJson, ListChecks, Search, X } from "lucide-react";
import { z, ZodError } from "zod";

import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type { EditAdapter } from "../../adapters/types";

export type StructuredNodeFormProps = {
 value: unknown;
 adapter: EditAdapter;
 formId: string;
 onSubmit: (value: unknown) => void;
};

type EditMode = "fields" | "json";
type OptionalFieldGroup = {
 label: string;
 keys: string[];
};

function jsonErrorMessage(error: unknown) {
 if (error instanceof SyntaxError) return "JSON chưa hợp lệ.";
 if (error instanceof ZodError) return error.issues[0]?.message ?? "JSON không đúng schema.";
 if (error instanceof Error) return error.message;
 return "Không thể đọc JSON.";
}

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
 const [mode, setMode] = useState<EditMode>("fields");
 const [visibleFieldKeys, setVisibleFieldKeys] = useState(() => new Set(defaultVisibleFieldKeys));
 const [jsonValue, setJsonValue] = useState(() => JSON.stringify(value, null, 2));
 const [jsonError, setJsonError] = useState<string | null>(null);
 const visibleFields = useMemo(
  () => editableFields.filter((field) => visibleFieldKeys.has(field.key)),
  [editableFields, visibleFieldKeys],
 );
 const selectedOptionalGroups = useMemo(
  () => optionalFieldGroups.filter((fieldGroup) =>
   fieldGroup.keys.every((key) => visibleFieldKeys.has(key)),
  ),
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
 const showAllOptionalFields = () => {
  setVisibleFieldKeys(new Set(editableFields.map((field) => field.key)));
 };
 const resetOptionalFields = () => {
  setVisibleFieldKeys(new Set(defaultVisibleFieldKeys));
 };
 const toggleOptionalFieldGroup = (keys: string[], checked: boolean) => {
  setVisibleFieldKeys((current) => {
   const next = new Set(current);
   for (const key of keys) {
    if (checked) {
     next.add(key);
    } else {
     next.delete(key);
    }
   }
   return next;
  });
 };
 const submitJson = () => {
  try {
   const parsed = JSON.parse(jsonValue);
   adapter.toValues(parsed);
   setJsonError(null);
   onSubmit(parsed);
  } catch (error) {
   setJsonError(jsonErrorMessage(error));
  }
 };

 return (
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
     {optionalFieldGroups.length > 0 ? (
      <OptionalFieldsMultiSelect
       groups={optionalFieldGroups}
       selectedGroups={selectedOptionalGroups}
       selectedKeys={visibleFieldKeys}
       onToggleGroup={toggleOptionalFieldGroup}
       onReset={resetOptionalFields}
       onSelectAll={showAllOptionalFields}
      />
     ) : null}

     {visibleFields.map((field, index) => {
      const previousGroup = visibleFields[index - 1]?.group;
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
   ) : (
    <form
     id={formId}
     className="grid gap-3"
     onSubmit={(event) => {
      event.preventDefault();
      submitJson();
     }}
    >
     <label id="hanzihome-json-edit-label" className="text-sm font-bold text-text-primary">
      JSON
     </label>
     <div className="h-[clamp(26rem,58dvh,42rem)] overflow-hidden rounded-xl border border-border-default bg-bg-primary shadow-inner focus-within:ring-2 focus-within:ring-ring [&_.cm-activeLine]:bg-primary/5 [&_.cm-activeLineGutter]:bg-primary/10 [&_.cm-content]:min-h-full [&_.cm-content]:py-3 [&_.cm-editor]:h-full [&_.cm-editor]:bg-bg-primary [&_.cm-focused]:outline-none [&_.cm-gutters]:border-border-default [&_.cm-gutters]:bg-bg-elevated/70 [&_.cm-line]:px-3 [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-xs [&_.cm-theme-light]:h-full">
      <CodeMirror
       aria-labelledby="hanzihome-json-edit-label"
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
       placeholder={`{\n  "id": "..."\n}`}
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
 );
}

function OptionalFieldsMultiSelect({
 groups,
 selectedGroups,
 selectedKeys,
 onReset,
 onSelectAll,
 onToggleGroup,
}: {
 groups: OptionalFieldGroup[];
 selectedGroups: OptionalFieldGroup[];
 selectedKeys: Set<string>;
 onReset: () => void;
 onSelectAll: () => void;
 onToggleGroup: (keys: string[], checked: boolean) => void;
}) {
 const [open, setOpen] = useState(false);
 const [query, setQuery] = useState("");
 const filteredGroups = useMemo(() => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return groups;
  return groups.filter((fieldGroup) => fieldGroup.label.toLowerCase().includes(normalizedQuery));
 }, [groups, query]);
 const firstSelectedGroup = selectedGroups[0];
 const remainingSelectedCount = Math.max(0, selectedGroups.length - 1);

 return (
  <section className="grid gap-2">
   <div className="flex items-center justify-between gap-2">
    <div>
     <h3 className="text-sm font-bold text-text-primary">Field optional</h3>
     <p className="text-xs text-text-muted">Mặc định chỉ hiện field đang dùng trong UI học.</p>
    </div>
    <Button type="button" variant="ghost" size="sm" onClick={onReset}>
     Mặc định
    </Button>
   </div>
   <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
    <Popover.Trigger
     className={cn(
      "flex min-h-12 w-full min-w-0 items-center gap-2 rounded-lg border border-border-default bg-bg-primary px-2 py-1.5 text-left shadow-xs transition-colors outline-none hover:bg-bg-subtle focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
      open && "border-primary/60 ring-3 ring-primary/15",
     )}
    >
     <div className="flex min-w-0 flex-1 items-center gap-2">
      {firstSelectedGroup ? (
       <span className="flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-border-default bg-bg-subtle px-2 py-1 text-sm font-bold text-text-primary">
        <span className="min-w-0 truncate">{firstSelectedGroup.label}</span>
        <button
         type="button"
         className="rounded-full text-text-muted hover:text-text-primary"
         onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggleGroup(firstSelectedGroup.keys, false);
         }}
         aria-label={`Ẩn ${firstSelectedGroup.label}`}
        >
         <X className="h-3.5 w-3.5" />
        </button>
       </span>
      ) : (
       <span className="px-1 text-sm font-semibold text-text-muted">Chọn field optional...</span>
      )}
      {remainingSelectedCount > 0 ? (
       <span className="rounded-full border border-border-default bg-bg-subtle px-2 py-1 text-sm font-bold text-text-secondary">
        +{remainingSelectedCount}
       </span>
      ) : null}
     </div>
     <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
    </Popover.Trigger>
    <Popover.Portal>
     <Popover.Positioner
      side="bottom"
      align="start"
      sideOffset={8}
      collisionPadding={12}
      positionMethod="fixed"
      style={{ zIndex: 9999 }}
     >
      <Popover.Popup
       initialFocus={false}
       finalFocus={false}
       className="w-[min(36rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border-default bg-bg-elevated shadow-theme-lg"
      >
       <div className="grid gap-3 p-3">
        <div className="relative">
         <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
         <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm field optional..."
          className="pl-9"
         />
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
         <button
          type="button"
          className="font-bold text-primary underline-offset-4 hover:underline"
          onClick={onReset}
         >
          Unselect all
         </button>
         <button
          type="button"
          className="font-bold text-primary underline-offset-4 hover:underline"
          onClick={onSelectAll}
         >
          Select all
         </button>
        </div>
       </div>
       <div className="max-h-72 overflow-y-auto border-t border-border-default py-1 scrollbar-soft">
        {filteredGroups.length > 0 ? (
         filteredGroups.map((fieldGroup) => {
          const checked = fieldGroup.keys.every((key) => selectedKeys.has(key));
          return (
           <button
            key={fieldGroup.label}
            type="button"
            className={cn(
             "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold transition-colors",
             checked
              ? "bg-bg-primary text-text-primary"
              : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary",
            )}
            onClick={() => onToggleGroup(fieldGroup.keys, !checked)}
           >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border-default">
             {checked ? <Check className="h-4 w-4 text-primary" /> : null}
            </span>
            <span className="min-w-0 flex-1 truncate">{fieldGroup.label}</span>
            {fieldGroup.keys.length > 1 ? (
             <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-xs text-text-muted">
              {fieldGroup.keys.length}
             </span>
            ) : null}
           </button>
          );
         })
        ) : (
         <p className="px-4 py-6 text-center text-sm font-semibold text-text-muted">
          Không có field phù hợp.
         </p>
        )}
       </div>
      </Popover.Popup>
     </Popover.Positioner>
    </Popover.Portal>
   </Popover.Root>
  </section>
 );
}
