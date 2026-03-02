import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField({
 label,
 description,
 helperText,
 ...rest
}: Omit<
 React.InputHTMLAttributes<HTMLInputElement>,
 "value" | "onChange" | "onBlur" | "type"
> &
 Omit<FieldItemProps, "field">) {
 const field = useFieldContext<string>();
 const [showPassword, setShowPassword] = useState(false);

 return (
  <FieldItem
   field={field}
   label={label}
   description={description}
   required={rest?.required || false}
   helperText={helperText}
  >
   <div className="relative">
    <input
     type={showPassword ? "text" : "password"}
     name={field.name}
     value={field.state.value || ""}
     onChange={(e) => field.handleChange(e.target.value)}
     onBlur={field.handleBlur}
     className="w-full h-12 bg-bg-input border border-border-default text-text-primary placeholder:text-text-muted rounded-xl px-4 pr-12 text-base outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all"
     {...rest}
    />
    <button
     type="button"
     onClick={() => setShowPassword(!showPassword)}
     className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
    >
     {showPassword ? (
      <EyeOff className="w-5 h-5" />
     ) : (
      <Eye className="w-5 h-5" />
     )}
    </button>
   </div>
  </FieldItem>
 );
}
