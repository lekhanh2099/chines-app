import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { PersonalLearningPage } from "./PersonalLearningPage";
import { listReaderDocuments } from "@/features/reading/repositories/reading-content.repository";
import type { ReaderCollectionWorkspace } from "@/features/reading/workspaces/ReaderCollectionWorkspace";

const capture = vi.hoisted(() =>
 vi.fn<(props: ComponentProps<typeof ReaderCollectionWorkspace>) => void>(),
);
vi.mock("server-only", () => ({}));
vi.mock("@/features/reading/workspaces/ReaderCollectionWorkspace", () => ({
 ReaderCollectionWorkspace: (props: ComponentProps<typeof ReaderCollectionWorkspace>) => {
  capture(props);
  return null;
 },
}));
beforeEach(() => capture.mockClear());
it("loads a personal collection without a detail until selected", async () => {
 renderToStaticMarkup(await PersonalLearningPage({}));
 expect(capture).toHaveBeenCalledWith(
  expect.objectContaining({ kind: "personal", initialResource: null, initialDocumentSlug: "" }),
 );
});
it("preserves query and slug selection with the same resource identity", async () => {
 const documents = await listReaderDocuments("personal");
 const first = documents[0];
 if (!first) throw new Error("Missing personal corpus");
 for (const selection of [{ documentId: first.id }, { slug: first.slug }]) {
  renderToStaticMarkup(await PersonalLearningPage(selection));
  expect(capture).toHaveBeenLastCalledWith(
   expect.objectContaining({
    kind: "personal",
    initialResource: expect.objectContaining({
     document: expect.objectContaining({ id: first.id }),
    }),
   }),
  );
 }
 renderToStaticMarkup(await PersonalLearningPage({ slug: "missing" }));
 expect(capture).toHaveBeenLastCalledWith(
  expect.objectContaining({ initialDocumentSlug: "missing", initialResource: null }),
 );
});
