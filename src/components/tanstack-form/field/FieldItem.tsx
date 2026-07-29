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
  <div className="flex flex-col">
   {label && (
    <Label variant="label" tone="secondary" weight="semibold" className="mb-2">
     {label}{" "}
     {required && (
      <Typography as="span" tone="danger">
       *
      </Typography>
     )}
    </Label>
   )}
   {description && (
    <Typography as="p" variant="caption" tone="muted" className="mb-2">
     {description}
    </Typography>
   )}
   {children}
   <FieldInfo field={field} helperText={helperText} />
  </div>
 );
}
