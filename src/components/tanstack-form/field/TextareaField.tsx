import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";
import { useId } from "react";

export function TextareaField({
 label,
 description,
 helperText,
 ...rest
}: Omit<
 React.TextareaHTMLAttributes<HTMLTextAreaElement>,
 "value" | "onChange" | "onBlur" | "className"
> &
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
   <textarea
    id={id}
    name={field.name}
    value={field.state.value}
    aria-invalid={!field.state.meta.isValid}
    onChange={(e) => field.handleChange(e.target.value)}
    onBlur={field.handleBlur}
    className="min-h-[120px] w-full resize-none rounded-2xl border border-border-default bg-bg-primary p-4 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
    {...rest}
   />
  </FieldItem>
 );
}
