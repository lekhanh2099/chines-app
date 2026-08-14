import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { useLearningState } from "@/features/hanzihome/hooks/useLearningState";

const { mockLearningState } = vi.hoisted(() => ({
 mockLearningState: {
  state: {
   settings: {},
   progress: { vocab: {}, grammar: {} },
   bookmarks: { lessons: [], vocab: [], grammar: [], radicals: [] },
   reviewHistory: [],
  },
  isLoading: false,
  isSaving: false,
  isError: false,
  isOnline: true,
  syncStatus: "synced",
  pendingSyncCount: 0,
  lastSyncError: null,
  retrySync: async () => ({ status: "synced", syncedCount: 0, pendingCount: 0 }),
  updateSettings: () => undefined,
  updateVocabProgress: () => undefined,
  updateGrammarProgress: () => undefined,
  recordLearningSession: () => undefined,
  addLearningReviewItem: () => undefined,
  rateLearningReviewItem: () => undefined,
  recordLearningEvent: () => undefined,
  toggleBookmark: () => undefined,
  appendReviewHistory: () => undefined,
 } satisfies ReturnType<typeof useLearningState>,
}));

vi.mock("@/features/hanzihome/hooks/useLearningState", () => ({
 useLearningState: () => mockLearningState,
}));

vi.mock("@/features/hanzihome/HanziHomeReadingSettingsSection", () => ({
 HanziHomeReadingQuickSettingsMenu: () => <div>Desktop reader menu</div>,
}));

vi.mock("@/components/ui/dropdown-menu", () => {
 const passthrough = ({ children }: { children?: ReactNode }) => children;
 return {
  DropdownMenu: passthrough,
  DropdownMenuContent: passthrough,
  DropdownMenuItem: passthrough,
  DropdownMenuSeparator: () => null,
  DropdownMenuTrigger: passthrough,
 };
});

vi.mock("@/components/ui/sheet", () => ({
 Sheet: ({ children }: { children?: ReactNode }) => <div data-testid="sheet">{children}</div>,
 SheetHeader: ({ title }: { title: string }) => <div>{title}</div>,
 SheetBody: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
 SheetFooter: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

import { HanziHomeReadingSettingsTrigger } from "./HanziHomeReadingSettingsTrigger";

describe("HanziHomeReadingSettingsTrigger", () => {
 it("uses one sheet control surface through tablet layouts and keeps the wide desktop menu separate", () => {
  const markup = renderToStaticMarkup(<HanziHomeReadingSettingsTrigger />);

  expect(markup).toContain("xl:hidden");
  expect(markup).toContain('aria-haspopup="dialog"');
  expect(markup).toContain("Phông chữ");
  expect(markup).toContain("Khải thư · 楷体");
  expect(markup).toContain("Cỡ chữ");
  expect(markup).toContain("Cách mở nội dung");
  expect(markup).toContain("Hiển thị");
  expect(markup).toContain("Mở cài đặt đọc đầy đủ");
  expect(markup).toContain("hidden xl:block");
  expect(markup).toContain("Desktop reader menu");
 });
});
