"use client";

import CodeMirror from "@uiw/react-codemirror";
import { useState } from "react";
import { ZodError } from "zod";

import type { EditAdapter } from "../../adapters/types";

function jsonErrorMessage(error: unknown) {
 if (error instanceof SyntaxError) return "JSON chưa hợp lệ.";
 if (error instanceof ZodError) return error.issues[0]?.message ?? "JSON không đúng schema.";
 if (error instanceof Error) return error.message;
 return "Không thể đọc JSON.";
}

export function StructuredJsonEditor({
 value,
 adapter,
 formId,
 onSubmit,
}: {
 value: unknown;
 adapter: EditAdapter;
 formId: string;
 onSubmit: (value: unknown) => void;
}) {
 const [jsonValue, setJsonValue] = useState(() => JSON.stringify(value, null, 2));
 const [jsonError, setJsonError] = useState<string | null>(null);
 const submitJson = () => {
  try {
   const parsed: unknown = JSON.parse(jsonValue);
   adapter.toValues(parsed);
   setJsonError(null);
   onSubmit(parsed);
  } catch (error) {
   setJsonError(jsonErrorMessage(error));
  }
 };

 return (
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
 );
}
