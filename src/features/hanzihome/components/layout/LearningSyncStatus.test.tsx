import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import commonVi from "../../../../../messages/vi/common.json";
import type { LearningSyncUiState } from "@/features/hanzihome/context/types";

vi.mock("@/lib/env/public", () => ({
 publicSupabaseEnv: {
  url: "https://example.supabase.co",
  key: "test-anon-key",
 },
}));

let mockSync: LearningSyncUiState | undefined;

vi.mock("@/features/hanzihome/context/runtime", () => ({
 useHanziHomeRuntime: () => ({
  learningSync: mockSync,
 }),
}));

import { LearningSyncStatus } from "./ModuleSplitWorkspaceContent";

function renderWithI18n(ui: ReactNode) {
 return renderToStaticMarkup(
  <NextIntlClientProvider locale="vi" messages={{ Common: commonVi }} timeZone="Asia/Ho_Chi_Minh">
   {ui}
  </NextIntlClientProvider>,
 );
}

describe("LearningSyncStatus", () => {
 beforeEach(() => {
  mockSync = undefined;
 });

 it("renders nothing when sync state is undefined", () => {
  mockSync = undefined;
  const html = renderWithI18n(<LearningSyncStatus />);
  expect(html).toBe("");
 });

 it("renders nothing when synced and clean", () => {
  mockSync = {
   status: "synced",
   durability: "durable",
   pendingCount: 0,
   lastError: null,
   isOnline: true,
   retry: async () => ({}),
  };
  const html = renderWithI18n(<LearningSyncStatus />);
  expect(html).toBe("");
 });

 it("renders local storage failure badge on durability: failed, never claiming saved offline", () => {
  mockSync = {
   status: "error",
   durability: "failed",
   pendingCount: 1,
   lastError: "QuotaExceededError",
   isOnline: false,
   retry: async () => ({}),
  };
  const html = renderWithI18n(<LearningSyncStatus />);
  // Must render failure message
  expect(html).toContain("Lỗi lưu trên máy");
  // Must NOT claim "Đã lưu offline"
  expect(html).not.toContain("Đã lưu offline");
  // Must contain retry button
  expect(html).toContain("Thử lại");
 });

 it("renders localSavePending when durability: memory-only", () => {
  mockSync = {
   status: "pending",
   durability: "memory-only",
   pendingCount: 1,
   lastError: null,
   isOnline: true,
   retry: async () => ({}),
  };
  const html = renderWithI18n(<LearningSyncStatus />);
  expect(html).toContain("Đang lưu trên máy...");
 });

 it("renders durablySavedOffline when offline with pending durable writes", () => {
  mockSync = {
   status: "pending",
   durability: "durable",
   pendingCount: 2,
   lastError: null,
   isOnline: false,
   retry: async () => ({}),
  };
  const html = renderWithI18n(<LearningSyncStatus />);
  expect(html).toContain("Đã lưu offline");
 });

 it("renders syncing indicator when syncing online", () => {
  mockSync = {
   status: "syncing",
   durability: "durable",
   pendingCount: 1,
   lastError: null,
   isOnline: true,
   retry: async () => ({}),
  };
  const html = renderWithI18n(<LearningSyncStatus />);
  expect(html).toContain("Đang đồng bộ...");
 });

 it("renders sync error and retry button when sync failed", () => {
  mockSync = {
   status: "error",
   durability: "durable",
   pendingCount: 1,
   lastError: "Network timeout",
   isOnline: true,
   retry: async () => ({}),
  };
  const html = renderWithI18n(<LearningSyncStatus />);
  expect(html).toContain("Chưa đồng bộ");
  expect(html).toContain("Thử lại");
 });
});
