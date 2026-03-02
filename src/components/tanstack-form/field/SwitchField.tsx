import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";

export function SwitchField({
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
   label=""
   description={description}
   required={rest?.required || false}
   helperText={helperText}
  >
   <label className="flex items-center gap-3 cursor-pointer mt-1">
    <div className="relative">
     <input
      type="checkbox"
      className="sr-only peer"
      name={field.name}
      checked={field.state.value}
      onChange={(e) => field.handleChange(e.target.checked)}
      onBlur={field.handleBlur}
      {...rest}
     />
     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
    </div>
    {label && (
     <span className="text-sm font-medium text-slate-700">{label}</span>
    )}
   </label>
  </FieldItem>
 );
}
