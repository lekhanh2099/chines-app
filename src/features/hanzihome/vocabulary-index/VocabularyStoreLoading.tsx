import { useTranslations } from "next-intl";

/** Placeholder of the vocabulary store while its first page streams in. */
export function VocabularyStoreLoading() {
 const t = useTranslations("Shell.workspace");
 return (
  <div className="grid animate-pulse content-start gap-2" aria-busy="true" aria-live="polite">
   <div className="h-11 rounded-xl border border-border-default bg-bg-card" />
   <div className="h-10 rounded-lg border border-border-default bg-bg-card" />
   <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    {Array.from({ length: 12 }, (_, index) => (
     <div key={index} className="h-28 rounded-xl border border-border-default bg-bg-card" />
    ))}
   </div>
   <span className="sr-only">{t("loading")}</span>
  </div>
 );
}
