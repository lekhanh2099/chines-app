import { Label } from "@/components/ui/forms/label";
import { OptionSelect } from "@/components/ui/forms/option-select";
import { Typography } from "@/components/ui/display/typography";
import { useTranslations } from "next-intl";

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
 const t = useTranslations("Vocab");
 return (
  <Label variant="label" className="grid gap-1.5">
   <Typography as="span" variant="overline" tone="muted">
    {label}
   </Typography>
   <OptionSelect
    ariaLabel={label}
    value={value === "" ? allFilterOptionValue : value}
    options={[{ value: allFilterOptionValue, label: t("filters.all") }, ...options]}
    onValueChange={(nextValue) => onChange(nextValue === allFilterOptionValue ? "" : nextValue)}
   />
  </Label>
 );
}
