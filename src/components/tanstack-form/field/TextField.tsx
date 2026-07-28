import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";
import { IOptionValueSchema } from "@/types/option";
import { z } from "zod";

type TextFieldOwnedProps = {
 required?: never;
 maxLength?: never;
 disabled?: never;
};

export function TextField({
 label,
 description,
 helperText,
 inputProps,
 ...rest
}: Omit<FieldItemProps, keyof TextFieldOwnedProps> & {
 inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
 const field = useFieldContext<z.infer<typeof IOptionValueSchema>>();

 return (
  <FieldItem
   field={field}
   label={label}
   description={description}
   helperText={helperText}
   {...rest}
  >
   <input
    value={field.state.value}
    onChange={(e) => field.handleChange(e.target.value)}
    onBlur={field.handleBlur}
    className="h-12 w-full rounded-2xl border border-border-default bg-bg-input px-4 text-base text-text-primary outline-none transition-all placeholder:text-text-muted focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20"
    {...inputProps}
   />
  </FieldItem>
 );
}
