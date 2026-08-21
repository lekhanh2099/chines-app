import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageHeader } from "./page-header";

describe("PageHeader", () => {
 it("forwards root DOM metadata used by development traceability", () => {
  const markup = renderToStaticMarkup(
   <PageHeader
    title="Reader"
    description="Continue studying"
    data-ui-source="src/features/hanzihome/reader/ReaderWorkspace.tsx:1:1"
   />,
  );

  expect(markup).toContain(
   'data-ui-source="src/features/hanzihome/reader/ReaderWorkspace.tsx:1:1"',
  );
 });
});
