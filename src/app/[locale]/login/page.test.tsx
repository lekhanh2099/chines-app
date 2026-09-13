import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { AuthApiError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppForm } from "@/components/tanstack-form/hooks/form";
import { appLocales } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";
import { toast } from "sonner";
import LoginPage from "./page";

const signInWithPassword = vi.hoisted(() => vi.fn());

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({
  supabase: { auth: { signInWithPassword } },
  user: null,
  isResolved: true,
 }),
}));
vi.mock("@/components/layout/LocaleSwitcher", () => ({ LocaleSwitcher: () => null }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/components/tanstack-form/hooks/form", async (importOriginal) => {
 const original = await importOriginal<typeof import("@/components/tanstack-form/hooks/form")>();
 return { ...original, useAppForm: vi.fn(original.useAppForm) };
});

describe("LoginPage session admission", () => {
 beforeEach(() => {
  vi.clearAllMocks();
 });

 it.each(appLocales)(
  "%s presents the session-limit message instead of invalid credentials",
  async (locale) => {
   const messages = await loadAppMessages(locale);
   signInWithPassword.mockResolvedValue({
    error: new AuthApiError("HANZIHOME_SESSION_LIMIT_REACHED", 403, undefined),
   });
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages}>
     <LoginPage />
    </NextIntlClientProvider>,
   );
   expect(markup).toContain(messages.Auth.title.login);
   const result = vi.mocked(useAppForm).mock.results[0];
   if (!result || result.type !== "return") throw new Error("Login form was not rendered");
   const form = result.value;
   await form.options.onSubmit?.({
    value: {
     email: "session-limit@example.test",
     password: "Example-password-123!",
     confirmPassword: "",
    },
    formApi: form,
    meta: undefined,
   });
   expect(toast.error).toHaveBeenCalledWith(messages.Auth.toast.loginFailed, {
    description: messages.Auth.toast.sessionLimitReached,
   });
   expect(toast.success).not.toHaveBeenCalled();
  },
 );
});
