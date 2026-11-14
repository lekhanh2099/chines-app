import { DictionarySrsQueuedError } from "@/types/error";
import { Profiler } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase.generated";
import type { useClientSession as sessionHook } from "@/components/providers/QueryProvider";
import { loadAppMessages } from "@/i18n/messages";
import { AutoSyncReconnectBridge } from "@/features/hanzihome/components/layout/AutoSyncReconnectBridge";
import { AppToaster } from "@/components/layout/runtime/AppToaster";
import { VocabDetailDrawer } from "./components/VocabDetailDrawer";
import { vocabDetailDrawerStore } from "@/stores/dictionary/vocab-detail-drawer-store";
import type { SmartSelectionResult } from "@/types/database";
import { closeHanziHomeLocalDb } from "@/features/hanzihome/local/hanzihome-local-db";
import {
 listPendingDictionarySrs,
 saveDictionarySrsDurably,
 syncPendingDictionarySrs,
} from "./dictionary-srs-outbox";

let ownerId = "owner-a";
const supabase = createClient<Database>("http://127.0.0.1:43197", "fixture-key", {
 auth: { persistSession: false, autoRefreshToken: false },
});
export function useClientSession(): ReturnType<typeof sessionHook> {
 return { supabase, user: null, userId: ownerId, isResolved: true };
}
const messages = await loadAppMessages("vi");
const container = document.createElement("div");
document.body.append(container);
const root = createRoot(container);
const drawerQueryClient = new QueryClient({
 defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
const drawerCommits: number[] = [];
function mountDrawer() {
 root.render(
  <NextIntlClientProvider locale="vi" messages={messages}>
   <QueryClientProvider client={drawerQueryClient}>
    <Profiler
     id="dictionary-drawer"
     onRender={(_id, _phase, duration) => drawerCommits.push(duration)}
    >
     <VocabDetailDrawer />
    </Profiler>
    <AppToaster />
   </QueryClientProvider>
  </NextIntlClientProvider>,
 );
 vocabDetailDrawerStore.actions.openDetailDrawer({ text: "你好。", mode: "sentence" });
}
function mountSyncBridge(userId: string) {
 ownerId = userId;
 root.render(
  <NextIntlClientProvider locale="vi" messages={messages}>
   <QueryClientProvider key={userId} client={new QueryClient()}>
    <AutoSyncReconnectBridge />
   </QueryClientProvider>
  </NextIntlClientProvider>,
 );
}

const harness = {
 list: listPendingDictionarySrs,
 sync: syncPendingDictionarySrs,
 close: closeHanziHomeLocalDb,
 mountSyncBridge,
 resetDrawerMetrics: () => {
  drawerCommits.length = 0;
 },
 drawerMetrics: () => [...drawerCommits],
 refetchSelection: () =>
  drawerQueryClient.refetchQueries({ queryKey: ["editor-smart-selection"], type: "active" }),
 selection() {
  const query = drawerQueryClient
   .getQueryCache()
   .getAll()
   .find((item) => item.queryKey[0] === "editor-smart-selection");
  return query ? drawerQueryClient.getQueryData<SmartSelectionResult>(query.queryKey) : undefined;
 },
 async save(...input: Parameters<typeof saveDictionarySrsDurably>) {
  try {
   await saveDictionarySrsDurably(...input);
   return "acknowledged";
  } catch (error) {
   return error instanceof DictionarySrsQueuedError ? "queued" : "failed";
  }
 },
 start(...input: Parameters<typeof saveDictionarySrsDurably>) {
  void saveDictionarySrsDurably(...input).catch(() => {});
 },
};

declare global {
 interface Window {
  srsOutboxHarness: typeof harness;
 }
}
window.srsOutboxHarness = harness;
const bootOwner = new URLSearchParams(location.search).get("bridge");
if (bootOwner) mountSyncBridge(bootOwner);
if (new URLSearchParams(location.search).has("drawer")) mountDrawer();
