import { chromium, expect, test, type Page } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/supabase.generated";
import {
 pdfAnnotationPayloadSchema,
 pdfStrokePath,
} from "../src/features/reading/pdf/pdf-annotations";
import {
 annotationPayloadSchema,
 annotationResponseSchema,
 type PdfAnnotationPayloadInput,
} from "../src/features/reading/pdf/pdf-annotation-api";
import { convertProseMirrorToLexical } from "../src/lib/editor/editor-document";
import {
 LessonTextAnnotationSchema,
 LessonAnnotationNoteResultSchema,
} from "../src/features/hanzihome/annotations/types";
import { HanziHomeSearchIndexResponseSchema } from "../src/features/hanzihome/search/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!supabaseUrl || !["127.0.0.1", "localhost", "[::1]"].includes(new URL(supabaseUrl).hostname)) {
 throw new Error("E2E requires a local Supabase target");
}
const publishableKey =
 process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
 "";
const serviceRoleKey =
 process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD ?? "HanziHome-E2E!2026";
const accountA = {
 email: process.env.E2E_USER_A_EMAIL ?? "hanzihome-e2e-a@example.test",
 password: fixturePassword,
};
const accountB = {
 email: process.env.E2E_USER_B_EMAIL ?? "hanzihome-e2e-b@example.test",
 password: fixturePassword,
};
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3001";

function createAdminClient(): SupabaseClient<Database> {
 if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("E2E requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY");
 }
 return createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
 });
}

async function login(page: Page, account: typeof accountA) {
 if (page.url() !== new URL("/vi/login", baseURL).href) await page.goto("/vi/login");
 await page.waitForLoadState("load");
 await page.getByLabel("Email").fill(account.email);
 await page.getByRole("textbox", { name: "Mật khẩu" }).fill(account.password);
 await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
 await expect(page).toHaveURL(/\/vi\/?$/, { timeout: 15_000 });
}

async function openProfile(page: Page, email: string) {
 await page.getByRole("button", { name: "Mở hồ sơ" }).click();
 await expect(page.getByText(email, { exact: true })).toBeVisible();
}

async function logout(page: Page) {
 await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
 await expect(page).toHaveURL(/\/vi\/login/, { timeout: 15_000 });
}

async function openFirstCoreReading(page: Page) {
 await page.goto("/vi/reader/course");
 const firstReading = page.locator('a[href*="/reader/course/"]').first();
 await expect(firstReading).toBeVisible();
 await firstReading.click();
 await expect(page.getByRole("button", { name: "Đánh dấu đã học xong" })).toBeVisible();
}

async function resetLearningLoopItem() {
 const admin = createAdminClient();
 const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1_000 });
 if (error) throw error;
 const user = data.users.find((candidate) => candidate.email === accountA.email);
 if (!user) throw new Error(`Fixture user ${accountA.email} is missing`);
 const { error: deleteError } = await admin
  .from("hanzihome_learning_loop_items")
  .delete()
  .eq("user_id", user.id)
  .eq("id", "e2e-learning-loop-item");
 if (deleteError) throw deleteError;
 const { error: insertError } = await admin.from("hanzihome_learning_loop_items").insert({
  user_id: user.id,
  id: "e2e-learning-loop-item",
  stable_key: "e2e-learning-loop-item",
  kind: "vocabulary",
  source_id: "e2e-learning-loop-item",
  source_href: "/learning-loop",
  title_zh: "学习",
  title_vi: "học tập",
  prompt_zh: "学习",
  pinyin: "xué xí",
  meaning_vi: "học tập",
  user_answer: "",
  error_key: "",
  state: "learning",
  due_at: new Date(Date.now() - 60_000).toISOString(),
  interval_days: 0,
  correct_streak: 0,
  lapse_count: 0,
  revision: 0,
 });
 if (insertError) throw insertError;
 const { data: resetRow, error: resetError } = await admin
  .from("hanzihome_learning_loop_items")
  .select("revision, due_at, state")
  .eq("user_id", user.id)
  .eq("id", "e2e-learning-loop-item")
  .single();
 if (resetError) throw resetError;
 expect(resetRow.revision).toBe(0);
 expect(resetRow.state).toBe("learning");
 expect(new Date(resetRow.due_at).getTime()).toBeLessThanOrEqual(Date.now());
}

async function resetReaderProgress() {
 const admin = createAdminClient();
 const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1_000 });
 if (error) throw error;
 const user = data.users.find((candidate) => candidate.email === accountA.email);
 if (!user) throw new Error(`Fixture user ${accountA.email} is missing`);
 const { error: deleteError } = await admin
  .from("hanzihome_reader_progress")
  .delete()
  .eq("user_id", user.id);
 if (deleteError) throw deleteError;
}

test("keeps account A state isolated after logout and account B login", async ({ page }) => {
 await login(page, accountA);
 await openProfile(page, accountA.email);
 await logout(page);
 await login(page, accountB);
 await openProfile(page, accountB.email);
 await page.goto("/vi/learning-loop");
 await expect(page.getByText("Hôm nay chưa có mục đến hạn", { exact: true })).toBeVisible();
});

test("loads the authenticated Search index from the isolated content fixtures", async ({
 page,
}) => {
 const guest = await page.request.get("/api/hanzihome/search-index?v=2");
 expect(guest.status()).toBe(401);
 await login(page, accountA);
 const response = await page.request.get("/api/hanzihome/search-index?v=2");
 expect(response.status()).toBe(200);
 expect(response.headers()["cache-control"]).toContain("no-store");
 const index = HanziHomeSearchIndexResponseSchema.parse(await response.json());
 expect(index.items.some((item) => item.kind === "radical")).toBe(true);
});

