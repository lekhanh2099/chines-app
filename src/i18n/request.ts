import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { loadAppMessages } from "./messages";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
 const requestedLocale = await requestLocale;
 const locale = hasLocale(routing.locales, requestedLocale)
  ? requestedLocale
  : routing.defaultLocale;

 return {
  locale,
  messages: await loadAppMessages(locale),
 };
});
