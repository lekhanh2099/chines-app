import { describe, expect, it } from "vitest";

import viAuth from "../../messages/vi/auth.json";
import viCommon from "../../messages/vi/common.json";
import viShell from "../../messages/vi/shell.json";
import enAuth from "../../messages/en/auth.json";
import enCommon from "../../messages/en/common.json";
import enShell from "../../messages/en/shell.json";
import zhAuth from "../../messages/zh-CN/auth.json";
import zhCommon from "../../messages/zh-CN/common.json";
import zhShell from "../../messages/zh-CN/shell.json";

function collectLeafKeys(value: object, prefix = ""): string[] {
 return Object.entries(value).flatMap(([key, nestedValue]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  if (nestedValue && typeof nestedValue === "object" && !Array.isArray(nestedValue)) {
   return collectLeafKeys(nestedValue, path);
  }
  return [path];
 });
}

const localeMessages = {
 en: { Common: enCommon, Shell: enShell, Auth: enAuth },
 "zh-CN": { Common: zhCommon, Shell: zhShell, Auth: zhAuth },
};
const baseMessages = { Common: viCommon, Shell: viShell, Auth: viAuth };

describe("i18n message contracts", () => {
 it.each(Object.entries(localeMessages))(
  "%s exposes the same semantic keys as Vietnamese",
  (_locale, messages) => {
   expect(collectLeafKeys(messages).sort()).toEqual(collectLeafKeys(baseMessages).sort());
  },
 );
});
