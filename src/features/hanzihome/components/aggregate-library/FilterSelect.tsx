import { Label } from "@/components/ui/label";
import { OptionSelect } from "@/components/ui/option-select";
import { Typography } from "@/components/ui/typography";

const allFilterOptionValue = "__all__";

export function FilterSelect({
 label,
 value,
 options,
 onChange,
}: {
 label: string;
 value: string;
 options: Array<{ value: string; label: string }>;
 onChange: (value: string) => void;
}) {
 return (
  <Label variant="label" className="grid gap-1.5">
   <Typography as="span" variant="overline" tone="muted">
    {label}
   </Typography>
   <OptionSelect
    ariaLabel={label}
    value={value === "" ? allFilterOptionValue : value}
    options={[{ value: allFilterOptionValue, label: "Tất cả" }, ...options]}
    onValueChange={(nextValue) => onChange(nextValue === allFilterOptionValue ? "" : nextValue)}
   />
  </Label>
 );
}
