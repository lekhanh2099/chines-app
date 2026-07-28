import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";

type ControlledRadioProps = {
 value?: never;
 onChange?: never;
 onBlur?: never;
 type?: never;
};

export function RadioField({
 label,
 description,
 helperText,
 options,
 ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof ControlledRadioProps> &
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
   <div className="mt-2 flex flex-col gap-2">
    {options.map((option) => (
     <label key={option.value} className="flex cursor-pointer items-center gap-2">
      <input
       type="radio"
       name={field.name}
       value={option.value}
       checked={field.state.value === option.value}
       onChange={() => field.handleChange(option.value)}
       onBlur={field.handleBlur}
       className="size-4 border-border-default text-primary focus:ring-primary"
      />
      <span className="text-text-secondary">{option.label}</span>
     </label>
    ))}
   </div>
  </FieldItem>
 );
}
