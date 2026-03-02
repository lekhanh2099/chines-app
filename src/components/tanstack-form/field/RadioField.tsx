import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";

export function RadioField({
 label,
 description,
 helperText,
 options,
 ...rest
}: Omit<
 React.InputHTMLAttributes<HTMLInputElement>,
 "value" | "onChange" | "onBlur" | "type"
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
   <div className="flex flex-col gap-2 mt-2">
    {options.map((option) => (
     <label
      key={option.value}
      className="flex items-center gap-2 cursor-pointer"
     >
      <input
       type="radio"
       name={field.name}
       value={option.value}
       checked={field.state.value === option.value}
       onChange={() => field.handleChange(option.value)}
       onBlur={field.handleBlur}
       className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
      />
      <span className="text-sm text-slate-700">{option.label}</span>
     </label>
    ))}
   </div>
  </FieldItem>
 );
}
