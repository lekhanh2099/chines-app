import type { JsonObject } from "@/types/json";
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
  <div className="mt-1 flex items-start justify-between gap-1">
   {!isValid ? (
    <p className="text-xs text-danger-text">
     {errors
      .map((e) => (typeof e === "string" ? e : (e as JsonObject)?.message || String(e)))
      .join(", ")}
    </p>
   ) : helperText ? (
    <p className="text-xs text-text-muted">{helperText}</p>
   ) : null}
  </div>
 );
}
