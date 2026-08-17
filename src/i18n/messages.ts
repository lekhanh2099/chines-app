import type { AppLocale } from "./config";

async function loadViMessages() {
 const [common, shell, auth, inspector, settings] = await Promise.all([
  import("../../messages/vi/common.json"),
  import("../../messages/vi/shell.json"),
  import("../../messages/vi/auth.json"),
  import("../../messages/vi/inspector.json"),
  import("../../messages/vi/settings.json"),
 ]);

 return {
  Common: common.default,
  Shell: shell.default,
  Auth: auth.default,
  Inspector: inspector.default,
  Settings: settings.default,
 };
}

export type AppMessages = Awaited<ReturnType<typeof loadViMessages>>;

async function loadEnMessages(): Promise<AppMessages> {
 const [common, shell, auth, inspector, settings] = await Promise.all([
  import("../../messages/en/common.json"),
  import("../../messages/en/shell.json"),
  import("../../messages/en/auth.json"),
  import("../../messages/en/inspector.json"),
  import("../../messages/en/settings.json"),
 ]);

 return {
  Common: common.default,
  Shell: shell.default,
  Auth: auth.default,
  Inspector: inspector.default,
  Settings: settings.default,
 };
}

async function loadZhCnMessages(): Promise<AppMessages> {
 const [common, shell, auth, inspector, settings] = await Promise.all([
  import("../../messages/zh-CN/common.json"),
  import("../../messages/zh-CN/shell.json"),
  import("../../messages/zh-CN/auth.json"),
  import("../../messages/zh-CN/inspector.json"),
  import("../../messages/zh-CN/settings.json"),
 ]);

 return {
  Common: common.default,
  Shell: shell.default,
  Auth: auth.default,
  Inspector: inspector.default,
  Settings: settings.default,
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
