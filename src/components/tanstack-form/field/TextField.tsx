import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";

export function TextField({
 label,
 description,
 helperText,
 inputProps,
 ...rest
}: Omit<FieldItemProps, "required" | "maxLength" | "disabled"> & {
 inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
 const field = useFieldContext<string | number>();

 return (
  <FieldItem
   field={field}
   label={label}
   description={description}
   helperText={helperText}
   {...rest}
  >
   <input
    value={field.state.value as string}
    onChange={(e) => field.handleChange(e.target.value)}
    onBlur={field.handleBlur}
    className="w-full h-12 bg-bg-input border border-border-default text-text-primary placeholder:text-text-muted rounded-2xl  px-4 text-base outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all"
    {...inputProps}
   />
  </FieldItem>
 );
}
