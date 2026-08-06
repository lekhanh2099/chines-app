import { describe, expect, it } from "vitest";

import { inspectUiSource } from "./check-ui-standards.mjs";

function inspect(source) {
 return inspectUiSource({ file: "src/features/example/Example.tsx", source });
}

describe("UI standards guard", () => {
 it("rejects direct primitive-library imports outside the UI boundary", () => {
  expect(inspect('import { Dialog } from "@base-ui/react/dialog";')).toEqual([
   expect.stringContaining("directPrimitiveImport"),
  ]);
 });

 it("rejects raw application controls and typography", () => {
  const failures = inspect(
   "export function Example() { return <><button>Save</button><p>Body</p></>; }",
  );

  expect(failures).toEqual([
   expect.stringContaining("rawInteractiveControl"),
   expect.stringContaining("rawApplicationTypography"),
  ]);
 });

 it("allows parent-owned layout classes on canonical primitives", () => {
  expect(
   inspect('export function Example() { return <Button className="w-full md:hidden" />; }'),
  ).toEqual([]);
 });

 it("rejects primitive-owned visual classes and arbitrary feature z-index", () => {
  const failures = inspect(
   'export function Example() { return <><Button className="bg-primary px-4" /><div className="z-[99]" /></>; }',
  );

  expect(failures).toEqual([
   expect.stringContaining("primitiveClassName"),
   expect.stringContaining("featureOwnedZIndex"),
  ]);
 });

 it("rejects arbitrary color and gradient utility recipes outside the UI boundary", () => {
  const failures = inspect(
   'export function Example() { return <div className="bg-[#20233a] text-[rgb(255,255,255)] bg-[linear-gradient(120deg,#fff,#000)]" />; }',
  );

  expect(failures).toEqual([expect.stringContaining("featureVisualEscapeHatch")]);
 });

 it("allows semantic surface tokens outside the UI boundary", () => {
  expect(
   inspect(
    'export function Example() { return <div className="bg-bg-card text-text-primary shadow-theme-sm" />; }',
   ),
  ).toEqual([]);
 });

 it("allows primitive implementation details inside the UI owner boundary", () => {
  expect(
   inspectUiSource({
    file: "src/components/ui/button.tsx",
    source: 'export function Button() { return <button className="bg-primary px-4" />; }',
    isUiOwner: true,
   }),
  ).toEqual([]);
 });
});
