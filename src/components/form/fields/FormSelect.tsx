"use client";

import { useId, type ReactNode } from "react";

import { useFieldContext } from "@/components/form/form-context";
import { FieldShell, getDescribedBy, getFieldError } from "@/components/form/fields/field-utils";
import { OptionSelect } from "@/components/ui/option-select";
import type { IOption } from "@/types/option";
import { IOptionValueSchema } from "@/types/option";
import { z } from "zod";

type FormSelectValue = z.infer<z.ZodNullable<typeof IOptionValueSchema>>;

type FormSelectProps = {
 label: string;
 options: IOption[];
 placeholder?: string;
 description?: ReactNode;
 required?: boolean;
 disabled?: boolean;
};

export function FormSelect({
 label,
 options,
 placeholder = "Chọn một giá trị",
 description,
 required,
 disabled,
}: FormSelectProps) {
 const inputId = useId();
 const descriptionId = description ? `${inputId}-description` : undefined;
 const errorId = `${inputId}-error`;

 const field = useFieldContext<FormSelectValue>();
 const error = getFieldError(field.state.meta);

 const fieldValue = field.state.value;

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
   <div
    aria-invalid={error !== undefined}
    aria-describedby={getDescribedBy(descriptionId, error ? errorId : undefined)}
   >
    <OptionSelect
     value={fieldValue ?? undefined}
     options={options}
     placeholder={placeholder}
     disabled={disabled}
     invalid={error !== undefined}
     onValueChange={(value) => {
      field.handleChange(value);
      field.handleBlur();
     }}
    />
   </div>
  </FieldShell>
 );
}
