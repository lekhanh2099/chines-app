import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { useEffect, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";

import { QueryProvider, useClientSession } from "@/components/providers/QueryProvider";
import { NoteTabBar } from "@/components/notes/NoteTabBar";
import { NoteTabContainer } from "../components/NoteTabContainer";
import { Input } from "@/components/ui/forms/input";
import { Button } from "@/components/ui/actions/button";
import { loadAppMessages } from "@/i18n/messages";
import type { createClient as browserCreateClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase.generated";
import type {
 useRouter as navigationRouter,
 usePathname as navigationPathname,
} from "@/i18n/navigation";
import { noteTabsStore } from "@/stores/notes/note-tabs-store";
import { getNoteDraft } from "../local/note-draft-store";
import { useNoteEditor } from "./useNoteEditor";
import "@/app/globals.css";

// The provider, session resolver, Notes service and IndexedDB owner are real.
// Only HTTP responses are controlled by the browser test on this local origin.
const supabase = createSupabaseClient<Database>(window.location.origin, "fixture-key", {
 auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false },
});
export const createClient: typeof browserCreateClient = () => supabase;
const clients: QueryClient[] = [];
let retiredMutations: ReturnType<ReturnType<QueryClient["getMutationCache"]>["getAll"]> = [];
const userA = "00000000-0000-4000-8000-000000003001";
const userB = "00000000-0000-4000-8000-000000003002";
const noteA = "00000000-0000-4000-8000-000000003101";
const noteB = "00000000-0000-4000-8000-000000003102";

export const usePathname: typeof navigationPathname = () => `/notes/${noteA}`;
const router: ReturnType<typeof navigationRouter> = {
 push: () => {},
 replace: () => {},
 prefetch: () => {},
 back: () => {},
 forward: () => {},
 refresh: () => {},
 bfcacheId: "notes-owner-fixture",
};
export const useRouter: typeof navigationRouter = () => router;
export function Link(props: ComponentProps<"a">) {
 return <a {...props} />;
}

function Probe() {
 const { userId, isResolved } = useClientSession();
 const client = useQueryClient();
 const noteId = userId === userB ? noteB : noteA;
 const hook = useNoteEditor(noteId);
 useEffect(() => {
  if (!clients.includes(client)) clients.push(client);
 }, [client]);
 return (
  <>
   <NoteTabBar />
   <output id="owner">{isResolved ? (userId ?? "guest") : "resolving"}</output>
   <Input
    aria-label="Content"
    disabled={!hook.note || hook.isLoading}
    value={typeof hook.noteContent?.text === "string" ? hook.noteContent.text : ""}
    onChange={(event) => hook.handleChange({ text: event.target.value })}
   />
   <output id="save-status">{hook.displaySaveStatus}</output>
   <Button onClick={() => void hook.retrySave().catch(() => {})}>Retry save</Button>
  </>
 );
}

const messages = await loadAppMessages("vi");
const container = document.createElement("main");
document.body.append(container);
const root = createRoot(container);
root.render(
 <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
  <QueryProvider>
   {new URLSearchParams(window.location.search).has("direct") ? (
    <NoteTabContainer initialNoteId={noteA} />
   ) : (
    <Probe />
   )}
  </QueryProvider>
 </NextIntlClientProvider>,
);

const harness = {
 userA,
 userB,
 noteA,
 noteB,
 openTab: noteTabsStore.actions.openTab,
 tabs: () => noteTabsStore.get(),
 async login(owner: string) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
   .replaceAll("=", "")
   .replaceAll("+", "-")
   .replaceAll("/", "_");
  const payload = btoa(
   JSON.stringify({ sub: owner, aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 }),
  )
   .replaceAll("=", "")
   .replaceAll("+", "-")
   .replaceAll("/", "_");
  const { error } = await supabase.auth.setSession({
   access_token: `${header}.${payload}.Zml4dHVyZQ`,
   refresh_token: "fixture-refresh-token",
  });
  if (error) throw error;
 },
 async logout() {
  retiredMutations = clients.flatMap((client) => client.getMutationCache().getAll());
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
 },
 draft: getNoteDraft,
 retiredMutationStatuses: () => retiredMutations.map((mutation) => mutation.state.status),
 snapshots: () =>
  clients.map((client) => ({
   keys: client
    .getQueryCache()
    .getAll()
    .map((query) => query.queryKey),
   pendingWrites: client.isMutating(),
  })),
 unmount: () => root.unmount(),
};
declare global {
 interface Window {
  notesOwnerHarness: typeof harness;
 }
}
window.notesOwnerHarness = harness;
