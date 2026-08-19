import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";
import { useId } from "react";
import { Textarea } from "@/components/ui/textarea";

type ControlledTextareaProps = {
 value?: never;
 onChange?: never;
 onBlur?: never;
 className?: never;
};

export function TextareaField({
 label,
 description,
 helperText,
 ...rest
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof ControlledTextareaProps> &
 FieldItemProps) {
 const id = useId();
 const field = useFieldContext<string>();

 return (
  <FieldItem
   field={field}
   label={label}
   description={description}
   required={rest?.required || false}
   helperText={helperText}
  >
   <Textarea
    id={id}
    name={field.name}
    value={field.state.value}
    aria-invalid={!field.state.meta.isValid}
    onChange={(e) => field.handleChange(e.target.value)}
    onBlur={field.handleBlur}
    density="comfortable"
    resize="none"
    {...rest}
   />
  </FieldItem>
 );
}
