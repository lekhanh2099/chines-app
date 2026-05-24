"use client";

import { useId, type ReactNode } from "react";

import { useFieldContext } from "@/components/form/form-context";
import {
 getDescribedBy,
 getFieldError,
} from "@/components/form/fields/field-utils";
import { cn } from "@/lib/utils";

type FormSwitchProps = {
 label: string;
 description?: ReactNode;
 disabled?: boolean;
 required?: boolean;
 className?: string;
};

export function FormSwitch({
 label,
 description,
 disabled,
 required,
 className,
}: FormSwitchProps) {
 const inputId = useId();
 const descriptionId = description ? `${inputId}-description` : undefined;
 const errorId = `${inputId}-error`;

 const field = useFieldContext<boolean>();
 const error = getFieldError(field.state.meta);
 const checked = Boolean(field.state.value);

 return (
  <div className={cn("grid gap-2", className)}>
   <div className="flex items-start justify-between gap-4 rounded-2xl -lg border border-border-default bg-bg-primary p-3">
    <label htmlFor={inputId} className="grid cursor-pointer gap-1">
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
    </label>

    <button
     id={inputId}
     type="button"
     role="switch"
     aria-checked={checked}
     aria-invalid={Boolean(error)}
     aria-describedby={getDescribedBy(
      descriptionId,
      error ? errorId : undefined,
     )}
     disabled={disabled}
     className={cn(
      "relative h-6 w-11 shrink-0 rounded-full border border-border-default transition-colors disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-primary" : "bg-bg-subtle",
     )}
     onBlur={field.handleBlur}
     onClick={() => field.handleChange(!checked)}
    >
     <span
      className={cn(
       "absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-bg-primary shadow-theme-sm transition-transform",
       checked ? "translate-x-5" : "translate-x-0.5",
      )}
     />
    </button>
   </div>

   {error && (
    <p id={errorId} role="alert" className="text-sm font-bold text-destructive">
     {error}
    </p>
   )}
  </div>
 );
}
