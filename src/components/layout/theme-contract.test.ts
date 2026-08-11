import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { THEME_PALETTE_META, ThemePaletteSchema } from "./theme-contract";

const paletteCss = fs.readFileSync(path.join(process.cwd(), "src/app/theme-palettes.css"), "utf8");
const buttonSource = fs.readFileSync(
 path.join(process.cwd(), "src/components/ui/button.tsx"),
 "utf8",
);
const cardSource = fs.readFileSync(path.join(process.cwd(), "src/components/ui/card.tsx"), "utf8");

const forbiddenFoundationProperties = [
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

 it("allows restrained canvas and Card tint without recoloring neutral foundations", () => {
  expect(paletteCss).toContain("--canvas-background:");
  expect(paletteCss).toContain("--bg-primary: var(--canvas-background)");
  expect(paletteCss).toContain(
   "--theme-card-background: color-mix(in oklch, var(--card)",
  );
  expect(cardSource).toContain("--theme-card-background,var(--bg-card)");

  for (const property of forbiddenFoundationProperties) {
   expect(paletteCss).not.toContain(property);
  }
 });

 it("keeps palette ownership focused on product tint and interactive emphasis", () => {
  expect(paletteCss).toContain("--primary:");
  expect(paletteCss).toContain("--accent:");
  expect(paletteCss).toContain("--ring:");
  expect(paletteCss).toContain("--sidebar-primary:");
  expect(paletteCss).toContain("--sidebar-accent:");
  expect(paletteCss).toContain(".app-active-item");
  expect(paletteCss).toContain("color: var(--primary)");
 });

 it("lets active buttons theme nested Typography instead of resetting to body text", () => {
  expect(buttonSource).toContain("[&_[data-slot=typography]]:text-inherit");
 });
});
