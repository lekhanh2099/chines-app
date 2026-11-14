import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import readerMessages from "../../../messages/vi/reader.json";
import { HskWorkspace } from "./HskWorkspace";
import type { ReaderDocumentStudy } from "@/features/reading/workspaces/ReaderDocumentStudy";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/reading/repositories/reading-content.repository";

const navigation = vi.hoisted(() => ({ pathname: "/hsk", search: "" }));
const study = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
 useSearchParams: () => new URLSearchParams(navigation.search),
}));
vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
 usePathname: () => navigation.pathname,
}));
vi.mock("@/features/reading/workspaces/ReaderDocumentStudy", () => ({
 ReaderDocumentStudy: (props: ComponentProps<typeof ReaderDocumentStudy>) => {
  study(props);
  return <div data-study={props.resource.document.id} />;
 },
}));

function renderWorkspace(props: ComponentProps<typeof HskWorkspace>) {
 return renderToStaticMarkup(
  <NextIntlClientProvider
   locale="vi"
   messages={{ Reader: readerMessages }}
   timeZone="Asia/Ho_Chi_Minh"
  >
   <HskWorkspace {...props} />
  </NextIntlClientProvider>,
 );
}

describe("HSK source workspace", () => {
 beforeEach(() => {
  navigation.pathname = "/hsk";
  navigation.search = "";
  study.mockClear();
 });

 it("keeps the real 50-document catalog, volume order and short slug links", async () => {
  const documents = await listReaderDocuments("hsk");
  const markup = renderWorkspace({
   initialDocuments: documents.toReversed(),
   initialResource: null,
  });
  expect(documents).toHaveLength(50);
  expect(markup.match(/href="\/hsk\//gu)).toHaveLength(50);
  for (const document of documents)
   expect(markup).toContain(`href="/hsk/${document.slug.replace(/^hsk-/u, "")}"`);
  const titles = readerMessages.collection.hskVolumes;
  expect(markup.indexOf(titles.hsk3)).toBeLessThan(markup.indexOf(titles.hsk4Upper));
  expect(markup.indexOf(titles.hsk4Upper)).toBeLessThan(markup.indexOf(titles.hsk4Lower));
  const ordered = documents
   .filter((document) => document.source_metadata.volume_id === "hsk4-upper")
   .toSorted((left, right) => {
    const a = left.source_metadata.lesson_number;
    const b = right.source_metadata.lesson_number;
    if (typeof a !== "number" || typeof b !== "number")
     throw new Error("HSK4 lesson metadata missing");
    return a - b || (left.reading_number ?? 0) - (right.reading_number ?? 0);
   });
  let previous = -1;
  for (const document of ordered) {
   const position = markup.indexOf(`href="/hsk/${document.slug.replace(/^hsk-/u, "")}"`);
   expect(position).toBeGreaterThan(previous);
   previous = position;
  }
  expect(study).not.toHaveBeenCalled();
 });

 it("keeps full/short slug and document query entry points on Reading's study owner", async () => {
  const documents = await listReaderDocuments("hsk");
  const first = documents[0];
  if (first === undefined) throw new Error("HSK corpus missing");
  const resource = await getReaderDocument(first.id);
  if (resource === null) throw new Error("HSK resource missing");
  for (const slug of [first.slug, first.slug.replace(/^hsk-/u, "")]) {
   navigation.pathname = `/hsk/${slug}`;
   const markup = renderWorkspace({
    initialDocumentSlug: slug,
    initialDocuments: documents,
    initialResource: resource,
   });
   expect(markup).toContain(`data-study="${first.id}"`);
   expect(study).toHaveBeenLastCalledWith(
    expect.objectContaining({
     resource,
     backHref: "/hsk",
     navigationDocuments: documents,
     stateOwner: "reader",
    }),
   );
  }
  navigation.pathname = "/hsk";
  navigation.search = `document=${first.id}`;
  expect(renderWorkspace({ initialDocuments: documents, initialResource: resource })).toContain(
   `data-study="${first.id}"`,
  );
 });

 it("distinguishes an empty catalog, an invalid slug and a missing query resource", () => {
  expect(renderWorkspace({ initialDocuments: [], initialResource: null })).toContain(
   readerMessages.collection.empty,
  );
  navigation.pathname = "/hsk/missing";
  expect(
   renderWorkspace({ initialDocumentSlug: "missing", initialDocuments: [], initialResource: null }),
  ).toContain(readerMessages.collection.notFoundCatalog);
  navigation.pathname = "/hsk";
  navigation.search = "document=missing";
  expect(renderWorkspace({ initialDocuments: [], initialResource: null })).toContain(
   readerMessages.collection.notFoundLibrary,
  );
  expect(study).not.toHaveBeenCalled();
 });
});
