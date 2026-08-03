import { Typography } from "@/components/ui/typography";
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
      .map((error) => {
       if (typeof error === "string") return error;
       if (error instanceof Error) return error.message;
       if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
       ) {
        return error.message;
       }
       return "Giá trị không hợp lệ.";
      })
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
