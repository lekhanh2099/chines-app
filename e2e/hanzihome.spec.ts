import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/supabase.generated";
import { pdfAnnotationPayloadSchema } from "../src/features/reading/pdf/pdf-annotations";

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
 await page.goto("/vi/login");
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
 await page.getByRole("button", { name: "Đã nhớ", exact: true }).click();
 await expect(page.getByText("Hôm nay chưa có mục đến hạn", { exact: true })).toBeVisible();
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
 await resetReaderProgress();
 await page.context().grantPermissions(["microphone"], { origin: new URL(baseURL).origin });
 await login(page, accountA);
 await openFirstCoreReading(page);
 await expect(page.getByText("Chưa hoàn thành", { exact: true })).toBeVisible();
 await page.getByRole("button", { name: "Đánh dấu đã học xong" }).click();
 await expect(page.getByText("Đã hoàn thành", { exact: true })).toBeVisible();

 await page.getByRole("button", { name: "Shadowing", exact: true }).click();
 await expect(page.getByRole("button", { name: "Bắt đầu shadowing", exact: true })).toBeVisible();
 await page.route("**/api/tts**", (route) => route.abort());
 await page.getByRole("slider", { name: "Khoảng chờ shadowing", exact: true }).focus();
 await page.keyboard.press("End");
 await page.getByRole("button", { name: "Bắt đầu shadowing", exact: true }).click();
 await expect(page.getByText(/^Đang ghi [1-9]\d*s$/u)).toBeVisible();
 await page.getByRole("button", { name: "Dừng ghi", exact: true }).click();
 await expect(page.getByText("Bản ghi trong phiên này", { exact: true })).toBeVisible();
 await expect(page.locator('audio[aria-label="Bản ghi shadowing"]')).toHaveAttribute(
  "src",
  /^blob:/u,
 );
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
 const acknowledged = page.waitForResponse(
  (response) =>
   response.url().endsWith("/api/reading/pdf/annotations") && response.request().method() === "PUT",
 );
 await page.getByRole("button", { name: "Thử lại", exact: true }).click();
 expect((await acknowledged).ok()).toBe(true);
 await expect(unsaved).toBeHidden();
 const { data: saved, error: savedError } = await admin
  .from("hanzihome_pdf_annotations")
  .select("revision, payload")
  .eq("user_id", user.id)
  .eq("asset_id", assetId)
  .eq("page_number", 21)
  .single();
 if (savedError) throw savedError;
 const payload = pdfAnnotationPayloadSchema.parse(saved.payload);
 // The canonical RPC creates a row at revision 0; later updates increment it.
 expect(saved.revision).toBe(0);
 expect(payload.strokes).toHaveLength(1);
 expect(payload.strokes[0]?.points.length).toBeGreaterThan(1);
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
