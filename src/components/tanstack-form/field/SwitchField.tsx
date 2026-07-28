import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";

type ControlledSwitchProps = {
 value?: never;
 onChange?: never;
 onBlur?: never;
 type?: never;
};

export function SwitchField({
 label,
 description,
 helperText,
 ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof ControlledSwitchProps> &
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
   <label className="mt-1 flex cursor-pointer items-center gap-3">
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
     <div className="peer h-6 w-11 rounded-full bg-bg-subtle transition-colors peer-checked:bg-accent peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-border-default after:bg-bg-primary after:content-[''] after:transition-all peer-checked:after:translate-x-full" />
    </div>
    {label && <span className="font-medium text-text-secondary">{label}</span>}
   </label>
  </FieldItem>
 );
}
