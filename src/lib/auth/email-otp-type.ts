import type { EmailOtpType } from "@supabase/supabase-js";
import { z } from "zod";

const EmailOtpTypeSchema = z.enum([
 "signup",
 "invite",
 "magiclink",
 "recovery",
 "email_change",
 "email",
]) satisfies z.ZodType<EmailOtpType>;
type SupportedEmailOtpType = z.infer<typeof EmailOtpTypeSchema>;

export function parseEmailOtpType(
 value: z.infer<z.ZodNullable<z.ZodString>>,
): z.infer<z.ZodNullable<z.ZodType<SupportedEmailOtpType>>> {
 const parsed = EmailOtpTypeSchema.safeParse(value);
 return parsed.success ? parsed.data : null;
}
