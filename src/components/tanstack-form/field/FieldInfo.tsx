import { Typography } from "@/components/ui/typography";
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
    <Typography as="p" variant="caption" tone="danger">
     {errors
      .map((e) => (typeof e === "string" ? e : (e as JsonObject)?.message || String(e)))
      .join(", ")}
    </Typography>
   ) : helperText ? (
    <Typography as="p" variant="caption" tone="muted">
     {helperText}
    </Typography>
   ) : null}
  </div>
 );
}
