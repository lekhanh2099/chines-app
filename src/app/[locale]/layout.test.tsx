import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { appLocales } from "@/i18n/config";
import { generateStaticParams, metadata } from "./layout";

vi.mock("@/components/layout/runtime/AppToaster", () => ({ AppToaster: vi.fn() }));
vi.mock("@/components/layout/runtime/PwaServiceWorkerRegister", () => ({
 PwaServiceWorkerRegister: vi.fn(),
}));
vi.mock("@/components/layout/theme/ThemeProvider", () => ({ ThemeProvider: vi.fn() }));
vi.mock("@/components/providers/QueryProvider", () => ({ QueryProvider: vi.fn() }));
vi.mock("@/components/ui/overlays/tooltip", () => ({ TooltipProvider: vi.fn() }));
vi.mock("@/features/dictionary/components/VocabInspectorProvider", () => ({
 VocabInspectorProvider: vi.fn(),
}));
vi.mock("@/features/hanzihome/components/layout/AutoSyncReconnectBridge", () => ({
 AutoSyncReconnectBridge: vi.fn(),
}));
vi.mock("@/features/speech/MandarinTtsProvider", () => ({ MandarinTtsProvider: vi.fn() }));

describe("LocaleLayout static params", () => {
 afterEach(() => {
  vi.unstubAllEnvs();
 });

 it("renders locale params on demand during development", () => {
  vi.stubEnv("NODE_ENV", "development");

  expect(generateStaticParams()).toEqual([]);
 });

 it("preserves every locale for production prerendering", () => {
  vi.stubEnv("NODE_ENV", "production");

  expect(generateStaticParams()).toEqual(appLocales.map((locale) => ({ locale })));
 });

 it("refreshes browser icon URLs when the brand asset changes", () => {
  const favicon = readFileSync(new URL("../../../public/favicon.svg", import.meta.url));
  const revision = createHash("sha256").update(favicon).digest("hex").slice(0, 8);
  const iconUrl = `/favicon.svg?v=${revision}`;

  expect(metadata.icons).toEqual({
   icon: iconUrl,
   shortcut: iconUrl,
   apple: iconUrl,
  });
 });
});
