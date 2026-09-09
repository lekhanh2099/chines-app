import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import readerMessages from "../../../../messages/vi/reader.json";
import studioSeed from "@/features/hanzihome/static-json/studio-seed.json";
import { readerDocumentRowSchema } from "@/features/reading/model/reading-resource.schemas";
import { ReaderCollectionWorkspace } from "@/features/reading/workspaces/ReaderCollectionWorkspace";

vi.mock("next/navigation", () => ({
 useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
 usePathname: () => "/humanities",
}));

vi.mock("@/features/reading/pdf/PdfReaderWorkspace", () => ({
 PdfReaderWorkspace: () => null,
 pdfAssetIdForDocument: () => null,
}));

vi.mock("@/features/reading/workspaces/ReaderDocumentStudy", () => ({
 ReaderDocumentStudy: () => null,
}));

describe("ReaderCollectionWorkspace", () => {
 it("opens Humanities lessons through the document query route", () => {
  const documents = readerDocumentRowSchema
   .array()
   .parse(studioSeed.reader.documents)
   .filter((document) => document.kind === "humanities");
  const firstDocument = documents[0];

  if (firstDocument === undefined) {
   throw new Error("Expected the static Reader corpus to include Humanities documents.");
  }

  const markup = renderToStaticMarkup(
   <NextIntlClientProvider
    locale="vi"
    messages={{ Reader: readerMessages }}
    timeZone="Asia/Ho_Chi_Minh"
   >
    <ReaderCollectionWorkspace
     kind="humanities"
     initialDocuments={documents}
     initialResource={null}
    />
   </NextIntlClientProvider>,
  );

  for (const document of documents) {
   expect(markup).toContain(`href="/humanities?document=${encodeURIComponent(document.id)}"`);
   expect(markup).not.toContain(`/humanities/${document.slug}`);
  }
 });
});