test("serves a public offline shell without server account or lesson content", async ({ page }) => {
 for (const locale of ["vi", "en", "zh-CN"]) {
  const response = await page.request.get(`/${locale}/offline`, { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).not.toContain(accountA.email);
  expect(html).not.toContain("e2e-offline-lesson");
  expect(response.headers()["set-cookie"] ?? "").toMatch(
   /^(NEXT_LOCALE=(vi|en|zh-CN); Path=\/; SameSite=lax)?$/u,
  );
 }
 await login(page, accountA);
 for (const locale of ["vi", "en", "zh-CN"]) {
  const response = await page.request.get(`/${locale}/offline`, { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).not.toContain(accountA.email);
  expect(html).not.toContain("Offline fixture paragraph A.");
  expect(html).not.toContain("Offline fixture lesson A");
  expect(response.headers()["set-cookie"] ?? "").toMatch(
   /^(NEXT_LOCALE=(vi|en|zh-CN); Path=\/; SameSite=lax)?$/u,
  );
 }
});

test("reopens the downloaded Reader offline and isolates its lessons after account change and logout", async ({
 page,
 context,
}) => {
 test.setTimeout(60_000);
 await login(page, accountA);
 await page.goto(
  "/vi/hanzihome?courseId=e2e-offline-course&lessonId=e2e-offline-lesson&module=lessonText",
 );
 await expect(page.getByText("Offline fixture paragraph A.", { exact: true })).toBeVisible();
 await page.evaluate(async () => {
  await navigator.serviceWorker.ready;
 });
 await expect
  .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
  .toBe(true);
 await expect
  .poll(() =>
   page.evaluate(async () => {
    const cache = await caches.open("hanzihome-static-v13");
    return Boolean(await cache.match("/vi/offline"));
   }),
  )
  .toBe(true);
 await page.goto("/vi/offline");
 await expect(
  page.getByRole("heading", { name: "Offline fixture lesson A", exact: true }),
 ).toBeVisible();
 await page.getByRole("button", { name: "Mở bài đã tải", exact: true }).click();
 await expect(page.getByText("Offline fixture paragraph A.", { exact: true })).toBeVisible();
 let reopened = page;
 try {
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("Offline fixture paragraph A.", { exact: true })).toBeVisible();
  await page.close();
  reopened = await context.newPage();
  await reopened.goto("/vi/offline?lessonId=e2e-offline-lesson&module=lessonText");
  await expect(reopened.getByText("Offline fixture paragraph A.", { exact: true })).toBeVisible();
  for (const viewport of [
   { width: 820, height: 1180 },
   { width: 412, height: 915 },
  ]) {
   await reopened.setViewportSize(viewport);
   await expect(reopened.getByText("Offline fixture paragraph A.", { exact: true })).toBeVisible();
   expect(
    await reopened.evaluate(
     () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
   ).toBe(true);
  }
  await reopened.getByRole("button", { name: "Bài trên máy", exact: true }).click();
  await expect(
   reopened.getByRole("heading", { name: "Offline fixture lesson A", exact: true }),
  ).toBeVisible();
  await reopened.goto("/vi/offline?lessonId=missing-lesson");
  await expect(
   reopened.getByRole("heading", { name: "Chưa có sẵn offline", exact: true }),
  ).toBeVisible();
 } finally {
  await context.setOffline(false);
 }
 await reopened.goto("/vi");
 await openProfile(reopened, accountA.email);
 await logout(reopened);
 await login(reopened, accountB);
 await reopened.goto("/vi/offline");
 await expect(
  reopened.getByRole("heading", { name: "Chưa có bài sẵn sàng offline", exact: true }),
 ).toBeVisible();
 await expect(reopened.getByText("Offline fixture lesson A", { exact: true })).toHaveCount(0);
 try {
  await context.setOffline(true);
  await reopened.goto("/vi/offline?lessonId=e2e-offline-lesson");
  await expect(
   reopened.getByRole("heading", { name: "Chưa có sẵn offline", exact: true }),
  ).toBeVisible();
  await expect(reopened.getByText("Offline fixture paragraph A.", { exact: true })).toHaveCount(0);
 } finally {
  await context.setOffline(false);
 }
 await reopened.goto("/vi");
 await openProfile(reopened, accountB.email);
 await logout(reopened);
 try {
  await context.setOffline(true);
  await reopened.goto("/vi/offline?lessonId=e2e-offline-lesson");
  await expect(
   reopened.getByText(
    "Chưa xác định được tài khoản. Kết nối mạng và đăng nhập lại để mở đúng bài đã tải.",
    { exact: true },
   ),
  ).toBeVisible();
  await expect(reopened.getByText("Offline fixture paragraph A.", { exact: true })).toHaveCount(0);
 } finally {
  await context.setOffline(false);
  await reopened.close();
 }
});

test("restarts Chromium offline with the committed lesson and session in an isolated profile", async () => {
 test.setTimeout(60_000);
 const profile = await mkdtemp(join(tmpdir(), "hanzihome-e2e-offline-"));
 let browserContext = await chromium.launchPersistentContext(profile, { baseURL, headless: true });
 try {
  const page = browserContext.pages()[0] ?? (await browserContext.newPage());
  await login(page, accountA);
  await page.goto(
   "/vi/hanzihome?courseId=e2e-offline-course&lessonId=e2e-offline-lesson&module=lessonText",
  );
  await expect(page.getByText("Offline fixture paragraph A.", { exact: true })).toBeVisible();
  await page.goto("/vi/offline");
  await expect(
   page.getByRole("heading", { name: "Offline fixture lesson A", exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
   await navigator.serviceWorker.ready;
  });
  await expect
   .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
   .toBe(true);
  await expect
   .poll(() =>
    page.evaluate(async () =>
     Boolean(await (await caches.open("hanzihome-static-v13")).match("/vi/offline")),
    ),
   )
   .toBe(true);
  await browserContext.close();
  browserContext = await chromium.launchPersistentContext(profile, {
   baseURL,
   headless: true,
   offline: true,
  });
  const restarted = browserContext.pages()[0] ?? (await browserContext.newPage());
  await restarted.goto(
   "/vi/hanzihome?courseId=e2e-offline-course&lessonId=e2e-offline-lesson&module=lessonText",
  );
  await expect(restarted).toHaveURL(/\/vi\/offline\?/);
  await expect(
   restarted.getByRole("heading", { name: "Học ngoại tuyến", exact: true }),
  ).toBeVisible();
  await expect(restarted.getByText("Offline fixture paragraph A.", { exact: true })).toBeVisible();
  expect(await restarted.evaluate(() => navigator.onLine)).toBe(false);
 } finally {
  try {
   await browserContext.close();
  } finally {
   await rm(profile, { recursive: true, force: true });
  }
 }
});

test("keeps cached lessons after a storage read failure and reports an evicted vocabulary resource", async ({
 page,
 context,
}) => {
 await login(page, accountA);
 const resources = Promise.all([
  page.waitForResponse(
   (response) =>
    response.url().endsWith("/api/hanzihome/lessons/e2e-offline-lesson") &&
    response.status() === 200,
  ),
  page.waitForResponse(
   (response) =>
    response.url().endsWith("/api/hanzihome/lessons/e2e-offline-lesson/vocabulary") &&
    response.status() === 200,
  ),
 ]);
 await page.goto(
  "/vi/hanzihome?courseId=e2e-offline-course&lessonId=e2e-offline-lesson&module=lessonText",
 );
 expect((await resources).every((response) => response.ok())).toBe(true);
 await expect(page.getByText("Offline fixture paragraph A.", { exact: true })).toBeVisible();
 await page.goto("/vi/offline");
 await expect(
  page.getByRole("heading", { name: "Offline fixture lesson A", exact: true }),
 ).toBeVisible();
 await page.addInitScript(() => {
  IDBFactory.prototype.open = () => {
   throw new DOMException("Controlled storage read failure", "InvalidStateError");
  };
 });
 await page.reload();
 await expect(
  page.getByRole("heading", { name: "Không đọc được bộ nhớ offline", exact: true }),
 ).toBeVisible();
 await page.getByRole("button", { name: "Thử lại", exact: true }).click();
 await expect(
  page.getByRole("heading", { name: "Không đọc được bộ nhớ offline", exact: true }),
 ).toBeVisible();
 const recovered = await context.newPage();
 try {
  await recovered.goto("/vi/offline");
  await expect(
   recovered.getByRole("heading", { name: "Offline fixture lesson A", exact: true }),
  ).toBeVisible();
  await recovered.evaluate(
   () =>
    new Promise<void>((resolve, reject) => {
     const request = indexedDB.open("hanzihome-local-db");
     request.onerror = () => reject(request.error);
     request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("content_cache", "readwrite");
      const store = tx.objectStore("content_cache");
      const keys = store.getAllKeys();
      keys.onsuccess = () => {
       for (const key of keys.result) {
        if (typeof key === "string" && key.endsWith(":lesson_vocab:e2e-offline-lesson"))
         store.delete(key);
       }
      };
      tx.oncomplete = () => {
       db.close();
       resolve();
      };
      tx.onerror = () => {
       db.close();
       reject(tx.error);
      };
      tx.onabort = () => {
       db.close();
       reject(tx.error);
      };
     };
    }),
  );
  await recovered.evaluate(async () => {
   await navigator.serviceWorker.ready;
  });
  await expect
   .poll(() => recovered.evaluate(() => navigator.serviceWorker.controller !== null))
   .toBe(true);
  await expect
   .poll(() =>
    recovered.evaluate(async () =>
     Boolean(await (await caches.open("hanzihome-static-v13")).match("/vi/offline")),
    ),
   )
   .toBe(true);
  await context.setOffline(true);
  await recovered.goto("/vi/offline?lessonId=e2e-offline-lesson&module=lessonText");
  await expect(
   recovered.getByRole("heading", { name: "Chưa có sẵn offline", exact: true }),
  ).toBeVisible();
  await expect(recovered.getByText("Offline fixture paragraph A.", { exact: true })).toHaveCount(0);
 } finally {
  await context.setOffline(false);
  await recovered.close();
 }
});

for (const book of [
 { key: "tm3", path: "han-thuong-mai", first: "BÀI 1: 开户汇款", second: "BÀI 2: 按揭买房" },
 {
  key: "nhip-cau",
  path: "nhip-cau-han-ngu",
  first: 'BÀI 1: 我的"希望工程"',
  second: "BÀI 2: 差不多先生传",
 },
 {
  key: "doc-hieu",
  path: "doc-hieu",
  first: "UNIT 1 – TOÀN BỘ 5 BÀI",
  second: "UNIT 2 – GIA ĐÌNH VÀ LỄ TẾT",
 },
]) {
 test(`reopens static textbook ${book.key} offline with local lesson, tab and resume`, async ({
  page,
  context,
 }) => {
  test.setTimeout(60_000);
  await login(page, accountA);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/vi/offline");
  await expect(page.getByRole("list", { name: "Giáo trình có sẵn", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mở giáo trình", exact: true })).toHaveCount(3);
  await expect(page.getByText("Hán thương mại 2", { exact: true })).toHaveCount(0);
  await page.evaluate(async () => {
   await navigator.serviceWorker.ready;
  });
  await expect
   .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
   .toBe(true);
  await expect
   .poll(() =>
    page.evaluate(async () => {
     const cache = await caches.open("hanzihome-static-v13");
     return (
      await Promise.all(
       ["/vi/offline", "/en/offline", "/zh-CN/offline"].map(async (path) =>
        Boolean(await cache.match(path)),
       ),
      )
     ).every(Boolean);
    }),
   )
   .toBe(true);
  const navigationRequests: string[] = [];
  page.on("request", (request) => {
   if (request.url().includes("_rsc=")) navigationRequests.push(request.url());
  });
  try {
   await context.setOffline(true);
   await page.goto(`/vi/hsk/${book.path}?lesson=1&tab=text`);
   await expect(page).toHaveURL(new RegExp(`/vi/offline\\?.*book=${book.key}`));
   const selector = page.getByRole("button", { name: "Chọn bài học", exact: true });
   await expect(selector).toContainText(book.first);
   await expect(page.locator("[data-reader-segment]").first()).toBeVisible();
   await page.reload();
   await expect(selector).toContainText(book.first);
   await selector.click();
   await page.getByRole("button", { name: book.second, exact: true }).click();
   await expect(selector).toContainText(book.second);
   await expect(page).toHaveURL(new RegExp(`book=${book.key}&lesson=2`));
   await page.getByRole("tab", { name: "Từ vựng", exact: true }).click();
   await expect(page).toHaveURL(/tab=vocab/);
   await page.reload();
   await expect(selector).toContainText(book.second);
   await expect(page.getByRole("tab", { name: "Từ vựng", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
   );
   await page.goto(`/vi/offline?book=${book.key}`);
   await expect(selector).toContainText(book.second);
   await expect(page.getByRole("tab", { name: "Từ vựng", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
   );
   expect(navigationRequests).toEqual([]);
  } finally {
   await context.setOffline(false);
  }
 });
}

test("keeps offline textbook focus, locale, mobile and unavailable-book controls", async ({
 page,
 context,
}) => {
 test.setTimeout(60_000);
 await login(page, accountA);
 await page.setViewportSize({ width: 1440, height: 900 });
 await page.goto("/vi/offline");
 await expect(page.getByRole("list", { name: "Giáo trình có sẵn", exact: true })).toBeVisible();
 await expect(page.getByRole("button", { name: "Mở giáo trình", exact: true })).toHaveCount(3);
 await expect(page.getByText("Hán thương mại 2", { exact: true })).toHaveCount(0);
 await page.evaluate(async () => {
  await navigator.serviceWorker.ready;
 });
 await expect
  .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
  .toBe(true);
 await expect
  .poll(() =>
   page.evaluate(async () => {
    const cache = await caches.open("hanzihome-static-v13");
    return (
     await Promise.all(
      ["/vi/offline", "/en/offline", "/zh-CN/offline"].map(async (path) =>
       Boolean(await cache.match(path)),
      ),
     )
    ).every(Boolean);
   }),
  )
  .toBe(true);
 const navigationRequests: string[] = [];
 page.on("request", (request) => {
  if (request.url().includes("_rsc=")) navigationRequests.push(request.url());
 });
 try {
  await context.setOffline(true);
  await page.goto("/vi/offline?book=doc-hieu&lesson=2&tab=vocab");
  await expect(page.getByRole("button", { name: "Chọn bài học", exact: true })).toContainText(
   "UNIT 2 – GIA ĐÌNH VÀ LỄ TẾT",
  );
  const focus = page.getByRole("button", { name: "Chế độ tập trung", exact: true });
  await focus.click();
  await expect(page.getByRole("button", { name: "Chọn bài học", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Bài trên máy", exact: true })).toBeDisabled();
  await page.reload();
  await expect(focus).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Chọn bài học", exact: true })).toBeDisabled();
  await focus.click();
  await page.getByRole("button", { name: "Bài trên máy", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mở giáo trình", exact: true })).toHaveCount(3);
  for (const localized of [
   { locale: "en", title: "Offline study", label: "Open textbook" },
   { locale: "zh-CN", title: "离线学习", label: "打开教材" },
  ]) {
   await page.goto(`/${localized.locale}/offline`);
   await expect(page.getByRole("heading", { name: localized.title, exact: true })).toBeVisible();
   await expect(page.getByRole("button", { name: localized.label, exact: true })).toHaveCount(3);
  }
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto("/vi/offline?book=nhip-cau&lesson=1&tab=text");
  await expect(page.locator("[data-reader-segment]").first()).toBeVisible();
  expect(
   await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
   ),
  ).toBe(true);
  await page.goto("/vi/offline?book=tm2");
  await expect(
   page.getByRole("heading", { name: "Giáo trình không khả dụng", exact: true }),
  ).toBeVisible();
  expect(navigationRequests).toEqual([]);
 } finally {
  await context.setOffline(false);
 }
});

test("ignores a late offline library read after another tab changes the account", async ({
 page,
 context,
}) => {
 test.setTimeout(60_000);
 await login(page, accountA);
 await page.goto(
  "/vi/hanzihome?courseId=e2e-offline-course&lessonId=e2e-offline-lesson&module=lessonText",
 );
 await expect(page.getByText("Offline fixture paragraph A.", { exact: true })).toBeVisible();
 await page.goto("/vi/offline");
 await expect(
  page.getByRole("heading", { name: "Offline fixture lesson A", exact: true }),
 ).toBeVisible();
 await page.evaluate(async () => {
  await navigator.serviceWorker.ready;
 });
 await expect
  .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
  .toBe(true);
 await expect
  .poll(() =>
   page.evaluate(async () =>
    Boolean(await (await caches.open("hanzihome-static-v13")).match("/vi/offline")),
   ),
  )
  .toBe(true);
 await page.addInitScript(() => {
  const original = IDBObjectStore.prototype.getAll;
  let held = sessionStorage.getItem("e2e-offline-read-held") === "1";
  IDBObjectStore.prototype.getAll = function (...args: Parameters<IDBObjectStore["getAll"]>) {
   const request = original.apply(this, args);
   if (this.name === "content_cache" && !held) {
    held = true;
    sessionStorage.setItem("e2e-offline-read-held", "1");
    request.addEventListener(
     "success",
     (event) => {
      event.stopImmediatePropagation();
      document.documentElement.setAttribute("data-offline-read-pending", "true");
      document.addEventListener(
       "release-offline-read",
       () => {
        request.dispatchEvent(new Event("success"));
       },
       { once: true },
      );
     },
     { once: true },
    );
   }
   return request;
  };
 });
 await page.reload();
 await expect(page.locator("html")).toHaveAttribute("data-offline-read-pending", "true");
 const accountTab = await context.newPage();
 try {
  await accountTab.goto("/vi");
  await openProfile(accountTab, accountA.email);
  await logout(accountTab);
  await login(accountTab, accountB);
  await expect(
   page.getByRole("heading", { name: "Chưa có bài sẵn sàng offline", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.dispatchEvent(new Event("release-offline-read")));
  await expect(
   page.getByRole("heading", { name: "Chưa có bài sẵn sàng offline", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Offline fixture lesson A", { exact: true })).toHaveCount(0);
  await context.setOffline(true);
  await page.goto("/vi/offline?lessonId=e2e-offline-lesson&module=lessonText");
  await expect(
   page.getByRole("heading", { name: "Chưa có sẵn offline", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Offline fixture paragraph A.", { exact: true })).toHaveCount(0);
 } finally {
  await context.setOffline(false);
  await accountTab.close();
 }
});

test("preserves downloaded lessons when refreshing their cache exceeds storage quota", async ({
 page,
 context,
}) => {
 await login(page, accountA);
 await page.goto(
  "/vi/hanzihome?courseId=e2e-offline-course&lessonId=e2e-offline-lesson&module=lessonText",
 );
 await expect(page.getByText("Offline fixture paragraph A.", { exact: true })).toBeVisible();
 await page.goto("/vi/offline");
 await expect(
  page.getByRole("heading", { name: "Offline fixture lesson A", exact: true }),
 ).toBeVisible();
 await page.evaluate(async () => {
  await navigator.serviceWorker.ready;
 });
 await expect
  .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
  .toBe(true);
 await expect
  .poll(() =>
   page.evaluate(async () =>
    Boolean(await (await caches.open("hanzihome-static-v13")).match("/vi/offline")),
   ),
  )
  .toBe(true);
 const errors: string[] = [];
 page.on("pageerror", (error) => errors.push(error.message));
 await page.addInitScript(() => {
  const original = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore["put"]>) {
   if (this.name === "content_cache") {
    document.documentElement.setAttribute("data-cache-quota-failed", "true");
    throw new DOMException("Controlled cache quota failure", "QuotaExceededError");
   }
   return original.apply(this, args);
  };
 });
 const resources = Promise.all([
  page.waitForResponse(
   (response) =>
    response.url().endsWith("/api/hanzihome/lessons/e2e-offline-lesson") &&
    response.status() === 200,
  ),
  page.waitForResponse(
   (response) =>
    response.url().endsWith("/api/hanzihome/lessons/e2e-offline-lesson/vocabulary") &&
    response.status() === 200,
  ),
 ]);
 await page.goto(
  "/vi/hanzihome?courseId=e2e-offline-course&lessonId=e2e-offline-lesson&module=lessonText",
 );
 expect((await resources).every((response) => response.ok())).toBe(true);
 await expect(page.getByText("Offline fixture paragraph A.", { exact: true })).toBeVisible();
 await expect(page.locator("html")).toHaveAttribute("data-cache-quota-failed", "true");
 try {
  await context.setOffline(true);
  await page.goto("/vi/offline?lessonId=e2e-offline-lesson&module=lessonText");
  await expect(page.getByText("Offline fixture paragraph A.", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
 } finally {
  await context.setOffline(false);
 }
});

test("keeps private page responses out of shared offline caches and preserves public assets", async ({
 page,
}) => {
 await page.goto("/favicon.svg");
 await page.evaluate(async () => {
  const legacy = await caches.open("hanzihome-static-audit-legacy");
  await legacy.put(
   "/vi/notes",
   new Response("private-fixture-A", { headers: { "Content-Type": "text/html" } }),
  );
  await legacy.put(
   new Request("/vi/notes?_rsc=legacy", { headers: { RSC: "1" } }),
   new Response("private-rsc-A", { headers: { "Content-Type": "text/x-component" } }),
  );
  await legacy.put(
   "/__cache-fixture.css",
   new Response(".fixture { color: red; }", { headers: { "Content-Type": "text/css" } }),
  );
 });
 await login(page, accountA);
 await page.evaluate(async () => {
  await navigator.serviceWorker.ready;
 });
 await expect
  .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
  .toBe(true);
 await page.goto("/vi/notes");
 const rscStatus = await page.evaluate(async () => {
  const response = await fetch("/vi/notes?_rsc=audit", { headers: { RSC: "1" } });
  await response.arrayBuffer();
  return response.status;
 });
 expect(rscStatus).toBe(200);
 const privateCopies = await page.evaluate(async () => {
  const copies: string[] = [];
  for (const key of await caches.keys()) {
   if (!key.startsWith("hanzihome-static-")) continue;
   const cache = await caches.open(key);
   for (const request of await cache.keys()) {
    const response = await cache.match(request);
    const contentType = response?.headers.get("content-type") ?? "";
    if (
     (contentType.includes("text/html") &&
      !["/vi/offline", "/en/offline", "/zh-CN/offline"].includes(new URL(request.url).pathname)) ||
     contentType.includes("text/x-component")
    )
     copies.push(new URL(request.url).pathname);
   }
  }
  return copies;
 });
 expect(privateCopies).toEqual([]);
 await expect(
  page.evaluate(async () => {
   const legacy = await caches.open("hanzihome-static-audit-legacy");
   const asset = await legacy.match("/__cache-fixture.css");
   return asset?.text();
  }),
 ).resolves.toBe(".fixture { color: red; }");
 try {
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Học ngoại tuyến", exact: true })).toBeVisible();
  await expect(page.getByText(accountA.email, { exact: true })).toHaveCount(0);
  const offlineRscStatus = await page.evaluate(async () => {
   const response = await fetch("/vi/notes?_rsc=offline", { headers: { RSC: "1" } });
   return response.status;
  });
  expect(offlineRscStatus).toBe(503);
  await page.evaluate(async () => {
   const cache = await caches.open("hanzihome-static-v13");
   const shell = await cache.match("/vi/offline");
   if (!shell) throw new Error("Public offline shell is missing");
   const asset = Array.from(
    (await shell.text()).matchAll(/src="(\/_next\/static\/[^"]+\.js)"/gu),
    (match) => match[1],
   ).at(0);
   if (!asset) throw new Error("Public offline script is missing");
   for (const key of await caches.keys()) {
    if (key.startsWith("hanzihome-static-")) await (await caches.open(key)).delete(asset);
   }
  });
  await page.reload();
  await expect(page.locator("#offlineTitle")).toBeVisible();
  await page.evaluate(async () => {
   const cache = await caches.open("hanzihome-static-v13");
   for (const path of ["/vi/offline", "/en/offline", "/zh-CN/offline"]) await cache.delete(path);
  });
  await page.reload();
  await expect(page.locator("#offlineTitle")).toBeVisible();
  await expect(page.locator("#offlineLessonList")).toHaveCount(0);
 } finally {
  await page.context().setOffline(false);
 }
});

test("schedules a review and preserves an offline retry", async ({ page }) => {
 await resetLearningLoopItem();
 await login(page, accountA);
 await page.goto("/vi/learning-loop");
 await expect(page.getByRole("heading", { name: "学习" })).toBeVisible();
 await page.getByRole("button", { name: "Đã nhớ", exact: true }).click();
 await expect(page.getByText("Hôm nay chưa có mục đến hạn", { exact: true })).toBeVisible();

 const admin = createAdminClient();
 await expect
  .poll(async () => {
   const { data, error } = await admin
    .from("hanzihome_learning_loop_items")
    .select("revision")
    .eq("id", "e2e-learning-loop-item")
    .single();
   if (error) throw error;
   return data.revision;
  })
  .toBe(1);
 const { data, error } = await admin
  .from("hanzihome_learning_loop_items")
  .select("interval_days, revision, due_at")
  .eq("id", "e2e-learning-loop-item")
  .single();
 if (error) throw error;
 expect(data.interval_days).toBeGreaterThanOrEqual(2);
 expect(data.revision).toBe(1);
 expect(new Date(data.due_at).getTime()).toBeGreaterThan(Date.now());

 await resetLearningLoopItem();
 await page.goto("/vi/learning-loop");
 await expect(page.getByRole("button", { name: "Đã nhớ", exact: true })).toBeVisible();
 await page.context().setOffline(true);
 await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
 await page.getByRole("button", { name: "Đã nhớ", exact: true }).click();
 await expect(page.getByText("Không cập nhật được Learning Loop.", { exact: true })).toBeVisible();
 await page.context().setOffline(false);
 await page.reload();
 const retriedReview = page.waitForResponse(
  (response) =>
   response.url().endsWith("/api/hanzihome/learning-loop") &&
   response.request().method() === "POST",
 );
 await page.getByRole("button", { name: "Đã nhớ", exact: true }).click();
 await expect(page.getByText("Hôm nay chưa có mục đến hạn", { exact: true })).toBeVisible();
 expect((await retriedReview).ok()).toBe(true);
 await expect
  .poll(async () => {
   const { data: retried, error: retryError } = await admin
    .from("hanzihome_learning_loop_items")
    .select("revision, due_at")
    .eq("id", "e2e-learning-loop-item")
    .single();
   if (retryError) throw retryError;
   return {
    revision: retried.revision,
    scheduled: new Date(retried.due_at).getTime() > Date.now(),
   };
  })
  .toEqual({ revision: 1, scheduled: true });
});

test("surfaces a revision conflict when remote state changes", async ({ page }) => {
 test.setTimeout(60_000);
 await resetLearningLoopItem();
 await login(page, accountA);
 await page.goto("/vi/learning-loop");
 const rateButton = page.getByRole("button", { name: "Đã nhớ", exact: true });
 await expect(rateButton).toBeVisible();

 const admin = createAdminClient();
 const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1_000 });
 if (error) throw error;
 const user = data.users.find((candidate) => candidate.email === accountA.email);
 if (!user) throw new Error(`Fixture user ${accountA.email} is missing`);
 const { error: rateError } = await admin.rpc("hanzihome_rate_learning_loop_item_as_server", {
  p_user_id: user.id,
  p_item_id: "e2e-learning-loop-item",
  p_rating: "good",
  p_expected_revision: 0,
 });
 if (rateError) throw rateError;

 await rateButton.click();
 await expect(page.getByText("Không cập nhật được Learning Loop.", { exact: true })).toBeVisible();
});

test("keeps Reader completion explicit and exercises microphone shadowing", async ({ page }) => {
 // Reproduce runners without a usable platform speech voice.
 await page.addInitScript(() => {
  window.speechSynthesis.speak = (utterance) => {
   utterance.onerror?.call(
    utterance,
    new SpeechSynthesisErrorEvent("error", { utterance, error: "synthesis-failed" }),
   );
  };
 });
 await resetReaderProgress();
 await page.context().grantPermissions(["microphone"], { origin: new URL(baseURL).origin });
 await login(page, accountA);
 await openFirstCoreReading(page);
 await expect(page.getByText("Chưa hoàn thành", { exact: true })).toBeVisible();
 await page.getByRole("button", { name: "Đánh dấu đã học xong" }).click();
 await expect(page.getByText("Đã hoàn thành", { exact: true })).toBeVisible();

 // The shadowing panel follows the active paragraph; select its bottom-page context first.
 await page.getByRole("combobox", { name: "Mở mục lục đoạn", exact: true }).click();
 await page.getByRole("option").last().click();
 await page.getByRole("button", { name: "Shadowing", exact: true }).click();
 await expect(page.getByRole("button", { name: "Bắt đầu shadowing", exact: true })).toBeVisible();
 // Keep provider completion independent of the platform's offline speech voices.
 let releaseSpeechRequest = () => {};
 const pendingSpeechRequest = new Promise<void>((resolve) => {
  releaseSpeechRequest = resolve;
 });
 await page.route("**/api/tts**", async (route) => {
  await pendingSpeechRequest;
  await route.abort();
 });
 try {
  await page.getByRole("button", { name: "Bắt đầu shadowing", exact: true }).click();
  await expect(page.getByText(/^Đang ghi [1-9]\d*s$/u)).toBeVisible();
  await page.getByRole("button", { name: "Dừng ghi", exact: true }).click();
  await expect(page.getByText("Bản ghi trong phiên này", { exact: true })).toBeVisible();
  await expect(page.locator('audio[aria-label="Bản ghi shadowing"]')).toHaveAttribute(
   "src",
   /^blob:/u,
  );
 } finally {
  releaseSpeechRequest();
  await page.unrouteAll({ behavior: "wait" });
 }
});

test("retains failed PDF strokes and persists the retried snapshot across reload and page switches", async ({
 page,
}) => {
 const admin = createAdminClient();
 const { data: users, error: usersError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1_000,
 });
 if (usersError) throw usersError;
 const user = users.users.find((candidate) => candidate.email === accountB.email);
 if (!user) throw new Error(`Fixture user ${accountB.email} is missing`);
 const assetId = "hanzihome-studio-asset:public/resources/hanyu-series-reading-book-1.pdf";
 const { error: resetError } = await admin
  .from("hanzihome_pdf_annotations")
  .delete()
  .eq("user_id", user.id)
  .eq("asset_id", assetId)
  .in("page_number", [21, 25]);
 if (resetError) throw resetError;

 await login(page, accountB);
 const loaded = page.waitForResponse(
  (response) =>
   response.url().includes("/api/reading/pdf/annotations?") &&
   response.request().method() === "GET",
 );
 await page.goto("/vi/reader?surface=pdf");
 expect((await loaded).ok()).toBe(true);
 const layer = page.getByRole("img", { name: "Lớp ghi chú PDF", exact: true });
 const paths = layer.locator("path");
 await expect(paths).toHaveCount(0);
 await page.getByRole("button", { name: "Bút vẽ", exact: true }).click();
 await layer.scrollIntoViewIfNeeded();
 const canvas = await layer.boundingBox();
 if (!canvas) throw new Error("PDF annotation canvas is missing");
 await page.route("**/api/reading/pdf/annotations", async (route) => {
  if (route.request().method() === "PUT") {
   await route.fulfill({ status: 503, json: { error: "Controlled PDF save failure" } });
  } else {
   await route.continue();
  }
 });
 const startX = canvas.x + canvas.width / 4;
 const startY = Math.max(canvas.y, 120) + 40;
 await page.mouse.move(startX, startY);
 await page.mouse.down();
 await page.mouse.move(startX + 100, startY + 40, { steps: 10 });
 await page.mouse.up();
 const unsaved = page.getByText(
  "Chưa lưu được ghi chú PDF. Nét vẽ vẫn còn trong phiên này; hãy thử lưu lại.",
  { exact: true },
 );
 await expect(unsaved).toBeVisible();
 await expect(paths).toHaveCount(1);
 await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
 await expect(paths).toHaveCount(0);
 await page.getByRole("button", { name: "Làm lại", exact: true }).click();
 await expect(paths).toHaveCount(1);
 const intendedPath = await paths.getAttribute("d");
 if (!intendedPath) throw new Error("PDF stroke has no path");

 await page.unroute("**/api/reading/pdf/annotations");
 const acknowledgements: Promise<ReturnType<typeof annotationResponseSchema.parse>>[] = [];
 page.on("response", (response) => {
  if (
   response.url().endsWith("/api/reading/pdf/annotations") &&
   response.request().method() === "PUT" &&
   response.ok()
  ) {
   acknowledgements.push(response.json().then((value) => annotationResponseSchema.parse(value)));
  }
 });
 const acknowledged = page.waitForResponse(
  (response) =>
   response.url().endsWith("/api/reading/pdf/annotations") &&
   response.request().method() === "PUT" &&
   response.ok() &&
   annotationPayloadSchema.parse(response.request().postDataJSON()).payload.strokes.length === 1,
 );
 await page.getByRole("button", { name: "Thử lại", exact: true }).click();
 expect((await acknowledged).ok()).toBe(true);
 await expect(unsaved).toBeHidden();
 const acknowledgedRow = (await Promise.all(acknowledgements)).at(-1)?.annotation;
 if (!acknowledgedRow) throw new Error("PDF save has no acknowledged row");
 const { data: saved, error: savedError } = await admin
  .from("hanzihome_pdf_annotations")
  .select("revision, payload")
  .eq("user_id", user.id)
  .eq("asset_id", assetId)
  .eq("page_number", 21)
  .single();
 if (savedError) throw savedError;
 const payload = pdfAnnotationPayloadSchema.parse(saved.payload);
 expect(saved.revision).toBe(acknowledgedRow.revision);
 expect(payload).toEqual(acknowledgedRow.payload);
 expect(payload.strokes).toHaveLength(1);
 expect(payload.strokes[0]?.points.length).toBeGreaterThan(1);
 const savedStroke = payload.strokes[0];
 if (!savedStroke) throw new Error("PDF save has no stroke");
 expect(pdfStrokePath(savedStroke)).toBe(intendedPath);
 await page.reload();
 await expect(paths).toHaveCount(1);
 await expect(paths).toHaveAttribute("d", intendedPath);
 await page.getByRole("button", { name: "Quyển 1 · trang 25", exact: true }).click();
 await expect(paths).toHaveCount(0);
 await expect(page.getByRole("button", { name: "Hoàn tác", exact: true })).toBeDisabled();
 await page.getByRole("button", { name: "Quyển 1 · trang 21", exact: true }).click();
 await expect(paths).toHaveCount(1);
 await expect(paths).toHaveAttribute("d", intendedPath);
});

test("serializes two PDF first creators and keeps revision-zero updates distinct from absence", async ({
 page,
}) => {
 const admin = createAdminClient();
 const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
 if (error) throw error;
 const user = data.users.find((candidate) => candidate.email === accountB.email);
 if (!user) throw new Error("Missing PDF CAS fixture owner");
 const query = {
  assetId: "hanzihome-studio-asset:public/resources/hanyu-series-reading-book-1.pdf",
  pageNumber: 25,
 };
 const reset = () =>
  admin
   .from("hanzihome_pdf_annotations")
   .delete()
   .eq("user_id", user.id)
   .eq("asset_id", query.assetId)
   .eq("page_number", query.pageNumber);
 const cleared = await reset();
 if (cleared.error) throw cleared.error;
 try {
  await login(page, accountB);
  const headers = { "X-HanziHome-Owner-Id": user.id };
  const loaded = await page.request.get(
   `/api/reading/pdf/annotations?assetId=${encodeURIComponent(query.assetId)}&pageNumber=${query.pageNumber}`,
   { headers },
  );
  expect(loaded.status()).toBe(200);
  expect(annotationResponseSchema.parse(await loaded.json()).annotation).toBeNull();
  const first: PdfAnnotationPayloadInput = {
   ...query,
   expectedRevision: 0,
   expectedAbsent: true,
   payload: {
    strokes: [
     {
      id: "first-create-A",
      tool: "pen",
      color: "#ff0000",
      width: 4,
      points: [
       { x: 0.1, y: 0.2 },
       { x: 0.3, y: 0.4 },
      ],
     },
    ],
   },
  };
  const second = annotationPayloadSchema.parse({
   ...first,
   payload: {
    strokes: [
     {
      id: "first-create-B",
      tool: "highlighter",
      color: "#facc15",
      width: 12,
      points: [{ x: 0.6, y: 0.7 }],
     },
    ],
   },
  });
  const [a, b] = await Promise.all([
   page.request.put("/api/reading/pdf/annotations", { headers, data: first }),
   page.request.put("/api/reading/pdf/annotations", { headers, data: second }),
  ]);
  expect([a.status(), b.status()].sort()).toEqual([200, 409]);
  const winner = annotationResponseSchema.parse(
   await (a.status() === 200 ? a : b).json(),
  ).annotation;
  const conflict = annotationResponseSchema.parse(
   await (a.status() === 409 ? a : b).json(),
  ).annotation;
  if (!winner) throw new Error("Missing PDF create acknowledgement");
  expect(winner.revision).toBe(0);
  expect(conflict).toEqual(winner);
  const intended = annotationPayloadSchema.parse(a.status() === 200 ? first : second).payload;
  expect(winner.payload).toEqual(intended);
  const changed = await page.request.put("/api/reading/pdf/annotations", {
   headers,
   data: { ...query, expectedRevision: 0, expectedAbsent: false, payload: { strokes: [] } },
  });
  expect(changed.status()).toBe(200);
  const updated = annotationResponseSchema.parse(await changed.json()).annotation;
  if (!updated) throw new Error("Missing PDF existing-row acknowledgement");
  expect(updated.revision).toBe(1);
  const stale = await page.request.put("/api/reading/pdf/annotations", { headers, data: first });
  expect(stale.status()).toBe(409);
  expect(annotationResponseSchema.parse(await stale.json()).annotation).toEqual(updated);
  const legacy = await page.request.put("/api/reading/pdf/annotations", {
   headers,
   data: { ...query, expectedRevision: 1, payload: { strokes: [] } },
  });
  expect(legacy.status()).toBe(400);
  const { data: saved, error: readError } = await admin
   .from("hanzihome_pdf_annotations")
   .select("*")
   .eq("user_id", user.id)
   .eq("asset_id", query.assetId)
   .eq("page_number", query.pageNumber)
   .single();
  if (readError) throw readError;
  expect(saved.revision).toBe(1);
  expect(pdfAnnotationPayloadSchema.parse(saved.payload)).toEqual({ strokes: [] });
 } finally {
  const removed = await reset();
  if (removed.error) throw removed.error;
 }
});

test("keeps guest Daily Reading local and rejects browser dictionary writes", async ({ page }) => {
 const unauthorizedDailyRequests: string[] = [];
 page.on("response", (response) => {
  if (response.status() === 401 && response.url().includes("/api/hanzihome/reader/daily-reading")) {
   unauthorizedDailyRequests.push(response.url());
  }
 });
 await page.goto("/vi/daily-reading");
 await expect(page).toHaveURL(/\/vi\/daily-reading/);
 await page.waitForTimeout(500);
 expect(unauthorizedDailyRequests).toEqual([]);

 await login(page, accountA);
 const userClient = createClient<Database>(supabaseUrl, publishableKey);
 const session = await userClient.auth.signInWithPassword(accountA);
 if (session.error || !session.data.session) throw session.error ?? new Error("No E2E session");
 const authorization = `Bearer ${session.data.session.access_token}`;
 const headers = {
  apikey: publishableKey,
  Authorization: authorization,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
 };
 const readable = await page.request.get(
  `${supabaseUrl}/rest/v1/dictionary_core?select=id&limit=1`,
  {
   headers,
  },
 );
 expect(readable.ok()).toBe(true);
 const write = await page.request.post(`${supabaseUrl}/rest/v1/dictionary_core`, {
  headers,
  data: {
   headword: "__hanzihome_e2e__",
   lookup_key: "__hanzihome_e2e__",
   data: {},
  },
 });
 expect(write.ok()).toBe(false);
 const rpc = await page.request.post(`${supabaseUrl}/rest/v1/rpc/upsert_legacy_vocabulary_cache`, {
  headers,
  data: { p_hanzi: "__hanzihome_e2e__", p_pinyin: "", p_meaning: "", p_type: "", p_data: {} },
 });
 expect(rpc.ok()).toBe(false);
});

test("keeps two Notes drafts separate and requires a choice before overwriting a newer server version", async ({
 page,
 context,
}) => {
 test.setTimeout(60_000);
 const admin = createAdminClient();
 const { data: users, error: usersError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1_000,
 });
 if (usersError) throw usersError;
 const user = users.users.find((candidate) => candidate.email === accountB.email);
 if (!user) throw new Error(`Fixture user ${accountB.email} is missing`);
 const initialContent = convertProseMirrorToLexical({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Notes CAS fixture" }] }],
 });
 const { data: note, error: createError } = await admin
  .from("notes")
  .insert({
   user_id: user.id,
   title: "Notes CAS E2E",
   category: "general",
   tags: [],
   content: initialContent,
  })
  .select("id")
  .single();
 if (createError) throw createError;
 try {
  await login(page, accountB);
  await page.goto(`/vi/notes/${note.id}`);
  const editorA = page.locator('.note-editor-scroll [contenteditable="true"]');
  await expect(editorA).toHaveText("Notes CAS fixture");
  // Lexical normalizes the imported fixture on first mount. Wait for its
  // acknowledgement before opening B, so B starts without A's pending draft.
  await expect
   .poll(async () => {
    const result = await admin.from("notes").select("revision").eq("id", note.id).single();
    if (result.error) throw result.error;
    return result.data.revision;
   })
   .toBe(1);
  await expect(page.getByRole("main").getByTitle("Đã lưu", { exact: true })).toBeVisible();
  const pageB = await context.newPage();
  await pageB.goto(`/vi/notes/${note.id}`);
  const editorB = pageB.locator('.note-editor-scroll [contenteditable="true"]');
  await expect(editorB).toHaveText("Notes CAS fixture");

  // Delay B's real RPC until A has committed, with B retaining its old base.
  let releaseB = () => {};
  const heldB = new Promise<void>((resolve) => {
   releaseB = resolve;
  });
  await pageB.route("**/rest/v1/rpc/update_note_with_revision", async (route) => {
   await heldB;
   await route.continue();
  });
  try {
   const pendingB = pageB.waitForRequest("**/rest/v1/rpc/update_note_with_revision");
   await editorB.fill("B retained local draft");
   await pendingB;
   await editorA.fill("A committed version");
   await expect
    .poll(async () => {
     const result = await admin.from("notes").select("content").eq("id", note.id).single();
     if (result.error) throw result.error;
     return JSON.stringify(result.data.content);
    })
    .toContain("A committed version");
  } finally {
   releaseB();
   await pageB.unrouteAll({ behavior: "wait" });
  }
  const dialogB = pageB.getByRole("dialog");
  await expect(dialogB).toContainText("B retained local draft");
  await expect(dialogB).toContainText("A committed version");
  await pageB.reload();
  await expect(dialogB).toContainText("B retained local draft");
  await expect(dialogB).toContainText("A committed version");
  await dialogB.getByRole("button", { name: "Giữ bản của tôi và lưu tiếp", exact: true }).click();
  await expect(dialogB).not.toBeVisible();
  await expect
   .poll(async () => {
    const result = await admin.from("notes").select("content").eq("id", note.id).single();
    if (result.error) throw result.error;
    return JSON.stringify(result.data.content);
   })
   .toContain("B retained local draft");
  await expect(editorB).toHaveText("B retained local draft");
  await page.reload();
  await expect(editorA).toHaveText("B retained local draft");
  await pageB.close();
 } finally {
  const removed = await admin.from("notes").delete().eq("id", note.id).eq("user_id", user.id);
  if (removed.error) throw removed.error;
 }
});

test("fences linked Reader Notes writes through the authenticated API and returns the full conflicting snapshot", async ({
 page,
}) => {
 const admin = createAdminClient();
 const userClient = createClient<Database>(supabaseUrl, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
 });
 const signedIn = await userClient.auth.signInWithPassword(accountA);
 if (signedIn.error || !signedIn.data.user)
  throw signedIn.error ?? new Error("Missing fixture user");
 const userId = signedIn.data.user.id;
 const fixtureId = `e2e-annotation-cas-${crypto.randomUUID()}`;
 const course = await admin.from("hanzihome_courses").insert({
  id: fixtureId,
  slug: fixtureId,
  title: "Annotation CAS fixture",
  source: "custom",
  user_id: userId,
 });
 if (course.error) throw course.error;
 let noteId = "";
 try {
  const book = await admin.from("hanzihome_course_books").insert({
   id: fixtureId,
   course_id: fixtureId,
   title: "Annotation CAS fixture",
   source: "custom",
   user_id: userId,
  });
  if (book.error) throw book.error;
  const lesson = await admin.from("hanzihome_lessons").insert({
   id: fixtureId,
   course_id: fixtureId,
   book_id: fixtureId,
   lesson_number: 1,
   lesson_order: 1,
   title_zh: "你好",
   source: "custom",
   owner_id: userId,
  });
  if (lesson.error) throw lesson.error;
  await login(page, accountA);
  const created = await page.request.post("/api/hanzihome/lesson-annotations", {
   data: {
    anchor: {
     lessonId: fixtureId,
     nodeType: "paragraph",
     nodeId: "paragraph-1",
     startOffset: 0,
     endOffset: 2,
     selectedText: "你好",
     prefixText: "",
     suffixText: "",
    },
    noteText: "Original",
   },
  });
  expect(created.ok()).toBe(true);
  const annotation = LessonTextAnnotationSchema.parse((await created.json()).annotation);
  if (!annotation.note) throw new Error("Annotation has no linked note");
  noteId = annotation.note.id;
  expect(annotation.note.revision).toBe(0);
  const serverContent = convertProseMirrorToLexical({
   type: "doc",
   content: [
    { type: "paragraph", content: [{ type: "text", text: "Notes committed first paragraph" }] },
    { type: "paragraph", content: [{ type: "text", text: "Notes full second paragraph" }] },
   ],
  });
  const serverReading = convertProseMirrorToLexical({
   type: "doc",
   content: [{ type: "paragraph", content: [{ type: "text", text: "Notes reading pane" }] }],
  });
  const notesWrite = await userClient.rpc("update_note_with_revision", {
   p_note_id: noteId,
   p_expected_owner: userId,
   p_expected_revision: 0,
   p_changes: { content: serverContent, reading_content: serverReading },
  });
  if (notesWrite.error) throw notesWrite.error;
  const endpoint = `/api/hanzihome/lesson-annotations/${annotation.id}`;
  const stale = await page.request.patch(endpoint, {
   data: { noteText: "Reader retained local intent", expectedRevision: 0 },
  });
  expect(stale.status()).toBe(409);
  expect(stale.headers()["cache-control"]).toBe("private, no-store");
  const conflict = LessonAnnotationNoteResultSchema.parse(await stale.json());
  expect(conflict.saved).toBe(false);
  expect(conflict.annotation.note?.content).toEqual(serverContent);
  expect(conflict.annotation.note?.reading_content).toEqual(serverReading);
  expect(conflict.annotation.note?.revision).toBe(1);
  expect(conflict.annotation.noteText).toBe(
   "Notes committed first paragraph\nNotes full second paragraph",
  );
  const resolved = await page.request.patch(endpoint, {
   headers: { "X-HanziHome-Owner-Id": userId },
   data: { noteText: "Explicit Reader choice", expectedRevision: 1 },
  });
  expect(resolved.ok()).toBe(true);
  const ack = LessonAnnotationNoteResultSchema.parse(await resolved.json());
  expect(ack.saved).toBe(true);
  expect(ack.annotation.note?.revision).toBe(2);
  expect(ack.annotation.note?.reading_content).toEqual(serverReading);
  const staleNotes = await userClient.rpc("update_note_with_revision", {
   p_note_id: noteId,
   p_expected_owner: userId,
   p_expected_revision: 1,
   p_changes: { title: "Stale Notes metadata" },
  });
  expect(staleNotes.error?.code).toBe("40001");
  const legacy = await page.request.patch(endpoint, { data: { noteText: "Missing base" } });
  expect(legacy.status()).toBe(400);
  await openProfile(page, accountA.email);
  await logout(page);
  await login(page, accountB);
  const staleOwnerHeaders = { "X-HanziHome-Owner-Id": userId };
  const staleOwnerRead = await page.request.get(
   `/api/hanzihome/lesson-annotations?lessonId=${encodeURIComponent(fixtureId)}`,
   { headers: staleOwnerHeaders },
  );
  const staleOwnerCreate = await page.request.post("/api/hanzihome/lesson-annotations", {
   headers: staleOwnerHeaders,
   data: {
    anchor: {
     lessonId: fixtureId,
     nodeType: "paragraph",
     nodeId: "paragraph-1",
     startOffset: 0,
     endOffset: 2,
     selectedText: "你好",
     prefixText: "",
     suffixText: "",
    },
    noteText: "Old owner's pending creation",
   },
  });
  const staleOwnerUpdate = await page.request.patch(endpoint, {
   headers: staleOwnerHeaders,
   data: { noteText: "Old owner's pending update", expectedRevision: 2 },
  });
  const staleOwnerDelete = await page.request.delete(endpoint, { headers: staleOwnerHeaders });
  for (const response of [staleOwnerRead, staleOwnerCreate, staleOwnerUpdate, staleOwnerDelete]) {
   expect(response.status()).toBe(412);
   expect(response.headers()["cache-control"]).toBe("private, no-store");
   expect(await response.json()).toMatchObject({ code: "AUTH_OWNER_MISMATCH" });
  }
  const unchangedNote = await admin
   .from("notes")
   .select("revision, content, reading_content")
   .eq("id", noteId)
   .eq("user_id", userId)
   .single();
  if (unchangedNote.error) throw unchangedNote.error;
  expect(unchangedNote.data.revision).toBe(2);
  expect(unchangedNote.data.content).toEqual(ack.annotation.note?.content);
  expect(unchangedNote.data.reading_content).toEqual(serverReading);
  const unchangedAnnotations = await admin
   .from("lesson_text_annotations")
   .select("id")
   .eq("lesson_id", fixtureId);
  if (unchangedAnnotations.error) throw unchangedAnnotations.error;
  expect(unchangedAnnotations.data).toEqual([{ id: annotation.id }]);
  const otherOwner = await page.request.get(
   `/api/hanzihome/lesson-annotations?lessonId=${encodeURIComponent(fixtureId)}`,
  );
  expect(otherOwner.ok()).toBe(true);
  expect(await otherOwner.json()).toEqual({ annotations: [] });
  const rejected = await page.request.patch(endpoint, {
   data: { noteText: "Other account", expectedRevision: 2 },
  });
  expect(rejected.ok()).toBe(false);
  expect(await rejected.text()).not.toContain("Explicit Reader choice");
 } finally {
  if (noteId) {
   const removed = await admin.from("notes").delete().eq("id", noteId).eq("user_id", userId);
   if (removed.error) throw removed.error;
  }
  const bookRemoved = await admin
   .from("hanzihome_course_books")
   .delete()
   .eq("id", fixtureId)
   .eq("user_id", userId);
  if (bookRemoved.error) throw bookRemoved.error;
  const removed = await admin
   .from("hanzihome_courses")
   .delete()
   .eq("id", fixtureId)
   .eq("user_id", userId);
  if (removed.error) throw removed.error;
  await userClient.auth.signOut();
 }
});
