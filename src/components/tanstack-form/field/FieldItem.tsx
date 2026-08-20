import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";
import type { AnyFieldApi } from "@tanstack/react-form";
import { FieldInfo } from "./FieldInfo";

export type FieldItemProps = {
 label?: React.ReactNode;
 description?: React.ReactNode;
 required?: boolean;
 helperText?: React.ReactNode;
 field?: AnyFieldApi;
};

export function FieldItem({
 field,
 children,
 label,
 description,
 required,
 helperText,
}: FieldItemProps & { children: React.ReactNode }) {
 "use no memo";
 return (
  <div className="grid gap-2">
   {label ? (
    <Label
     variant="label"
     tone="secondary"
     weight="semibold"
     className="gap-1"
     htmlFor={field?.name}
    >
     {label}
     {required ? (
      <Typography as="span" tone="danger">
       *
      </Typography>
     ) : null}
    </Label>
   ) : null}
   {description ? (
    <Typography as="p" variant="caption" tone="muted">
     {description}
    </Typography>
   ) : null}
   {children}
   <FieldInfo field={field} helperText={helperText} />
  </div>
 );
}
