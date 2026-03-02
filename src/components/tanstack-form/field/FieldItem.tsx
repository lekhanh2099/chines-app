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
    <label className="text-sm font-semibold text-text-secondary mb-2">
     {label} {required && <span className="text-danger-text">*</span>}
    </label>
   )}
   {description && (
    <p className="text-xs text-text-muted mb-2">{description}</p>
   )}
   {children}
   <FieldInfo field={field} helperText={helperText} />
  </div>
 );
}
