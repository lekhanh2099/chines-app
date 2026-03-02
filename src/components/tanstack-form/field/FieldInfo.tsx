import type { AnyFieldApi } from "@tanstack/react-form";

export function FieldInfo({
 field,
 helperText,
}: {
 field?: AnyFieldApi;
 helperText?: React.ReactNode;
}) {
 const errors = field?.state.meta.errors;
 const isValid = !errors || errors.length === 0;

 if (isValid && !helperText) return null;

 return (
  <div className="flex items-start justify-between gap-1 mt-1">
   {!isValid ? (
    <p className="text-xs text-rose-500">
     {errors
      .map((e) =>
       typeof e === "string"
        ? e
        : (e as Record<string, unknown>)?.message || String(e),
      )
      .join(", ")}
    </p>
   ) : helperText ? (
    <p className="text-xs text-slate-500">{helperText}</p>
   ) : null}
  </div>
 );
}
