"use client";

import { useId, type ReactNode, type TextareaHTMLAttributes } from "react";

import { useFieldContext } from "@/components/form/form-context";
import {
  FieldShell,
  getDescribedBy,
  getFieldError,
} from "@/components/form/fields/field-utils";
import { cn } from "@/lib/utils";

type FormTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "defaultValue" | "onChange" | "onBlur" | "name"
> & {
  label: string;
  description?: ReactNode;
  required?: boolean;
  textareaClassName?: string;
};

export function FormTextarea({
  id,
  label,
  description,
  required,
  textareaClassName,
  disabled,
  ...props
}: FormTextareaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = `${inputId}-error`;

  const field = useFieldContext<string>();
  const error = getFieldError(field.state.meta);

  return (
    <FieldShell
      inputId={inputId}
      label={label}
      required={required}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
    >
      <textarea
        id={inputId}
        name={field.name}
        value={field.state.value ?? ""}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={getDescribedBy(descriptionId, error ? errorId : undefined)}
        className={cn(
          "min-h-28 w-full resize-y rounded border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          textareaClassName,
        )}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        {...props}
      />
    </FieldShell>
  );
}
