import { describe, expect, it } from "vitest";

import uiSourceTraceLoader from "./ui-source-trace-loader.cjs";

const { transformUiSource } = uiSourceTraceLoader;

const sourcePath = "src/features/hanzihome/reader/ReaderDemo.tsx";
const context = {
 resourcePath: `/workspace/${sourcePath}`,
 rootContext: "/workspace",
};

describe("ui-source-trace-loader", () => {
 it("injects project-relative source coordinates into intrinsic and component JSX", () => {
  const source = [
   "export function ReaderDemo() {",
   " return (",
   "  <div>",
   "   <Typography>阅读</Typography>",
   "  </div>",
   " );",
   "}",
  ].join("\n");

  const output = transformUiSource(source, context);

  expect(output).toContain(`<div data-ui-source="${sourcePath}:3:3">`);
  expect(output).toContain(
   `<Typography data-ui-source="${sourcePath}:4:4">阅读</Typography>`,
  );
 });

 it("does not decorate React infrastructure or context providers", () => {
  const source = [
   "function ReaderDemo() {",
   " return (",
   "  <React.StrictMode>",
   "   <Context.Provider value={null}>",
   "    <Button />",
   "   </Context.Provider>",
   "  </React.StrictMode>",
   " );",
   "}",
  ].join("\n");

  const output = transformUiSource(source, context);

  expect(output).not.toContain("<React.StrictMode data-ui-source=");
  expect(output).not.toContain("<Context.Provider data-ui-source=");
  expect(output).toContain(`<Button data-ui-source="${sourcePath}:5:5" />`);
 });

 it("preserves an explicitly supplied source marker without duplicating it", () => {
  const source = '<div data-ui-source="fixture">text</div>';
  const output = transformUiSource(source, context);

  expect(output).toBe(source);
  expect(output.match(/data-ui-source=/g)).toHaveLength(1);
 });

 it("preserves multiline JSX while adding the marker at the callsite", () => {
  const source = [
   "function ReaderDemo() {",
   " return (",
   "  <Button",
   '   type="button"',
   "  >",
   "   Open",
   "  </Button>",
   " );",
   "}",
  ].join("\n");

  const output = transformUiSource(source, context);

  expect(output).toContain(`<Button data-ui-source="${sourcePath}:3:3"\n   type="button"`);
 });
});
