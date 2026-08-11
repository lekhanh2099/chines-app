import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DeveloperApiPage } from "./DeveloperApiPage";

describe("DeveloperApiPage", () => {
 it("renders the feature filters, TypeScript copy affordance and local demo action", () => {
  const markup = renderToStaticMarkup(<DeveloperApiPage />);

  expect(markup).toContain("Tìm và lọc endpoint");
  expect(markup).toContain("Theo feature");
  expect(markup).toContain("Copy type");
  expect(markup).toContain("Chạy demo");
  expect(markup).toContain("Demo response");
  expect(markup).toContain("không gửi request và không dùng key");
  expect(markup).toContain('data-page="true"');
  expect(markup).toContain("grid w-full min-w-0 gap-5");
  expect(markup).not.toContain("max-w-6xl");
 });
});
