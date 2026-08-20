import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";
import { IOptionValueSchema } from "@/types/option";
import { z } from "zod";
import { Input } from "@/components/ui/input";

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
   <Input
    id={field.name}
    value={field.state.value}
    onChange={(e) => field.handleChange(e.target.value)}
    onBlur={field.handleBlur}
    density="comfortable"
    surface="field"
    {...inputProps}
   />
  </FieldItem>
 );
}
