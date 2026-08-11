"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";
import { useId, type ReactNode } from "react";

import { useFieldContext } from "@/components/form/form-context";
import { getDescribedBy, getFieldError } from "@/components/form/fields/field-utils";
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
   <Label htmlFor={inputId} variant="label" surface="fieldCard" className="cursor-pointer">
    <Checkbox
     id={inputId}
     name={field.name}
     checked={field.state.value}
     disabled={disabled}
     aria-invalid={Boolean(error)}
     aria-describedby={getDescribedBy(descriptionId, error ? errorId : undefined)}
     className="self-start translate-y-1"
     onBlur={field.handleBlur}
     onCheckedChange={(checked) => field.handleChange(checked === true)}
    />

    <span className="grid gap-1">
     <Typography as="span" tone="default" weight="black" className="inline-flex items-baseline gap-1">
      {label}
      {required ? (
       <Typography as="span" tone="danger">
        *
       </Typography>
      ) : null}
     </Typography>

     {description ? (
      <Typography id={descriptionId} variant="caption" tone="muted" weight="semibold">
       {description}
      </Typography>
     ) : null}
    </span>
   </Label>

   {error ? (
    <Typography as="p" id={errorId} role="alert" tone="danger" weight="bold">
     {error}
    </Typography>
   ) : null}
  </div>
 );
}
