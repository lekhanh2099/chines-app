import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { NextIntlClientProvider } from "next-intl";
import { createRoot } from "react-dom/client";
import { createRef, useEffect, type ComponentProps } from "react";
import type { useClientSession as sessionHook } from "@/components/providers/QueryProvider";
import type { usePathname as pathnameHook } from "next/navigation";
import { loadAppMessages } from "@/i18n/messages";
import type { Database } from "@/types/supabase.generated";
import { Button } from "@/components/ui/actions/button";
import { LessonAnnotationProvider, useLessonAnnotationContext } from "./LessonAnnotationProvider";
import { useLessonAnnotations } from "./useLessonAnnotations";
import { lessonAnnotationQueryKeys } from "./query-keys";
import type { LessonAnnotationNoteUpdate, LessonTextAnnotation } from "./types";
import { transitionAuthenticatedQueryOwner } from "@/lib/query/auth-owner-transition";
import "@/app/globals.css";

const supabase = createClient<Database>(window.location.origin, "fixture-key", {
 auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
let ownerUserId: ReturnType<typeof sessionHook>["userId"] = "00000000-0000-4000-8000-000000002001";
export function useClientSession(): ReturnType<typeof sessionHook> {
 return { supabase, user: null, userId: ownerUserId, isResolved: true };
}
export const usePathname: typeof pathnameHook = () => "/hanzihome";
export default function FixtureLink(props: ComponentProps<"a">) {
 return <a {...props} />;
}

function Probe() {
 const context = useLessonAnnotationContext();
 const annotation = context?.getAnnotations(
  { lessonId: "lesson-1", nodeType: "paragraph", nodeId: "paragraph-1" },
  "你好",
 )[0];
 return (
  <Button
   disabled={!annotation}
   onClick={() => {
    if (annotation) context?.openAnnotation(annotation);
   }}
  >
   Open saved annotation
  </Button>
 );
}
const hookRef = createRef<ReturnType<typeof useLessonAnnotations>>();
function OwnerProbe() {
 const hook = useLessonAnnotations("lesson-1");
 useEffect(() => {
  hookRef.current = hook;
  return () => {
   hookRef.current = null;
  };
 }, [hook]);
 return (
  <>
   <output id="owner-annotations">{JSON.stringify(hook.annotations)}</output>
   <span id="owner-selection">New account selection</span>
  </>
 );
}
const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
let queryClient = makeClient();
let retiredClient = queryClient;
let retiredMutations: ReturnType<ReturnType<QueryClient["getMutationCache"]>["getAll"]> = [];
let ownerEpoch = 0;
let ownerProbe = false;
let cancelStarted = false;
let releaseCancel = () => {};
const container = document.createElement("main");
document.body.append(container);
const root = createRoot(container);
const messages = await loadAppMessages("vi");
function render() {
 root.render(
  <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
   <QueryClientProvider key={ownerEpoch} client={queryClient}>
    {ownerProbe ? (
     <OwnerProbe />
    ) : (
     <LessonAnnotationProvider lessonId="lesson-1">
      <Probe />
     </LessonAnnotationProvider>
    )}
   </QueryClientProvider>
  </NextIntlClientProvider>,
 );
}
render();
const harness = {
 switchOwner(nextOwner: ReturnType<typeof sessionHook>["userId"]) {
  retiredClient = queryClient;
  retiredMutations = queryClient.getMutationCache().getAll();
  const transition = transitionAuthenticatedQueryOwner({
   previousOwner: ownerUserId,
   nextOwner,
   client: queryClient,
   makeClient,
  });
  ownerUserId = transition.owner;
  queryClient = transition.client;
  if (transition.rotated) ownerEpoch += 1;
  render();
 },
 enterOwnerProbe() {
  retiredMutations = queryClient
   .getMutationCache()
   .getAll()
   .filter((mutation) => mutation.state.status === "pending");
  ownerProbe = true;
  ownerEpoch += 1;
  render();
 },
 holdNextCancel() {
  cancelStarted = false;
  const client = queryClient;
  const cancel = client.cancelQueries.bind(client);
  client.cancelQueries = async (...args: Parameters<QueryClient["cancelQueries"]>) => {
   client.cancelQueries = cancel;
   cancelStarted = true;
   await new Promise<void>((resolve) => {
    releaseCancel = resolve;
   });
   await cancel(...args);
  };
 },
 cancelStarted: () => cancelStarted,
 releaseCancel: () => releaseCancel(),
 retiredQueryCount: () => retiredClient.getQueryCache().getAll().length,
 retiredMutationStatuses: () => retiredMutations.map((mutation) => mutation.state.status),
 annotations: () =>
  queryClient.getQueryData<LessonTextAnnotation[]>(
   lessonAnnotationQueryKeys.byLesson(ownerUserId, "lesson-1"),
  ) ?? [],
 async create() {
  if (!hookRef.current) throw new Error("Missing owner probe");
  return hookRef.current.createAnnotation({
   anchor: {
    lessonId: "lesson-1",
    nodeType: "paragraph",
    nodeId: "paragraph-1",
    startOffset: 0,
    endOffset: 2,
    selectedText: "你好",
    prefixText: "",
    suffixText: "",
   },
  });
 },
 async update(input: LessonAnnotationNoteUpdate) {
  if (!hookRef.current) throw new Error("Missing owner probe");
  return hookRef.current.updateAnnotationNote(input);
 },
 async remove(annotationId: string) {
  if (!hookRef.current) throw new Error("Missing owner probe");
  return hookRef.current.deleteAnnotation(annotationId);
 },
 close() {
  root.unmount();
  queryClient.clear();
 },
};
declare global {
 interface Window {
  lessonAnnotationsHarness: typeof harness;
 }
}
window.lessonAnnotationsHarness = harness;
