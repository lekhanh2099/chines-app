"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ComponentProps } from "react";

import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { appLocales, defaultAppLocale, isAppLocale, type AppLocale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher({
 size = "default",
}: {
 size?: ComponentProps<typeof SelectTrigger>["size"];
}) {
 const locale = useLocale();
 const tCommon = useTranslations("Common");
 const tShell = useTranslations("Shell");
 const pathname = usePathname();
 const router = useRouter();
 const activeLocale: AppLocale = isAppLocale(locale) ? locale : defaultAppLocale;

 const changeLocale = (nextLocale: AppLocale) => {
  if (nextLocale === activeLocale) return;
  const search = typeof window === "undefined" ? "" : window.location.search;
  router.replace(`${pathname}${search}`, { locale: nextLocale });
 };

 return (
  <Select
   value={activeLocale}
   onValueChange={(value) => {
    if (isAppLocale(value)) changeLocale(value);
   }}
  >
   <SelectTrigger width="full" size={size} aria-label={tShell("localeSwitcher.label")}>
    <SelectValue />
   </SelectTrigger>
   <SelectContent position="popper" align="start">
    <SelectGroup>
     {appLocales.map((item) => (
      <SelectItem key={item} value={item}>
       {tCommon(`locales.${item}`)}
      </SelectItem>
     ))}
    </SelectGroup>
   </SelectContent>
  </Select>
 );
}
