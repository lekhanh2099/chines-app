import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";

type ControlledCalendarProps = {
 value?: never;
 onChange?: never;
 onBlur?: never;
 type?: never;
};

export function CalendarField({
 label,
 description,
 helperText,
 ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof ControlledCalendarProps> &
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
    className="h-12 w-full rounded-2xl border border-border-default bg-bg-primary px-4 text-text-secondary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
    {...rest}
   />
  </FieldItem>
 );
}
