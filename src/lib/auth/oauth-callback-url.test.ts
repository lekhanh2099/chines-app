import { describe, expect, it } from "vitest";

import { buildOAuthCallbackUrl } from "./oauth-callback-url";

describe("buildOAuthCallbackUrl", () => {
 it("uses the stable production origin on hosted deployments", () => {
  expect(
   buildOAuthCallbackUrl({
    currentOrigin: "https://chines-random-preview.vercel.app",
    configuredAppUrl: "https://chines-app.vercel.app",
    next: "/hanzihome",
   }),
  ).toBe("https://chines-app.vercel.app/auth/callback?next=%2Fhanzihome");
 });

 it("keeps the current localhost origin during development", () => {
  expect(
   buildOAuthCallbackUrl({
    currentOrigin: "http://localhost:3001",
    configuredAppUrl: "https://chines-app.vercel.app",
    next: "/settings",
   }),
  ).toBe("http://localhost:3001/auth/callback?next=%2Fsettings");
 });

 it("rejects an external next destination", () => {
  expect(
   buildOAuthCallbackUrl({
    currentOrigin: "https://chines-app.vercel.app",
    configuredAppUrl: "https://chines-app.vercel.app/path-is-ignored",
    next: "//evil.example",
   }),
  ).toBe("https://chines-app.vercel.app/auth/callback?next=%2F");
 });
});
