"use client";

import { Label } from "@/components/ui/forms/label";
import { Switch } from "@/components/ui/forms/switch";
import { Typography } from "@/components/ui/display/typography";

export function SettingsToggleRow({
 id,
 label,
 description,
 checked,
 onCheckedChange,
}: {
 id: string;
 label: string;
 description: string;
 checked: boolean;
 onCheckedChange(checked: boolean): void;
}) {
 return (
  <div className="flex min-w-0 items-center justify-between gap-4 py-3">
   <div className="grid min-w-0 gap-1">
    <Label htmlFor={id} variant="label" weight="bold">
     {label}
    </Label>
    <Typography as="p" variant="bodySmall" tone="muted">
     {description}
    </Typography>
   </div>
   <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
 );
}
