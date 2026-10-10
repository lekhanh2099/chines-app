import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { NextIntlClientProvider } from "next-intl";
import { createRoot } from "react-dom/client";
import { Profiler, useState, type ComponentProps } from "react";

import type { useClientSession as sessionHook } from "@/components/providers/QueryProvider";
import { RecentNotesPanel } from "@/features/home/components/RecentNotesPanel";
import { useHomeDashboard } from "@/features/home/hooks/useHomeDashboard";
import { noteQueryKeys } from "@/features/notes/query-keys";
import type { Database } from "@/types/supabase.generated";
import type { UserLearningState } from "@/features/hanzihome/types";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import {
 defaultLessonTextDisplaySettings,
 emptyLearningState,
 nextProgress,
} from "@/features/hanzihome/utils/learning-state";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { HanziTypographyPreferenceBridge } from "@/features/hanzihome/typography/HanziTypographyPreferenceBridge";
import { GlobalSearchDialog } from "@/features/hanzihome/search/GlobalSearchDialog";
import { Button } from "@/components/ui/actions/button";
import type { usePathname as navigationPathname } from "@/i18n/navigation";
import type { useSearchParams as navigationSearchParams } from "next/navigation";
import { ReadonlyURLSearchParams } from "next/dist/client/components/navigation.react-server";
import { HomeDashboard } from "@/features/home/HomeDashboard";
import { isAppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";
import "@/app/globals.css";
import homeMessages from "../../../messages/vi/home.json";
import commonMessages from "../../../messages/vi/common.json";
import shellMessages from "../../../messages/vi/shell.json";

const ownerId = "00000000-0000-4000-8000-000000000001";
const params = new URLSearchParams(location.search);
const fullDashboard = params.has("full");
const localeParam = params.get("locale");
const locale = isAppLocale(localeParam) ? localeParam : "vi";
const supabase = createClient<Database>(window.location.origin, "fixture-key", {
 auth: { persistSession: false, autoRefreshToken: false },
});

// Only session/navigation/network boundaries are controlled; Home/Notes hooks and service are real.
export function useClientSession(): ReturnType<typeof sessionHook> {
 return { supabase, user: null, userId: params.has("guest") ? null : ownerId, isResolved: true };
}
export function Link(props: ComponentProps<"a">) {
 return <a {...props} />;
}
export const usePathname: typeof navigationPathname = () => "/hanzihome";
export const useSearchParams: typeof navigationSearchParams = () =>
 new ReadonlyURLSearchParams(location.search);

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });
let fontCommits = 0;
function LearningProgressProbe() {
 const { state } = useLearningState();
 return <output data-progress-count>{Object.keys(state.progress.vocab ?? {}).length}</output>;
}
function Probe() {
 const dashboard = useHomeDashboard([]);
 if (dashboard.isLoading) return <output data-home-loading>Loading</output>;
 return (
  <RecentNotesPanel
   notes={dashboard.recentNotes}
   loading={dashboard.recentNotesLoading}
   unavailable={dashboard.recentNotesUnavailable}
   onRetry={dashboard.retryRecentNotes}
  />
 );
}
function SearchProbe() {
 const [open, setOpen] = useState(false);
 const [query, setQuery] = useState("希望");
 const [openedResult, setOpenedResult] = useState("");
 return (
  <>
   <Button onClick={() => setOpen(true)}>Open search fixture</Button>
   <output data-opened-search-result>{openedResult}</output>
   <GlobalSearchDialog
    open={open}
    query={query}
    onOpenChange={setOpen}
    onQueryChange={setQuery}
    onOpenResult={(item) => {
     setOpenedResult(item.id);
     setOpen(false);
    }}
    onDirectLookup={(text) => {
     setOpenedResult(text);
     setOpen(false);
    }}
   />
  </>
 );
}
const container = document.createElement("main");
document.body.append(container);
const root = createRoot(container);
root.render(
 <NextIntlClientProvider
  locale={locale}
  messages={
   fullDashboard
    ? await loadAppMessages(locale)
    : { Home: homeMessages, Common: commonMessages, Shell: shellMessages }
  }
  timeZone="Asia/Ho_Chi_Minh"
 >
  <QueryClientProvider client={queryClient}>
   {fullDashboard ? (
    <HomeDashboard textbooks={[]} />
   ) : (
    <>
     <Probe />
     <SearchProbe />
     <LearningProgressProbe />
     <Profiler
      id="font-settings"
      onRender={() => {
       fontCommits += 1;
      }}
     >
      <HanziTypographyPreferenceBridge />
     </Profiler>
    </>
   )}
  </QueryClientProvider>
 </NextIntlClientProvider>,
);
const harness = {
 querySnapshots: () =>
  queryClient
   .getQueryCache()
   .getAll()
   .map((query) => ({
    hash: query.queryHash,
    status: query.state.status,
    fetchStatus: query.state.fetchStatus,
   })),
 refreshOverview: () =>
  queryClient.refetchQueries({ queryKey: hanzihomeQueryKeys.homeLearningOverview(ownerId) }),
 refreshActivity: () =>
  queryClient.refetchQueries({
   queryKey: hanzihomeQueryKeys.practiceAttemptsRecent(ownerId, "review"),
  }),
 refreshReviewedToday: () =>
  queryClient.refetchQueries({
   predicate: (query) => query.queryKey[1] === "practice-attempts" && query.queryKey[4] === "count",
  }),
 refreshNotes: () => queryClient.refetchQueries({ queryKey: noteQueryKeys.recent(ownerId, 3) }),
 refreshSearch: () => queryClient.refetchQueries({ queryKey: hanzihomeQueryKeys.searchIndex }),
 resetFontCommits: () => {
  fontCommits = 0;
 },
 fontCommits: () => fontCommits,
 updateProgress(id: string) {
  queryClient.setQueryData<UserLearningState>(
   hanzihomeQueryKeys.learningState(ownerId),
   (current) => {
    const state = current ?? emptyLearningState;
    return {
     ...state,
     progress: {
      ...state.progress,
      vocab: { ...state.progress.vocab, [id]: nextProgress("known") },
     },
    };
   },
  );
 },
 updateFont(
  font: NonNullable<UserLearningState["settings"]["lessonTextDisplayMode"]>["hanziFont"],
 ) {
  queryClient.setQueryData<UserLearningState>(
   hanzihomeQueryKeys.learningState(ownerId),
   (current) => {
    const state = current ?? emptyLearningState;
    return {
     ...state,
     settings: {
      ...state.settings,
      lessonTextDisplayMode: {
       ...defaultLessonTextDisplaySettings,
       ...state.settings.lessonTextDisplayMode,
       hanziFont: font,
      },
     },
    };
   },
  );
 },
 close() {
  root.unmount();
  queryClient.clear();
 },
};
declare global {
 interface Window {
  homeDashboardHarness: typeof harness;
 }
}
window.homeDashboardHarness = harness;
