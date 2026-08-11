import { Label } from "@/components/ui/label";
import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Typography } from "@/components/ui/typography";

type ControlledRadioProps = {
 value?: never;
 onValueChange?: never;
};

export function RadioField({
 label,
 description,
 helperText,
 options,
 ...rest
}: Omit<React.ComponentProps<typeof RadioGroup>, keyof ControlledRadioProps> &
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
   <RadioGroup
    name={field.name}
    value={field.state.value}
    onValueChange={(value) => {
     field.handleChange(value);
     field.handleBlur();
    }}
    {...rest}
   >
    {options.map((option) => (
     <Label key={option.value} variant="label" className="cursor-pointer gap-2">
      <RadioGroupItem value={option.value} />
      <Typography as="span" variant="bodySmall" tone="secondary">
       {option.label}
      </Typography>
     </Label>
    ))}
   </RadioGroup>
  </FieldItem>
 );
}
