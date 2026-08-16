import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { THEME_PALETTE_META, ThemePaletteSchema } from "./theme-contract";

const globalsCss = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
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
 "--bg-card:",
 "--bg-subtle:",
 "--bg-elevated:",
 "--border-default:",
];

const percentageColorRecipe = /(?:color-mix\([^\n]*%|hsla?\([^\n]*%)/;
const decorativeGradient = /(?:linear-gradient|radial-gradient|conic-gradient)\(/;

describe("theme palette contract", () => {
 it("keeps palette metadata complete, including the tea compatibility palette", () => {
  expect(ThemePaletteSchema.options).toContain("tea");

  for (const palette of ThemePaletteSchema.options) {
   expect(THEME_PALETTE_META[palette].label.length).toBeGreaterThan(0);
   expect(THEME_PALETTE_META[palette].description.length).toBeGreaterThan(0);
  }
 });

 it("defines every persisted palette for both light and dark modes", () => {
  for (const palette of ThemePaletteSchema.options) {
   for (const theme of ["light", "dark"]) {
    const selector = `[data-theme="${theme}"][data-palette="${palette}"]`;
    expect(paletteCss).toContain(selector);
   }
  }
 });

 it("ports the Hanzi Studio Editorial Study Workspace foundation", () => {
  expect(globalsCss).toContain("--theme-background: oklch(0.978 0.014 255)");
  expect(globalsCss).toContain("--theme-surface: oklch(0.998 0.003 255)");
  expect(globalsCss).toContain("--theme-reading-canvas: oklch(0.997 0.004 92)");
  expect(globalsCss).toContain("--theme-primary: oklch(0.565 0.205 258)");
  expect(globalsCss).toContain("--theme-accent: oklch(0.58 0.155 188)");
  expect(globalsCss).toContain("--theme-background: oklch(0.17 0.035 264)");
  expect(globalsCss).toContain("--theme-primary: oklch(0.72 0.17 258)");
 });

 it("keeps palettes on source semantic theme roles instead of redefining app foundations", () => {
  expect(paletteCss).toContain("--theme-background:");
  expect(paletteCss).toContain("--theme-primary:");
  expect(paletteCss).toContain("--theme-primary-soft:");
  expect(paletteCss).toContain("--theme-accent:");

  for (const property of forbiddenPaletteFoundationProperties) {
   expect(paletteCss).not.toContain(property);
  }
 });

 it("uses explicit numeric theme colors with no percentage recipes or decorative gradients", () => {
  for (const css of [globalsCss, paletteCss, surfaceCss]) {
   expect(css).not.toMatch(percentageColorRecipe);
   expect(css).not.toMatch(decorativeGradient);
  }
 });

 it("resolves the app through one Hanzi Studio semantic surface ladder", () => {
  expect(surfaceCss).toContain("--surface-canvas: var(--theme-background)");
  expect(surfaceCss).toContain("--surface-base: var(--theme-surface)");
  expect(surfaceCss).toContain("--surface-subtle: var(--theme-surface-muted)");
  expect(surfaceCss).toContain("--surface-raised: var(--theme-surface-raised)");
  expect(surfaceCss).toContain("--surface-hover: var(--theme-surface-hover)");
  expect(surfaceCss).toContain("--surface-selected: var(--theme-primary-soft)");
  expect(surfaceCss).toContain("--surface-selected-border: var(--theme-primary)");
  expect(surfaceCss).toContain("--bg-primary: var(--surface-canvas)");
  expect(surfaceCss).toContain("--bg-card: var(--surface-base)");
  expect(surfaceCss).toContain("--bg-subtle: var(--surface-subtle)");
  expect(surfaceCss).toContain("--study-surface: var(--surface-base)");
  expect(surfaceCss).toContain("--study-surface-muted: var(--surface-subtle)");
  expect(surfaceCss).toContain("--study-chip-accent-bg: var(--surface-selected)");
 });

 it("keeps Card variants on the shared source surface ladder", () => {
  expect(cardSource).toContain('default: "border-border-default bg-surface"');
  expect(cardSource).toContain('elevated: "border-border-default bg-surface-raised shadow-theme-sm"');
  expect(cardSource).toContain('subtle: "border-border-default bg-surface-muted"');
  expect(cardSource).toContain("hover:bg-surface-hover");
  expect(cardSource).not.toContain("themedCardSurface");
 });

 it("themes active navigation through the selected source role", () => {
  expect(surfaceCss).toContain(".app-active-item");
  expect(surfaceCss).toContain("background: var(--surface-selected)");
  expect(surfaceCss).toContain("color: var(--theme-primary)");
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
