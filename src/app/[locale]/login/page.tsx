"use client";

import { Typography } from "@/components/ui/typography";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";
import { useClientSession } from "@/components/providers/QueryProvider";
import { useAppForm } from "@/components/tanstack-form/hooks/form";
import { TextField } from "@/components/tanstack-form/field/TextField";
import { PasswordField } from "@/components/tanstack-form/field/PasswordField";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import {
 defaultAppLocale,
 isAppLocale,
 localizePathname,
 stripLocaleFromPathname,
} from "@/i18n/config";
import { buildOAuthCallbackUrl } from "@/lib/auth/oauth-callback-url";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { toast } from "sonner";
import { BookOpen, LogIn, UserPlus } from "lucide-react";

type LoginFormValues = {
 email: string;
 password: string;
 confirmPassword: string;
};

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
 const { supabase, user, isResolved } = useClientSession();
 const requestedLocale = useLocale();
 const locale = isAppLocale(requestedLocale) ? requestedLocale : defaultAppLocale;
 const t = useTranslations("Auth");
 const [oauthLoading, setOauthLoading] = useState(false);
 const [isLogin, setIsLogin] = useState(true);
 const schemas = useMemo(() => {
  const emailSchema = z
   .string()
   .trim()
   .toLowerCase()
   .pipe(z.email(t("validation.invalidEmail")));
  const passwordLoginSchema = z.string().min(1, t("validation.passwordRequired"));
  const strongPasswordSchema = z
   .string()
   .min(12, t("validation.passwordMin"))
   .regex(/[a-z]/, t("validation.passwordLowercase"))
   .regex(/[A-Z]/, t("validation.passwordUppercase"))
   .regex(/[0-9]/, t("validation.passwordNumber"))
   .regex(/[^A-Za-z0-9]/, t("validation.passwordSpecial"));
  const loginSchema = z.object({
   email: emailSchema,
   password: passwordLoginSchema,
   confirmPassword: z.string(),
  });
  const signUpSchema = z
   .object({
    email: emailSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, t("validation.confirmRequired")),
   })
   .refine((value) => value.password === value.confirmPassword, {
    message: t("validation.confirmMismatch"),
    path: ["confirmPassword"],
   });

  return { loginSchema, signUpSchema };
 }, [t]);
 const activeSchema = isLogin ? schemas.loginSchema : schemas.signUpSchema;
 const defaultValues: LoginFormValues = {
  email: "",
  password: "",
  confirmPassword: "",
 };

 function getLogicalNextPathFromUrl() {
  const next = new URL(window.location.href).searchParams.get("next");
  return stripLocaleFromPathname(getSafeNextPath(next));
 }

 const getLocalizedNextPathFromUrl = useCallback(
  () => localizePathname(getLogicalNextPathFromUrl(), locale),
  [locale],
 );

 useEffect(() => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("authError")) return;

  const sessionLimitReached = url.searchParams.get("authError") === "session_limit";
  toast.error(t(sessionLimitReached ? "toast.loginFailed" : "google.loginFailed"), {
   description: t(sessionLimitReached ? "toast.sessionLimitReached" : "google.sessionFailed"),
  });
  url.searchParams.delete("authError");
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
 }, [t]);

 useEffect(() => {
  if (isResolved && user) window.location.replace(getLocalizedNextPathFromUrl());
 }, [getLocalizedNextPathFromUrl, isResolved, user]);

 async function signInWithGoogle() {
  setOauthLoading(true);
  const callbackUrl = buildOAuthCallbackUrl({
   currentOrigin: window.location.origin,
   configuredAppUrl: process.env.NEXT_PUBLIC_APP_URL,
   next: getLocalizedNextPathFromUrl(),
  });

  const { error } = await supabase.auth.signInWithOAuth({
   provider: "google",
   options: {
    redirectTo: callbackUrl,
   },
  });

  if (error) {
   toast.error(t("google.openFailed"), {
    description: t("google.unavailable"),
   });
   setOauthLoading(false);
  }
 }

 const form = useAppForm({
  defaultValues,
  validators: { onChange: activeSchema, onSubmit: activeSchema },
  onSubmit: async ({ value }) => {
   if (isLogin) {
    const { error } = await supabase.auth.signInWithPassword({
     email: value.email,
     password: value.password,
    });

    if (error) {
     toast.error(t("toast.loginFailed"), {
      description: t(
       error.message.includes("HANZIHOME_SESSION_LIMIT_REACHED")
        ? "toast.sessionLimitReached"
        : "toast.invalidCredentials",
      ),
     });
     return;
    }

    toast.success(t("toast.loginSuccess"));
   } else {
    const confirmUrl = new URL("/auth/confirm", window.location.origin);
    confirmUrl.searchParams.set("next", localizePathname("/", locale));
    const { error } = await supabase.auth.signUp({
     email: value.email,
     password: value.password,
     options: {
      emailRedirectTo: confirmUrl.toString(),
     },
    });

    if (error) {
     toast.error(t("toast.signupFailed"), {
      description: t("toast.signupError"),
     });
     return;
    }

    toast.success(t("toast.signupSuccess"));
    setIsLogin(true);
    form.reset();
   }
  },
 });

 return (
  <main className="flex min-h-dvh flex-col justify-center gap-4 bg-bg-primary px-4 py-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
   <div className="grid justify-items-center gap-3 sm:mx-auto sm:w-full sm:max-w-md">
    <div className="app-brand-gradient grid size-12 place-items-center rounded-xl shadow-theme-sm">
     <BookOpen className="size-6" aria-hidden="true" />
    </div>
    <Typography
     as="h1"
     variant="sectionTitle"
     tone="default"
     weight="bold"
     align="center"
     tracking="tight"
    >
     {isLogin ? t("title.login") : t("title.signup")}
    </Typography>
    <Typography as="p" tone="secondary" align="center" leading="standard" className="max-w-sm">
     {isLogin ? t("description.login") : t("description.signup")}
    </Typography>
    <LocaleSwitcher />
   </div>

   <div className="sm:mx-auto sm:w-full sm:max-w-md">
    <div className="grid gap-5 border border-border-default bg-bg-card px-4 py-6 sm:rounded-xl sm:px-8">
     <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={oauthLoading}
      onClick={signInWithGoogle}
     >
      {oauthLoading ? <Spinner data-icon="inline-start" /> : <GoogleIcon />}
      {t("google.continue")}
     </Button>

     <div className="flex items-center gap-3 text-xs text-text-muted" aria-hidden="true">
      <span className="h-px flex-1 bg-border-default" />
      {t("emailDivider")}
      <span className="h-px flex-1 bg-border-default" />
     </div>

     <form
      className="flex flex-col gap-5"
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
          label={t("fields.email")}
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
          label={t("fields.password")}
          placeholder="••••••••"
          autoComplete={isLogin ? "current-password" : "new-password"}
          helperText={isLogin ? undefined : t("fields.passwordHint")}
         />
        )}
       </form.AppField>

       {!isLogin && (
        <form.AppField name="confirmPassword">
         {() => (
          <PasswordField
           label={t("fields.confirmPassword")}
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
         variant="default"
         className="w-full"
        >
         {isSubmitting ? (
          <Spinner data-icon="inline-start" />
         ) : isLogin ? (
          <LogIn data-icon="inline-start" />
         ) : (
          <UserPlus data-icon="inline-start" />
         )}
         {isLogin ? t("actions.login") : t("actions.signup")}
        </Button>
       )}
      </form.Subscribe>

      <div className="flex flex-col gap-2 border-t border-border-default pt-5 text-center text-text-muted">
       <Typography as="p">
        {isLogin ? t("switchMode.needAccount") : t("switchMode.haveAccount")}{" "}
        <Button
         type="button"
         onClick={() => {
          setIsLogin(!isLogin);
          form.reset();
         }}
         variant="ghost"
        >
         {isLogin ? t("actions.signupNow") : t("actions.login")}
        </Button>
       </Typography>
      </div>
     </form>
    </div>
   </div>
  </main>
 );
}
