import { Label } from "@/components/ui/label";
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
    value={value}
    options={[{ value: "", label: "Tất cả" }, ...options]}
    onValueChange={onChange}
   />
  </Label>
 );
}
import { OptionSelect } from "@/components/ui/option-select";
import { Typography } from "@/components/ui/typography";
