import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";
import { OptionSelect } from "@/components/ui/option-select";
import type { IOption } from "@/types/option";

type ControlledSelectProps = {
 value?: never;
 onValueChange?: never;
 options?: never;
};

export function SelectField({
 label,
 description,
 helperText,
 options,
 ...rest
}: Omit<React.ComponentProps<typeof OptionSelect>, keyof ControlledSelectProps> &
 Omit<FieldItemProps, "field"> & {
  options: IOption[];
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
   <OptionSelect
    value={field.state.value}
    options={options}
    onValueChange={(value) => {
     field.handleChange(value);
     field.handleBlur();
    }}
    {...rest}
   />
  </FieldItem>
 );
}
