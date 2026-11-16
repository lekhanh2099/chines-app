import { useTranslations } from "next-intl";

/** Instant placeholder shown inside the app shell while the next route streams in. */
export function AppRouteLoading() {
 const t = useTranslations("Shell.workspace");
 return (
  <div className="hanzihome-static-page" aria-busy="true" aria-live="polite">
   <div className="grid w-full min-w-0 animate-pulse content-start gap-3">
    <div className="h-11 rounded-xl border border-border-default bg-bg-card" />
    <div className="grid gap-3 rounded-xl border border-border-default bg-bg-card p-4">
     <div className="h-6 w-56 max-w-full rounded-lg bg-bg-subtle" />
     <div className="h-4 w-full rounded-lg bg-bg-subtle" />
     <div className="h-4 w-4/5 rounded-lg bg-bg-subtle" />
     <div className="h-40 rounded-xl bg-bg-subtle" />
    </div>
    <span className="sr-only">{t("loading")}</span>
   </div>
  </div>
 );
}
