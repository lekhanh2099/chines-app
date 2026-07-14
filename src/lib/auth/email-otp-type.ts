import type { EmailOtpType } from "@supabase/supabase-js";

const emailOtpTypes = new Set<EmailOtpType>([
 "signup",
 "invite",
 "magiclink",
 "recovery",
 "email_change",
 "email",
]);

export function parseEmailOtpType(value: string | null): EmailOtpType | null {
 return value && emailOtpTypes.has(value as EmailOtpType) ? (value as EmailOtpType) : null;
}
