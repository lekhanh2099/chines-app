import type { FieldItemProps } from "./FieldItem";
import { FieldItem } from "./FieldItem";
import { useFieldContext } from "../hooks/form-context";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";

type ControlledPasswordProps = {
 value?: never;
 onChange?: never;
 onBlur?: never;
 type?: never;
};

export function PasswordField({
 label,
 description,
 helperText,
 ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof ControlledPasswordProps> &
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
    <Input
     type={showPassword ? "text" : "password"}
     name={field.name}
     value={field.state.value || ""}
     onChange={(e) => field.handleChange(e.target.value)}
     onBlur={field.handleBlur}
     density="comfortable"
     surface="field"
     adornment="end"
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
