"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useAppForm } from "@/components/tanstack-form/hooks/form";
import { TextField } from "@/components/tanstack-form/field/TextField";
import { PasswordField } from "@/components/tanstack-form/field/PasswordField";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { BookOpen, LogIn, UserPlus } from "lucide-react";

const emailSchema = z.string().trim().toLowerCase().email("Email không hợp lệ");
const passwordLoginSchema = z.string().min(1, "Vui lòng nhập mật khẩu");
const strongPasswordSchema = z
 .string()
 .min(12, "Mật khẩu phải có ít nhất 12 ký tự")
 .regex(/[a-z]/, "Mật khẩu cần có chữ thường")
 .regex(/[A-Z]/, "Mật khẩu cần có chữ hoa")
 .regex(/[0-9]/, "Mật khẩu cần có chữ số")
 .regex(/[^A-Za-z0-9]/, "Mật khẩu cần có ký tự đặc biệt");

const loginSchema = z.object({
 email: emailSchema,
 password: passwordLoginSchema,
 confirmPassword: z.string(),
});

const signUpSchema = z
 .object({
  email: emailSchema,
  password: strongPasswordSchema,
  confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu"),
 })
 .refine((value) => value.password === value.confirmPassword, {
  message: "Mật khẩu nhập lại chưa khớp",
  path: ["confirmPassword"],
 });

type LoginFormValues = z.infer<typeof loginSchema>;

function GoogleIcon() {
 return (
  <svg viewBox="0 0 24 24" aria-hidden="true" data-icon="inline-start">
   <path
    fill="currentColor"
    d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.4a4.6 4.6 0 0 1-2 3v2.7h3.5c2-1.9 3.2-4.6 3.2-7.7Z"
   />
   <path
    fill="currentColor"
    d="M12 22c2.9 0 5.3-1 7-2.6l-3.5-2.7c-1 .7-2.2 1-3.5 1a6 6 0 0 1-5.6-4.1H2.8v2.8A10 10 0 0 0 12 22Z"
   />
   <path fill="currentColor" d="M6.4 13.6a6 6 0 0 1 0-3.2V7.6H2.8a10 10 0 0 0 0 8.8l3.6-2.8Z" />
   <path
    fill="currentColor"
    d="M12 6.2c1.6 0 3 .6 4.1 1.6l3.1-3A10 10 0 0 0 2.8 7.6l3.6 2.8A6 6 0 0 1 12 6.2Z"
   />
  </svg>
 );
}

export default function LoginPage() {
 const router = useRouter();
 const [oauthLoading, setOauthLoading] = useState(false);
 const [isLogin, setIsLogin] = useState(true);
 const activeSchema = useMemo(() => (isLogin ? loginSchema : signUpSchema), [isLogin]);

 useEffect(() => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("authError")) return;

  toast.error("Đăng nhập Google thất bại", {
   description: "Không thể tạo phiên đăng nhập. Vui lòng thử lại.",
  });
  url.searchParams.delete("authError");
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
 }, []);

 useEffect(() => {
  const supabase = createClient();
  let active = true;

  void supabase.auth.getUser().then(({ data }) => {
   if (active && data.user) router.replace(getSafeNextPath());
  });

  return () => {
   active = false;
  };
 }, [router]);

 function getSafeNextPath() {
  const next = new URL(window.location.href).searchParams.get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/";
 }

 async function signInWithGoogle() {
  setOauthLoading(true);
  const supabase = createClient();
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", getSafeNextPath());

  const { error } = await supabase.auth.signInWithOAuth({
   provider: "google",
   options: {
    redirectTo: callbackUrl.toString(),
   },
  });

  if (error) {
   toast.error("Không thể mở đăng nhập Google", {
    description: "Dịch vụ đăng nhập tạm thời không khả dụng. Vui lòng thử lại.",
   });
   setOauthLoading(false);
  }
 }

 const form = useAppForm({
  defaultValues: {
   email: "",
   password: "",
   confirmPassword: "",
  } as LoginFormValues,
  validators: { onChange: activeSchema, onSubmit: activeSchema },
  onSubmit: async ({ value }) => {
   const supabase = createClient();

   if (isLogin) {
    const { error } = await supabase.auth.signInWithPassword({
     email: value.email,
     password: value.password,
    });

    if (error) {
     toast.error("Đăng nhập thất bại", {
      description: "Email hoặc mật khẩu không đúng. Vui lòng thử lại.",
     });
     return;
    }

    toast.success("Đăng nhập thành công");
    router.replace(getSafeNextPath());
    router.refresh();
   } else {
    const { error } = await supabase.auth.signUp({
     email: value.email,
     password: value.password,
    });

    if (error) {
     toast.error("Đăng ký thất bại", {
      description: "Không thể tạo tài khoản. Hãy kiểm tra thông tin hoặc thử lại sau.",
     });
     return;
    }

    toast.success("Đăng ký thành công! Vui lòng kiểm tra email.");
    setIsLogin(true);
    form.reset();
   }
  },
 });

 return (
  <div className="min-h-screen bg-bg-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
   <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
    <div className="w-12 h-12 bg-accent rounded-2xl  flex items-center justify-center mb-6 shadow">
     <BookOpen className="w-6 h-6  " />
    </div>
    <h2 className="text-center text-2xl font-bold tracking-tight text-text-primary">
     {isLogin ? "Đăng nhập vào Hệ thống" : "Tạo tài khoản mới"}
    </h2>
    <p className="mt-2 text-center  text-text-secondary">
     {isLogin
      ? "Vui lòng nhập email và mật khẩu để tiếp tục."
      : "Nhập email và mật khẩu để đăng ký tài khoản."}
    </p>
   </div>

   <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div className="bg-bg-card py-8 px-4 shadow-theme-sm border border-border-default sm:rounded-2xl  sm:px-10">
     <Button
      type="button"
      variant="outline"
      className="mb-6 w-full"
      disabled={oauthLoading}
      onClick={signInWithGoogle}
     >
      {oauthLoading ? <Spinner data-icon="inline-start" /> : <GoogleIcon />}
      Tiếp tục với Google
     </Button>

     <div className="mb-6 flex items-center gap-3 text-xs text-text-muted" aria-hidden="true">
      <span className="h-px flex-1 bg-border-default" />
      hoặc dùng email
      <span className="h-px flex-1 bg-border-default" />
     </div>

     <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
       e.preventDefault();
       e.stopPropagation();
       form.handleSubmit();
      }}
     >
      <FieldGroup>
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
          helperText={
           isLogin ? undefined : "Ít nhất 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
          }
         />
        )}
       </form.AppField>

       {!isLogin && (
        <form.AppField name="confirmPassword">
         {() => (
          <PasswordField
           label="Nhập lại mật khẩu"
           placeholder="••••••••••••"
           autoComplete="new-password"
          />
         )}
        </form.AppField>
       )}
      </FieldGroup>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
       {([canSubmit, isSubmitting]) => (
        <Button
         type="submit"
         disabled={!canSubmit || isSubmitting || oauthLoading}
         className="w-full mt-2"
        >
         {isSubmitting ? (
          <Spinner data-icon="inline-start" />
         ) : isLogin ? (
          <LogIn data-icon="inline-start" />
         ) : (
          <UserPlus data-icon="inline-start" />
         )}
         {isLogin ? "Đăng nhập" : "Đăng ký"}
        </Button>
       )}
      </form.Subscribe>

      <div className="mt-6 flex flex-col gap-2 border-t border-border-default pt-6 text-center text-text-muted">
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
      </div>
     </form>
    </div>
   </div>
  </div>
 );
}
