import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

export function PasswordField({
 label,
 description,
 helperText,
 ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onBlur" | "type"> &
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
     className="w-full h-12 bg-bg-input border border-border-default text-text-primary placeholder:text-text-muted rounded-2xl  px-4 pr-12 text-base outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all"
     {...rest}
    />
    <IconButton
     variant="ghost"
     size="lg"
     aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
     title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
     onClick={() => setShowPassword((current) => !current)}
     className="absolute right-1 top-1/2 -translate-y-1/2"
    >
     {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </IconButton>
   </div>
  </FieldItem>
 );
}
