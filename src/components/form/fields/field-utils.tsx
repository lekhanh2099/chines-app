import type { JsonFieldValue } from "@/types/json";
import type { ReactNode } from "react";
import { z } from "zod";

import { cn } from "@/lib/utils";
type OptionalText = z.infer<z.ZodOptional<z.ZodString>>;

export function getFieldError(meta: { isValid: boolean; errors: JsonFieldValue[] }): OptionalText {
 if (meta.isValid || meta.errors.length === 0) return undefined;

 return meta.errors
  .map((error) => String(error))
  .filter(Boolean)
  .join(", ");
}

export function getDescribedBy(...ids: OptionalText[]) {
 const value = ids.filter(Boolean).join(" ");
 return value || undefined;
}

type FieldShellProps = {
 inputId: string;
 label: string;
 required?: boolean;
 description?: ReactNode;
 descriptionId?: string;
 error?: string;
 errorId?: string;
 children: ReactNode;
 className?: string;
};

export function FieldShell({
 inputId,
 label,
 required,
 description,
 descriptionId,
 error,
 errorId,
 children,
 className,
}: FieldShellProps) {
 return (
  <div className={cn("grid gap-2", className)}>
   <label htmlFor={inputId} className="font-black text-text-primary">
    {label}
    {required && <span className="ml-1 text-destructive">*</span>}
   </label>

   {children}

   {description && (
    <p id={descriptionId} className="text-xs font-semibold text-text-muted">
     {description}
    </p>
   )}

   {error && (
    <p id={errorId} role="alert" className=" font-bold text-destructive">
     {error}
    </p>
   )}
  </div>
 );
}
