"use client";

import { Textarea } from "@/components/ui/textarea";
import { useId, type ComponentProps, type ReactNode } from "react";

import { useFieldContext } from "@/components/form/form-context";
import { FieldShell, getDescribedBy, getFieldError } from "@/components/form/fields/field-utils";

type ControlledTextareaProps = {
 value?: never;
 defaultValue?: never;
 onChange?: never;
 onBlur?: never;
 name?: never;
};
type FormTextareaProps = Omit<ComponentProps<typeof Textarea>, keyof ControlledTextareaProps> & {
 label: string;
 description?: ReactNode;
 required?: boolean;
};

export function FormTextarea({
 id,
 label,
 description,
 required,
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
   <Textarea
    id={inputId}
    name={field.name}
    value={field.state.value ?? ""}
    disabled={disabled}
    aria-invalid={Boolean(error)}
    aria-describedby={getDescribedBy(descriptionId, error ? errorId : undefined)}
    onBlur={field.handleBlur}
    onChange={(event) => field.handleChange(event.target.value)}
    {...props}
   />
  </FieldShell>
 );
}
