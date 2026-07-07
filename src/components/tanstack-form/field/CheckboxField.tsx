import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";

export function CheckboxField({
 label,
 description,
 helperText,
 ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onBlur" | "type"> &
 Omit<FieldItemProps, "field">) {
 const field = useFieldContext<boolean>();

 return (
  <FieldItem
   field={field}
   label={label}
   description={description}
   required={rest?.required || false}
   helperText={helperText}
  >
   <div className="mt-1 flex items-center gap-2">
    <input
     type="checkbox"
     name={field.name}
     checked={field.state.value}
     onChange={(e) => field.handleChange(e.target.checked)}
     onBlur={field.handleBlur}
     className="size-5 rounded-2xl border-border-default bg-bg-primary text-primary focus:ring-primary"
     {...rest}
    />
    {label && <span className="font-medium text-text-secondary">{label}</span>}
   </div>
  </FieldItem>
 );
}
