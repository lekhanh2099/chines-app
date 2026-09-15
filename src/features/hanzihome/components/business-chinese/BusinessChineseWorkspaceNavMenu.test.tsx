import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
 BusinessChineseWorkspaceNavMenu,
 type BusinessChineseNavTab,
} from "./BusinessChineseWorkspaceNavMenu";

const mockTabs: ReadonlyArray<BusinessChineseNavTab<string>> = [
 { key: "text", label: "Bài khóa" },
 { key: "vocab", label: "Từ vựng" },
 { key: "grammar", label: "Ngữ pháp" },
];

describe("BusinessChineseWorkspaceNavMenu", () => {
 it("renders active tab label in title/aria-label and Menu icon button", () => {
  const markup = renderToStaticMarkup(
   <BusinessChineseWorkspaceNavMenu
    tabs={mockTabs}
    activeView="text"
    onActiveViewChange={vi.fn()}
    isLessonBookmarked={false}
    onToggleLessonBookmark={vi.fn()}
    bookmarkLabel="Đánh dấu bài học"
    bookmarkedLabel="Đã đánh dấu"
    offlineReadyLabel="Đã sẵn sàng offline"
    menuLabel="Nội dung bài học"
   />,
  );

  expect(markup).toContain('aria-label="Nội dung bài học: Bài khóa"');
  expect(markup).toContain('title="Nội dung bài học: Bài khóa"');
  expect(markup).toContain("lucide-menu");
 });

 it("renders bookmark dot indicator when lesson is bookmarked", () => {
  const markup = renderToStaticMarkup(
   <BusinessChineseWorkspaceNavMenu
    tabs={mockTabs}
    activeView="text"
    onActiveViewChange={vi.fn()}
    isLessonBookmarked={true}
    onToggleLessonBookmark={vi.fn()}
    bookmarkLabel="Đánh dấu bài học"
    bookmarkedLabel="Đã đánh dấu"
    offlineReadyLabel="Đã sẵn sàng offline"
   />,
  );

  expect(markup).toContain("bg-warning");
  expect(markup).toContain('aria-label="Đã đánh dấu"');
 });

 it("renders different active tab label in title correctly", () => {
  const markup = renderToStaticMarkup(
   <BusinessChineseWorkspaceNavMenu
    tabs={mockTabs}
    activeView="vocab"
    onActiveViewChange={vi.fn()}
    isLessonBookmarked={false}
    onToggleLessonBookmark={vi.fn()}
    bookmarkLabel="Đánh dấu bài học"
    bookmarkedLabel="Đã đánh dấu"
    offlineReadyLabel="Đã sẵn sàng offline"
   />,
  );

  expect(markup).toContain('aria-label="Nội dung bài học: Từ vựng"');
 });
});
