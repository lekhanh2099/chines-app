"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";

import { Input, type InputProps } from "@/components/ui/input";
import { useFieldContext } from "@/components/form/form-context";
import {
  FieldShell,
  getDescribedBy,
  getFieldError,
} from "@/components/form/fields/field-utils";

type FormTextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "onBlur" | "name"
> & {
  label: string;
  description?: ReactNode;
  required?: boolean;
  inputClassName?: InputProps["className"];
};

export function FormTextField({
  id,
  label,
  description,
  required,
  inputClassName,
  disabled,
  ...props
}: FormTextFieldProps) {
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
      <Input
        id={inputId}
        name={field.name}
        value={field.state.value ?? ""}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={getDescribedBy(descriptionId, error ? errorId : undefined)}
        className={inputClassName}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        {...props}
      />
    </FieldShell>
  );
}
