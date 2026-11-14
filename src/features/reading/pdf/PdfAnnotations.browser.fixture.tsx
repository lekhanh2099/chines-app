import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { createRoot } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { Button } from "@/components/ui/actions/button";
import type { useClientSession as sessionHook } from "@/components/providers/QueryProvider";
import type { Database } from "@/types/supabase.generated";
import { usePdfAnnotations } from "./usePdfAnnotations";
import { createPdfStroke } from "./pdf-annotations";
import { PdfReaderWorkspace } from "./PdfReaderWorkspace";
import type { PdfAnnotationPayloadInput } from "./pdf-annotation-api";
import { HANZIHOME_LOCAL_STORES, putInStore } from "@/features/hanzihome/local/hanzihome-local-db";
import readerMessages from "../../../../messages/vi/reader.json";
import commonMessages from "../../../../messages/vi/common.json";
import "@/app/globals.css";
import {
 enqueuePdfAnnotation,
 flushPendingPdfAnnotation,
 getPendingPdfAnnotation,
 syncPendingPdfAnnotations,
} from "./pdf-annotation-outbox";

const ownerId = "22222222-2222-4222-8222-222222222222";
const supabase = createClient<Database>("http://127.0.0.1:43197", "fixture-key", {
 auth: { persistSession: false, autoRefreshToken: false },
});
export function useClientSession(): ReturnType<typeof sessionHook> {
 return { supabase, user: null, userId: ownerId, isResolved: true };
}
function Probe() {
 const hook = usePdfAnnotations({ assetId: "asset-1", pageNumber: 1 });
 return (
  <main>
   <Button
    onClick={() =>
     hook.replaceStrokes([
      ...hook.strokes,
      createPdfStroke("pen", "#ff0000", 4, { x: 0.1, y: 0.2 }),
     ])
    }
    disabled={!hook.canEdit}
   >
    Add stroke
   </Button>
   <Button
    onClick={() => {
     void hook.retrySave().catch(() => {});
    }}
   >
    Retry save
   </Button>
   <pre id="pdf-strokes">{JSON.stringify(hook.strokes)}</pre>
   <output id="pdf-status">
    {hook.saveFailed ? "failed" : hook.isQueued ? "queued" : hook.isSaving ? "saving" : "ready"}
   </output>
  </main>
 );
}
const container = document.createElement("div");
document.body.append(container);
const root = createRoot(container);
if (!new URLSearchParams(location.search).has("unmounted")) {
 root.render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
   <NextIntlClientProvider
    locale="vi"
    messages={{ Reader: readerMessages, Common: commonMessages }}
    timeZone="Asia/Ho_Chi_Minh"
   >
    {new URLSearchParams(location.search).has("viewer") ? (
     <PdfReaderWorkspace
      initialAssets={[
       {
        id: "viewer-1",
        title: "PDF conflict fixture",
        resourceFile: "fixture.pdf",
        pdfPage: 1,
        printedPage: 1,
        imageSrc:
         'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="white"/><text x="80" y="120" font-size="36">PDF fixture page</text></svg>',
       },
      ]}
     />
    ) : (
     <Probe />
    )}
   </NextIntlClientProvider>
  </QueryClientProvider>,
 );
}
const harness = {
 enqueue: enqueuePdfAnnotation,
 flush: flushPendingPdfAnnotation,
 pending: getPendingPdfAnnotation,
 sync: syncPendingPdfAnnotations,
 async seedLegacy(
  input: Omit<PdfAnnotationPayloadInput, "expectedAbsent">,
  owner: string,
  submitted: boolean,
 ) {
  const record = {
   id: `pdf_annotation:${owner}:${input.assetId}:${input.pageNumber}`,
   type: "pdf_annotation.save",
   ownerUserId: owner,
   operationId: crypto.randomUUID(),
   createdAt: new Date().toISOString(),
   input,
  };
  await putInStore(
   HANZIHOME_LOCAL_STORES.pendingMutations,
   submitted ? { ...record, submittedInput: input } : record,
  );
 },
};
declare global {
 interface Window {
  pdfOutboxHarness: typeof harness;
 }
}
window.pdfOutboxHarness = harness;
