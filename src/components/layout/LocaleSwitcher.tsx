"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { appLocales, isAppLocale, type AppLocale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
 const locale = useLocale();
 const tCommon = useTranslations("Common");
 const tShell = useTranslations("Shell");
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const router = useRouter();
 const activeLocale: AppLocale = isAppLocale(locale) ? locale : "vi";

 const changeLocale = (nextLocale: AppLocale) => {
  if (nextLocale === activeLocale) return;
  const query = searchParams.toString();
  router.replace(query ? `${pathname}?${query}` : pathname, { locale: nextLocale });
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
