import { Label } from "@/components/ui/label";
import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";

type ControlledSwitchProps = {
 checked?: never;
 onCheckedChange?: never;
 onBlur?: never;
 name?: never;
};

export function SwitchField({
 label,
 description,
 helperText,
 ...rest
}: Omit<React.ComponentProps<typeof Switch>, keyof ControlledSwitchProps> &
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
   <Label variant="label" className="cursor-pointer gap-3">
    <Switch
     name={field.name}
     checked={field.state.value}
     onCheckedChange={(checked) => field.handleChange(checked)}
     onBlur={field.handleBlur}
     {...rest}
    />
    {label ? (
     <Typography as="span" variant="bodySmall" tone="secondary">
      {label}
     </Typography>
    ) : null}
   </Label>
  </FieldItem>
 );
}
