import { describe, expect, it } from "vitest";

import { getLocaleFromPathname, localizePathname, stripLocaleFromPathname } from "./config";

describe("locale path helpers", () => {
 it("detects supported locale prefixes", () => {
  expect(getLocaleFromPathname("/vi/settings")).toBe("vi");
  expect(getLocaleFromPathname("/en/reader?day=1")).toBe("en");
  expect(getLocaleFromPathname("/zh-CN")).toBe("zh-CN");
  expect(getLocaleFromPathname("/settings")).toBeNull();
 });

 it("strips only the leading supported locale and preserves suffixes", () => {
  expect(stripLocaleFromPathname("/en/settings?section=app#reader")).toBe(
   "/settings?section=app#reader",
  );
  expect(stripLocaleFromPathname("/settings?section=app")).toBe("/settings?section=app");
 });

 it("localizes logical and already-localized paths idempotently", () => {
  expect(localizePathname("/settings?section=app", "vi")).toBe("/vi/settings?section=app");
  expect(localizePathname("/en/settings?section=app", "zh-CN")).toBe("/zh-CN/settings?section=app");
  expect(localizePathname("/", "en")).toBe("/en");
 });
});
