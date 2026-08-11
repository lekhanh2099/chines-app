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
   inspect(
    'export function Example() { return <><Button className="w-full md:hidden" /><Card className="grid gap-3" /><ActionCard className="w-full" /><Chip className="shrink-0" /><SelectTrigger className="w-full" /><DialogContent className="max-w-2xl" /></>; }',
   ),
  ).toEqual([]);
 });

 it("rejects primitive-owned visual classes and arbitrary feature z-index", () => {
  const failures = inspect(
   'export function Example() { return <><Button className="bg-primary px-4" /><Card className="rounded-xl border bg-bg-card p-4" /><ActionCard className="hover:bg-bg-elevated" /><Badge className="text-xs" /><Chip className="rounded-full px-3" /><DialogContent className="rounded-xl p-8" /><DropdownMenuContent className="shadow-theme-sm" /><BasePopoverPopup className="bg-bg-card" /><div className="z-[99]" /></>; }',
  );

  expect(failures).toEqual([
   expect.stringContaining("primitiveClassName"),
   expect.stringContaining("primitiveClassName"),
   expect.stringContaining("primitiveClassName"),
   expect.stringContaining("primitiveClassName"),
   expect.stringContaining("primitiveClassName"),
   expect.stringContaining("primitiveClassName"),
   expect.stringContaining("primitiveClassName"),
   expect.stringContaining("primitiveClassName"),
   expect.stringContaining("featureOwnedZIndex"),
  ]);
 });

 it("rejects namespace component visual bypasses", () => {
  expect(
   inspect(
    'export function Example() { return <><Popover.Trigger className="rounded-xl bg-bg-card px-3" /><Popover.Popup className="border bg-bg-elevated p-2" /></>; }',
   ),
  ).toEqual([
   expect.stringContaining("primitiveClassName"),
   expect.stringContaining("primitiveClassName"),
  ]);
 });

 it("rejects descendant styling that reaches into canonical component anatomy", () => {
  const failures = inspect(
   'export function Example() { return <PageHeader className="[&_h1]:text-2xl [&_p]:leading-5" />; }',
  );

  expect(failures).toEqual([
   expect.stringContaining("primitiveClassName"),
   expect.stringContaining("componentAnatomyOverride"),
  ]);
 });

 it("rejects select trigger visual repair at feature call sites", () => {
  expect(
   inspect(
    'export function Example() { return <SelectTrigger className="h-10 rounded-lg bg-bg-card px-3 text-sm shadow-none" />; }',
   ),
  ).toEqual([expect.stringContaining("primitiveClassName")]);
 });

 it("rejects styled divs that are being used as application text", () => {
  expect(
   inspect(
    'export function Example({ label }) { return <><div className="font-bold text-text-primary">Heading</div><div className="text-sm">{label}</div></>; }',
   ),
  ).toEqual([
   expect.stringContaining("styledBlockText"),
   expect.stringContaining("styledBlockText"),
  ]);
 });

 it("allows layout divs that only compose typed text", () => {
  expect(
   inspect(
    'export function Example() { return <div className="grid gap-2"><Typography weight="bold">Heading</Typography></div>; }',
   ),
  ).toEqual([]);
 });

 it("rejects arbitrary color and gradient utility recipes outside the UI boundary", () => {
  const failures = inspect(
   'export function Example() { return <div className="bg-[#20233a] text-[rgb(255,255,255)] bg-[linear-gradient(120deg,#fff,#000)]" />; }',
  );

  expect(failures).toEqual([expect.stringContaining("featureVisualEscapeHatch")]);
 });

 it("rejects legacy glass, blur, hero, and elevated-surface escape hatches outside the UI boundary", () => {
  const failures = inspect(
   'export function Example() { return <div className="app-glass-surface app-gradient-hero backdrop-blur-sm shadow-theme-lg" />; }',
  );

  expect(failures).toEqual([expect.stringContaining("featureSurfaceEscapeHatch")]);
 });

 it("allows semantic surface tokens outside the UI boundary on non-primitive layout", () => {
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

 it("allows overlay elevation inside the UI primitive boundary", () => {
  expect(
   inspectUiSource({
    file: "src/components/ui/dialog.tsx",
    source: 'export function Dialog() { return <div className="shadow-theme-lg" />; }',
    isUiOwner: true,
   }),
  ).toEqual([]);
 });
});
