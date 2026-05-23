"use client";

import { useId, type ReactNode } from "react";

import { useFieldContext } from "@/components/form/form-context";
import {
 getDescribedBy,
 getFieldError,
} from "@/components/form/fields/field-utils";
import { cn } from "@/lib/utils";

type FormCheckboxProps = {
 label: string;
 description?: ReactNode;
 disabled?: boolean;
 required?: boolean;
 className?: string;
};

export function FormCheckbox({
 label,
 description,
 disabled,
 required,
 className,
}: FormCheckboxProps) {
 const inputId = useId();
 const descriptionId = description ? `${inputId}-description` : undefined;
 const errorId = `${inputId}-error`;

 const field = useFieldContext<boolean>();
 const error = getFieldError(field.state.meta);

 return (
  <div className={cn("grid gap-2", className)}>
   <label
    htmlFor={inputId}
    className="flex cursor-pointer items-start gap-3 rounded-2xl -lg border border-border-default bg-bg-primary p-3"
   >
    <input
     id={inputId}
     name={field.name}
     type="checkbox"
     checked={Boolean(field.state.value)}
     disabled={disabled}
     aria-invalid={Boolean(error)}
     aria-describedby={getDescribedBy(
      descriptionId,
      error ? errorId : undefined,
     )}
     className="mt-1 size-4 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
     onBlur={field.handleBlur}
     onChange={(event) => field.handleChange(event.target.checked)}
    />

    <span className="grid gap-1">
     <span className="text-sm font-black text-text-primary">
      {label}
      {required && <span className="ml-1 text-destructive">*</span>}
     </span>

     {description && (
      <span
       id={descriptionId}
       className="text-xs font-semibold text-text-muted"
      >
       {description}
      </span>
     )}
    </span>
   </label>

   {error && (
    <p id={errorId} role="alert" className="text-sm font-bold text-destructive">
     {error}
    </p>
   )}
  </div>
 );
}
