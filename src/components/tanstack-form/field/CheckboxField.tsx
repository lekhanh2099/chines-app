import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";

export function CheckboxField({
 label,
 description,
 helperText,
 ...rest
}: Omit<
 React.InputHTMLAttributes<HTMLInputElement>,
 "value" | "onChange" | "onBlur" | "type"
> &
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
   <div className="flex items-center gap-2 mt-1">
    <input
     type="checkbox"
     name={field.name}
     checked={field.state.value}
     onChange={(e) => field.handleChange(e.target.checked)}
     onBlur={field.handleBlur}
     className="w-5 h-5 text-indigo-600 bg-slate-50 border-slate-300 rounded focus:ring-indigo-500"
     {...rest}
    />
    {label && (
     <span className="text-sm font-medium text-slate-700">{label}</span>
    )}
   </div>
  </FieldItem>
 );
}
