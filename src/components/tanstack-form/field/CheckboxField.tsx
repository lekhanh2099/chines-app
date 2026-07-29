import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Typography } from "@/components/ui/typography";

type ControlledCheckboxProps = {
 checked?: never;
 onCheckedChange?: never;
 onBlur?: never;
 name?: never;
};

export function CheckboxField({
 label,
 description,
 helperText,
 ...rest
}: Omit<React.ComponentProps<typeof Checkbox>, keyof ControlledCheckboxProps> &
 Omit<FieldItemProps, "field">) {
 const field = useFieldContext<boolean>();

 return (
  <FieldItem
   field={field}
   label={label}
   description={description}
   required={rest?.required || false}
   helperText={helperText}
  >
   <div className="mt-1 flex items-center gap-2">
    <Checkbox
     name={field.name}
     checked={field.state.value}
     onCheckedChange={(checked) => field.handleChange(checked === true)}
     onBlur={field.handleBlur}
     {...rest}
    />
    {label && (
     <Typography as="span" variant="bodySmall" tone="secondary">
      {label}
     </Typography>
    )}
   </div>
  </FieldItem>
 );
}
