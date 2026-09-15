import { afterEach, describe, expect, it, vi } from "vitest";

import { appLocales } from "@/i18n/config";
import { generateStaticParams } from "./layout";

vi.mock("@/components/layout/AppToaster", () => ({ AppToaster: vi.fn() }));
vi.mock("@/components/layout/PwaServiceWorkerRegister", () => ({
 PwaServiceWorkerRegister: vi.fn(),
}));
vi.mock("@/components/layout/ThemeProvider", () => ({ ThemeProvider: vi.fn() }));
vi.mock("@/components/providers/QueryProvider", () => ({ QueryProvider: vi.fn() }));
vi.mock("@/components/ui/tooltip", () => ({ TooltipProvider: vi.fn() }));
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
});
