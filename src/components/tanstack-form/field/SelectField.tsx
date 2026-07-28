import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";

type ControlledSelectProps = {
 value?: never;
 onChange?: never;
 onBlur?: never;
};

export function SelectField({
 label,
 description,
 helperText,
 options,
 ...rest
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, keyof ControlledSelectProps> &
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
    className="h-12 w-full appearance-none rounded-2xl border border-border-default bg-bg-primary px-4 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
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
