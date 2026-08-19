import { describe, expect, it } from "vitest";

import { parseEmailOtpType } from "./email-otp-type";

describe("parseEmailOtpType", () => {
 it.each(["signup", "invite", "magiclink", "recovery", "email_change", "email"])(
  "accepts supported OTP type %s",
  (value) => {
   expect(parseEmailOtpType(value)).toBe(value);
  },
 );

 it.each([null, "", "sms", "unknown"])("rejects unsupported OTP type %s", (value) => {
  expect(parseEmailOtpType(value)).toBeNull();
 });
});
