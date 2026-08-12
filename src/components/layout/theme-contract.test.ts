import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { THEME_PALETTE_META, ThemePaletteSchema } from "./theme-contract";

const paletteCss = fs.readFileSync(path.join(process.cwd(), "src/app/theme-palettes.css"), "utf8");
const surfaceCss = fs.readFileSync(path.join(process.cwd(), "src/app/surface-system.css"), "utf8");
const buttonSource = fs.readFileSync(
 path.join(process.cwd(), "src/components/ui/button.tsx"),
 "utf8",
);
const cardSource = fs.readFileSync(path.join(process.cwd(), "src/components/ui/card.tsx"), "utf8");

const forbiddenPaletteFoundationProperties = [
 "--background:",
 "--card:",
 "--popover:",
 "--border:",
 "--bg-card:",
 "--bg-subtle:",
 "--bg-elevated:",
 "--border-default:",
 "--border-strong:",
];

describe("theme palette contract", () => {
 it("keeps palette metadata complete, including the tea palette", () => {
  expect(ThemePaletteSchema.options).toContain("tea");

  for (const palette of ThemePaletteSchema.options) {
   expect(THEME_PALETTE_META[palette].label.length).toBeGreaterThan(0);
   expect(THEME_PALETTE_META[palette].description.length).toBeGreaterThan(0);
  }
 });

 it("defines every palette for both light and dark modes", () => {
  for (const palette of ThemePaletteSchema.options) {
   for (const theme of ["light", "dark"]) {
    const selector = `[data-theme="${theme}"][data-palette="${palette}"]`;
    expect(paletteCss).toContain(selector);
   }
  }
 });

 it("keeps raw light-dark foundations neutral and palette-owned roles restrained", () => {
  expect(paletteCss).toContain("--canvas-background:");
  expect(paletteCss).toContain("--primary:");
  expect(paletteCss).toContain("--accent:");
  expect(paletteCss).toContain("--ring:");

  for (const property of forbiddenPaletteFoundationProperties) {
   expect(paletteCss).not.toContain(property);
  }
 });

 it("resolves the app through one semantic surface ladder", () => {
  expect(surfaceCss).toContain("--surface-canvas:");
  expect(surfaceCss).toContain("--surface-base:");
  expect(surfaceCss).toContain("--surface-subtle:");
  expect(surfaceCss).toContain("--surface-raised:");
  expect(surfaceCss).toContain("--surface-hover:");
  expect(surfaceCss).toContain("--surface-selected:");
  expect(surfaceCss).toContain("--bg-primary: var(--surface-canvas)");
  expect(surfaceCss).toContain("--bg-card: var(--surface-base)");
  expect(surfaceCss).toContain("--bg-subtle: var(--surface-subtle)");
  expect(surfaceCss).toContain("--theme-card-background: var(--surface-base)");
  expect(surfaceCss).toContain("--study-surface: var(--surface-base)");
  expect(surfaceCss).toContain("--study-surface-muted: var(--surface-subtle)");
  expect(surfaceCss).toContain("--study-chip-accent-bg: var(--surface-selected)");
 });

 it("keeps Card variants on the shared surface ladder", () => {
  expect(cardSource).toContain('const themedCardSurface = "bg-[var(--theme-card-background)]"');
  expect(cardSource).toContain("hover:bg-bg-card-hover");
  expect(cardSource).not.toContain("hover:bg-bg-elevated");
 });

 it("themes active navigation through the selected surface role", () => {
  expect(surfaceCss).toContain(".app-active-item");
  expect(surfaceCss).toContain("background: var(--surface-selected)");
  expect(surfaceCss).toContain("color: var(--primary)");
 });

 it("limits theme animation to structural surfaces and respects reduced motion", () => {
  expect(surfaceCss).toContain("[data-theme-transitioning] *");
  expect(surfaceCss).toContain("transition-duration: 0ms !important");
  expect(surfaceCss).toContain("transition-duration: 140ms !important");
  expect(surfaceCss).toContain("@media (prefers-reduced-motion: reduce)");
 });

 it("lets active buttons theme nested Typography instead of resetting to body text", () => {
  expect(buttonSource).toContain("[&_[data-slot=typography]]:text-inherit");
 });
});
