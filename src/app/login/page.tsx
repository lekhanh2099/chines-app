"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useAppForm } from "@/components/tanstack-form/hooks/form";
import { TextField } from "@/components/tanstack-form/field/TextField";
import { PasswordField } from "@/components/tanstack-form/field/PasswordField";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen, LogIn, UserPlus } from "lucide-react";

const loginSchema = z.object({
 email: z.string().email("Email không hợp lệ"),
 password: z.string().min(6, "Mật khẩu phải từ 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
 const router = useRouter();
 // The original code had a `loading` state, but `useAppForm` provides `isSubmitting`.
 // We'll keep `loading` for now if it's used elsewhere, but `isSubmitting` is preferred for form submission.
 // For this specific change, the provided code snippet uses `loading` in the button,
 // so we'll reintroduce it as `useState(false)` to match the provided snippet's behavior.
 // However, the `onSubmit` function in the provided snippet also sets `setLoading(true)` and `setLoading(false)`.
 // This means `loading` will be controlled by the form's submission state.
 // Let's align with the provided snippet's logic.
 const [loading, setLoading] = useState(false); // Re-adding useState for loading as per the provided snippet
 const [isLogin, setIsLogin] = useState(true);

 const form = useAppForm({
  defaultValues: {
   email: "",
   password: "",
  } as LoginFormValues,
  validators: { onChange: loginSchema },
  onSubmit: async ({ value }) => {
   setLoading(true); // Set loading true at the start of submission
   const supabase = createClient();

   if (isLogin) {
    const { error } = await supabase.auth.signInWithPassword({
     email: value.email,
     password: value.password,
    });

    if (error) {
     toast.error("Đăng nhập thất bại", {
      description: error.message,
     });
     setLoading(false); // Set loading false on error
     return;
    }

    toast.success("Đăng nhập thành công");
    router.refresh();
   } else {
    const { error } = await supabase.auth.signUp({
     email: value.email,
     password: value.password,
    });

    if (error) {
     toast.error("Đăng ký thất bại", {
      description: error.message,
     });
     setLoading(false);
     return;
    }

    toast.success("Đăng ký thành công! Vui lòng kiểm tra email.");
    setIsLogin(true);
    form.reset();
    setLoading(false);
   }
  },
 });

 return (
  <div className="min-h-screen bg-bg-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
   <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
    <div className="w-12 h-12 bg-accent rounded-2xl  flex items-center justify-center mb-6 shadow">
     <BookOpen className="w-6 h-6 text-white" />
    </div>
    <h2 className="text-center text-2xl font-bold tracking-tight text-text-primary">
     {isLogin ? "Đăng nhập vào Hệ thống" : "Tạo tài khoản mới"}
    </h2>
    <p className="mt-2 text-center text-sm text-text-secondary">
     {isLogin
      ? "Vui lòng nhập email và mật khẩu để tiếp tục."
      : "Nhập email và mật khẩu để đăng ký tài khoản."}
    </p>
   </div>

   <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div className="bg-bg-card py-8 px-4 shadow-theme-sm border border-border-default sm:rounded-2xl  sm:px-10">
     <form
      className="space-y-6"
      onSubmit={(e) => {
       e.preventDefault();
       e.stopPropagation();
       form.handleSubmit();
      }}
     >
      <form.AppField name="email">
       {() => (
        <TextField
         label="Email"
         inputProps={{
          type: "email",
          autoComplete: "email",
          placeholder: "name@example.com",
         }}
        />
       )}
      </form.AppField>

      <form.AppField name="password">
       {() => (
        <PasswordField
         label="Mật khẩu"
         placeholder="••••••••"
         autoComplete={isLogin ? "current-password" : "new-password"}
        />
       )}
      </form.AppField>

      <form.Subscribe
       selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
       {([canSubmit, isSubmitting]) => (
        <Button
         type="submit"
         disabled={!canSubmit || isSubmitting || loading}
         isLoading={loading || isSubmitting}
         className="w-full mt-2"
        >
         {isLogin ? (
          <LogIn className="w-[18px] h-[18px]" />
         ) : (
          <UserPlus className="w-[18px] h-[18px]" />
         )}
         {isLogin ? "Đăng nhập" : "Đăng ký"}
        </Button>
       )}
      </form.Subscribe>

      <div className="text-center text-sm text-text-muted mt-6 border-t border-border-default pt-6 space-y-2">
       <p>
        {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
        <button
         type="button"
         onClick={() => {
          setIsLogin(!isLogin);
          form.reset();
         }}
         className="  hover:underline font-medium focus:outline-none"
        >
         {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
        </button>
       </p>
       <p className="text-xs opacity-70">
        *Tài khoản thử nghiệm sẽ được cung cấp bởi Admin.
       </p>
      </div>
     </form>
    </div>
   </div>
  </div>
 );
}
