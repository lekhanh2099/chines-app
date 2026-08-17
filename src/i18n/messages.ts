import type { AppLocale } from "./config";

async function loadViMessages() {
 const [common, shell, auth] = await Promise.all([
  import("../../messages/vi/common.json"),
  import("../../messages/vi/shell.json"),
  import("../../messages/vi/auth.json"),
 ]);

 return {
  Common: common.default,
  Shell: shell.default,
  Auth: auth.default,
 };
}

export type AppMessages = Awaited<ReturnType<typeof loadViMessages>>;

async function loadEnMessages(): Promise<AppMessages> {
 const [common, shell, auth] = await Promise.all([
  import("../../messages/en/common.json"),
  import("../../messages/en/shell.json"),
  import("../../messages/en/auth.json"),
 ]);

 return {
  Common: common.default,
  Shell: shell.default,
  Auth: auth.default,
 };
}

async function loadZhCnMessages(): Promise<AppMessages> {
 const [common, shell, auth] = await Promise.all([
  import("../../messages/zh-CN/common.json"),
  import("../../messages/zh-CN/shell.json"),
  import("../../messages/zh-CN/auth.json"),
 ]);

 return {
  Common: common.default,
  Shell: shell.default,
  Auth: auth.default,
 };
}

const messageLoaders: Record<AppLocale, () => Promise<AppMessages>> = {
 vi: loadViMessages,
 en: loadEnMessages,
 "zh-CN": loadZhCnMessages,
};

export function loadAppMessages(locale: AppLocale) {
 return messageLoaders[locale]();
}
