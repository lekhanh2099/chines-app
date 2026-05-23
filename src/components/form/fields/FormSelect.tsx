"use client";

import { useId, type ReactNode } from "react";

import { Select as SimpleSelect } from "@/components/ui/select/index";
import { useFieldContext } from "@/components/form/form-context";
import {
  FieldShell,
  getDescribedBy,
  getFieldError,
} from "@/components/form/fields/field-utils";
import type { IOption } from "@/types/option";

type FormSelectValue = IOption["value"] | null;

type FormSelectProps = {
  label: string;
  options: IOption[];
  placeholder?: string;
  description?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
};

function stringifyValue(value: IOption["value"]) {
  return String(value);
}

export function FormSelect({
  label,
  options,
  placeholder = "Chọn một giá trị",
  description,
  required,
  disabled,
  triggerClassName,
  contentClassName,
}: FormSelectProps) {
  const inputId = useId();
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = `${inputId}-error`;

  const field = useFieldContext<FormSelectValue>();
  const error = getFieldError(field.state.meta);

  const fieldValue = field.state.value;

  const selectedOption =
    fieldValue === null
      ? null
      : options.find(
          (option) =>
            stringifyValue(option.value) === stringifyValue(fieldValue),
        ) ?? null;

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
        aria-invalid={Boolean(error)}
        aria-describedby={getDescribedBy(
          descriptionId,
          error ? errorId : undefined,
        )}
      >
        <SimpleSelect
          selectValue={selectedOption}
          options={options}
          triggerPlaceholder={placeholder}
          triggerClassName={triggerClassName}
          contentClassName={contentClassName}
          disabled={disabled}
          onChange={(option) => {
            field.handleChange(option?.value ?? null);
            field.handleBlur();
          }}
        />
      </div>
    </FieldShell>
  );
}
