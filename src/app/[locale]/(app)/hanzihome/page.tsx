import { notFound, permanentRedirect } from "next/navigation";

import { HanziHomePage as HanziHomeFeaturePage } from "@/features/hanzihome/HanziHomePage";
import { isAppLocale, localizePathname } from "@/i18n/config";

export default async function HanziHomePage({
 params,
 searchParams,
}: PageProps<"/[locale]/hanzihome">) {
 const { locale } = await params;
 if (!isAppLocale(locale)) notFound();

 const query = await searchParams;
 const moduleParam = Array.isArray(query.module) ? query.module[0] : query.module;

 if (moduleParam === "radicals") {
  const nextParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
   if (key === "module" || value === undefined) continue;
   for (const item of Array.isArray(value) ? value : [value]) nextParams.append(key, item);
  }

  const target = nextParams.size > 0 ? `/radicals?${nextParams.toString()}` : "/radicals";
  permanentRedirect(localizePathname(target, locale));
 }

 return <HanziHomeFeaturePage />;
}
