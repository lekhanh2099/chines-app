import { defineRouting } from "next-intl/routing";

import { appLocales, defaultAppLocale } from "./config";

export const routing = defineRouting({
 locales: appLocales,
 defaultLocale: defaultAppLocale,
 localePrefix: "always",
});
