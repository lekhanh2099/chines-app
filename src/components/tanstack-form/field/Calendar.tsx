import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";

export function CalendarField({
 label,
 description,
 helperText,
 ...rest
}: Omit<
 React.InputHTMLAttributes<HTMLInputElement>,
 "value" | "onChange" | "onBlur" | "type"
> &
 Omit<FieldItemProps, "field">) {
 const field = useFieldContext<string>();

 return (
  <FieldItem
   field={field}
   label={label}
   description={description}
   required={rest?.required || false}
   helperText={helperText}
  >
   <input
    type="date"
    name={field.name}
    value={field.state.value || ""}
    onChange={(e) => field.handleChange(e.target.value)}
    onBlur={field.handleBlur}
    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl  px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700"
    {...rest}
   />
  </FieldItem>
 );
}
