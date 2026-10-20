import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/layout/card";

export function HanziHomeLibrarySkeleton() {
 const t = useTranslations("Common.library");
 return (
  <div className="grid w-full min-w-0 gap-4" aria-busy="true" aria-live="polite">
   <div
    className="grid min-w-0 animate-pulse grid-cols-2 items-start gap-x-4 gap-y-6 lg:grid-cols-3 xl:grid-cols-4"
    aria-hidden="true"
   >
    {Array.from({ length: 4 }, (_, index) => (
     <div key={index} className="grid min-w-0 gap-2">
      <Card variant="subtle" padding="none" className="aspect-[4/5] w-full" />
      <div className="h-5 w-full max-w-40 rounded-md bg-bg-subtle" />
      <div className="h-4 w-20 rounded-md bg-bg-subtle" />
     </div>
    ))}
   </div>
   <span className="sr-only">{t("loading")}</span>
  </div>
 );
}
