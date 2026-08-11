"use client";

import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";
import { useId, type ReactNode } from "react";

import { useFieldContext } from "@/components/form/form-context";
import { getDescribedBy, getFieldError } from "@/components/form/fields/field-utils";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type FormSwitchProps = {
 label: string;
 description?: ReactNode;
 disabled?: boolean;
 required?: boolean;
 className?: string;
};

export function FormSwitch({ label, description, disabled, required, className }: FormSwitchProps) {
 const inputId = useId();
 const descriptionId = description ? `${inputId}-description` : undefined;
 const errorId = `${inputId}-error`;

 const field = useFieldContext<boolean>();
 const error = getFieldError(field.state.meta);
 const checked = Boolean(field.state.value);

 return (
  <div className={cn("grid gap-2", className)}>
   <Label
    htmlFor={inputId}
    variant="label"
    surface="fieldCard"
    className="cursor-pointer justify-between gap-4"
   >
    <span className="grid min-w-0 gap-1">
     <Typography
      as="span"
      tone="default"
      weight="black"
      className="inline-flex items-baseline gap-1"
     >
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

    <Switch
     id={inputId}
     checked={checked}
     aria-invalid={Boolean(error)}
     aria-describedby={getDescribedBy(descriptionId, error ? errorId : undefined)}
     disabled={disabled}
     onBlur={field.handleBlur}
     onCheckedChange={field.handleChange}
    />
   </Label>

   {error ? (
    <Typography as="p" id={errorId} role="alert" tone="danger" weight="bold">
     {error}
    </Typography>
   ) : null}
  </div>
 );
}
