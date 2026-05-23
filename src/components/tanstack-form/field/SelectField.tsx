import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";

export function SelectField({
 label,
 description,
 helperText,
 options,
 ...rest
}: Omit<
 React.SelectHTMLAttributes<HTMLSelectElement>,
 "value" | "onChange" | "onBlur"
> &
 Omit<FieldItemProps, "field"> & {
  options: { label: string; value: string }[];
 }) {
 const field = useFieldContext<string>();

 return (
  <FieldItem
   field={field}
   label={label}
   description={description}
   required={rest?.required || false}
   helperText={helperText}
  >
   <select
    name={field.name}
    value={field.state.value}
    onChange={(e) => field.handleChange(e.target.value)}
    onBlur={field.handleBlur}
    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl  px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
    {...rest}
   >
    <option value="" disabled>
     Select an option...
    </option>
    {options.map((option) => (
     <option key={option.value} value={option.value}>
      {option.label}
     </option>
    ))}
   </select>
  </FieldItem>
 );
}
