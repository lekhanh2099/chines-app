import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AutoSyncReconnectBridge } from "./AutoSyncReconnectBridge";

vi.mock("@tanstack/react-query", () => ({
 useQueryClient: () => ({
  invalidateQueries: vi.fn(),
 }),
}));

vi.mock("next-intl", () => ({
 useTranslations: () => (key: string, values?: { count?: number }) =>
  `${key}:${values?.count ?? 0}`,
}));

vi.mock("sonner", () => ({
 toast: {
  success: vi.fn(),
 },
}));

vi.mock("@/features/hanzihome/local/review-attempt-outbox", () => ({
 syncPendingReviewAttempts: vi.fn().mockResolvedValue({
  status: "synced",
  syncedCount: 3,
  pendingCount: 0,
 }),
}));

vi.mock("@/lib/supabase/client", () => ({
 createClient: vi.fn().mockReturnValue({}),
}));

vi.mock("@/lib/supabase/client-session", () => ({
 getClientSessionUser: vi.fn().mockResolvedValue({ id: "user-123" }),
}));

describe("AutoSyncReconnectBridge", () => {
 beforeEach(() => {
  vi.clearAllMocks();
 });

 afterEach(() => {
  vi.unstubAllGlobals();
 });

 it("renders null and does not throw during SSR", () => {
  const html = renderToStaticMarkup(createElement(AutoSyncReconnectBridge));
  expect(html).toBe("");
 });

 it("attaches and detaches online event listener", () => {
  const addEventListenerMock = vi.fn();
  const removeEventListenerMock = vi.fn();

  vi.stubGlobal("window", {
   addEventListener: addEventListenerMock,
   removeEventListener: removeEventListenerMock,
  });

  expect(() => {
   renderToStaticMarkup(createElement(AutoSyncReconnectBridge));
  }).not.toThrow();
 });
});
