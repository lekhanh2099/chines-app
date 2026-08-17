"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
 appLocales,
 defaultAppLocale,
 isAppLocale,
 type AppLocale,
} from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
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
  <div
   role="group"
   aria-label={tShell("localeSwitcher.label")}
   className="flex flex-wrap items-center gap-1"
  >
   {appLocales.map((item) => (
    <Button
     key={item}
     type="button"
     variant={item === activeLocale ? "active" : "ghost"}
     size="sm"
     aria-pressed={item === activeLocale}
     onClick={() => changeLocale(item)}
    >
     {tCommon(`locales.${item}`)}
    </Button>
   ))}
  </div>
 );
}
