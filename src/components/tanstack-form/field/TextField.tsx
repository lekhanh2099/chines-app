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
    className="h-12 w-full rounded-2xl border border-border-default bg-bg-input px-4 text-base text-text-primary outline-none transition-all placeholder:text-text-muted focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20"
    {...inputProps}
   />
  </FieldItem>
 );
}
