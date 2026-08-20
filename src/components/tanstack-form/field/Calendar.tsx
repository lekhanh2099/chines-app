import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";
import { Input } from "@/components/ui/input";

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
   <Input
    id={field.name}
    type="date"
    name={field.name}
    value={field.state.value || ""}
    onChange={(e) => field.handleChange(e.target.value)}
    onBlur={field.handleBlur}
    density="comfortable"
    {...rest}
   />
  </FieldItem>
 );
}
