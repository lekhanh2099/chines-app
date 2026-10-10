import {
 AuthSessionMissingError,
 createClient,
 type SupabaseClient,
 type User,
} from "@supabase/supabase-js";
import { chromium, expect as browserExpect } from "@playwright/test";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { fileURLToPath } from "node:url";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";
import type { redirect as navigationRedirect } from "@/i18n/navigation";
import type { Database } from "@/types/supabase.generated";
import { DictionarySrsPage } from "./DictionarySrsPage";

let locale: AppLocale = "vi";
let client: SupabaseClient<Database>;
const fetchRequest = vi.fn<typeof fetch>();
const redirect = vi.fn<typeof navigationRedirect>();
const user: User = {
 id: "00000000-0000-4000-8000-000000004001",
 aud: "authenticated",
 created_at: "2026-10-10T00:00:00Z",
 app_metadata: {},
 user_metadata: {},
};

vi.mock("@/lib/supabase/server", () => ({ createClient: () => client }));
vi.mock("next-intl/server", () => ({
 getLocale: async () => locale,
 getTranslations: async (namespace: string) => {
  const messages = await loadAppMessages(locale);
  return namespace === "Common"
   ? createTranslator({ locale, messages, namespace: "Common" })
   : createTranslator({ locale, messages, namespace: "Dictionary.srs" });
 },
}));
vi.mock("@/i18n/navigation", () => ({
 Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
 redirect: (...input: Parameters<typeof redirect>) => redirect(...input),
}));

beforeEach(() => {
 locale = "vi";
 fetchRequest.mockReset();
 redirect.mockReset();
 client = createClient<Database>("https://srs-test.supabase.co", "test-key", {
  db: { retry: false },
  global: { fetch: fetchRequest },
  auth: { persistSession: false, autoRefreshToken: false },
 });
 vi.spyOn(client.auth, "getUser").mockResolvedValue({ data: { user }, error: null });
});

afterEach(() => vi.restoreAllMocks());

describe("saved dictionary server-page read states", () => {
 it.each([
  { locale: "vi", errorTitle: "Không thể tải kho SRS", retry: "Thử lại" },
  { locale: "en", errorTitle: "Could not load saved vocabulary", retry: "Retry" },
  { locale: "zh-CN", errorTitle: "无法加载词汇复习库", retry: "重试" },
 ] satisfies ReadonlyArray<{ locale: AppLocale; errorTitle: string; retry: string }>)(
  "renders a retryable read failure rather than empty data in $locale",
  async (testCase) => {
   locale = testCase.locale;
   const messages = await loadAppMessages(locale);
   fetchRequest.mockResolvedValueOnce(
    Response.json({ code: "XX000", message: "private database detail" }, { status: 503 }),
   );
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages}>
     {await DictionarySrsPage({ searchParams: Promise.resolve({ q: " 学习 & học " }) })}
    </NextIntlClientProvider>,
   );
   expect(markup).toContain('role="alert"');
   expect(markup).toContain(testCase.errorTitle);
   expect(markup).toContain(testCase.retry);
   expect(markup).toContain('name="q"');
   expect(markup).toContain('value=" 学习 &amp; học "');
   expect(markup).not.toContain(messages.Dictionary.srs.emptyTitle);
   expect(markup).not.toContain(messages.Dictionary.srs.emptySearchTitle);
   expect(markup).not.toContain("private database detail");
   expect(fetchRequest).toHaveBeenCalledOnce();
  },
 );

 it("keeps real empty and missing-schema results distinct", async () => {
  const messages = await loadAppMessages(locale);
  fetchRequest.mockResolvedValueOnce(Response.json([]));
  const empty = renderToStaticMarkup(await DictionarySrsPage({}));
  expect(empty).toContain(messages.Dictionary.srs.emptyTitle);
  expect(empty).not.toContain('role="alert"');
  fetchRequest.mockResolvedValueOnce(
   Response.json({ code: "42P01", message: "Missing table" }, { status: 404 }),
  );
  const missing = renderToStaticMarkup(await DictionarySrsPage({}));
  expect(missing).toContain(messages.Dictionary.srs.missingSchema);
  expect(missing).not.toContain(messages.Dictionary.srs.emptyTitle);
  expect(fetchRequest).toHaveBeenCalledTimes(2);
 });

 it("redirects a guest before reading personal progress", async () => {
  vi.spyOn(client.auth, "getUser").mockResolvedValue({
   data: { user: null },
   error: new AuthSessionMissingError(),
  });
  expect(await DictionarySrsPage({})).toBeNull();
  expect(redirect).toHaveBeenCalledExactlyOnceWith({ href: "/login", locale: "vi" });
  expect(fetchRequest).not.toHaveBeenCalled();
 });

 it("does not render partial vocabulary when a required resource read fails", async () => {
  const messages = await loadAppMessages(locale);
  fetchRequest
   .mockResolvedValueOnce(Response.json([{ vocab_id: "v-1", is_favorited: true }]))
   .mockResolvedValueOnce(
    Response.json({ code: "XX000", message: "Resource unavailable" }, { status: 503 }),
   );
  const markup = renderToStaticMarkup(await DictionarySrsPage({}));
  expect(markup).toContain('role="alert"');
  expect(markup).toContain(messages.Dictionary.srs.loadErrorTitle);
  expect(markup).not.toContain(messages.Dictionary.srs.emptyTitle);
  expect(markup).not.toContain('aria-label="' + messages.Dictionary.srs.savedWordsAria + '"');
  expect(fetchRequest).toHaveBeenCalledTimes(2);
 });
});

it.runIf(process.env.SRS_BROWSER_TEST === "1")(
 "retries the actual server-page read with its search term through a native GET form",
 async () => {
  let readStatus = 503;
  const reads: URL[] = [];
  fetchRequest.mockImplementation(async (input) => {
   const url = new URL(input instanceof Request ? input.url : String(input));
   reads.push(url);
   if (url.pathname.endsWith("/user_vocab_progress")) {
    return readStatus === 200
     ? Response.json([
        { vocab_id: "v-1", is_favorited: true },
        { vocab_id: "v-2", is_favorited: true },
       ])
     : Response.json({ code: "XX000", message: "private database detail" }, { status: 503 });
   }
   return Response.json([
    { id: "v-1", hanzi: "学习", pinyin: "xuéxí", meaning: "HỌC TẬP" },
    { id: "v-2", hanzi: "再见", pinyin: "zàijiàn", meaning: "tạm biệt" },
   ]);
  });
  const server = await createServer({
   configFile: false,
   cacheDir: "node_modules/.vite/srs-collection-browser",
   resolve: { alias: { "@": fileURLToPath(new URL("../../", import.meta.url)) } },
   server: { host: "127.0.0.1", port: 0 },
   plugins: [
    {
     name: "srs-collection-server-page",
     configureServer(instance) {
      instance.middlewares.use(async (request, response, next) => {
       const url = new URL(request.url ?? "/", "http://srs-fixture.local");
       if (!url.pathname.endsWith("/dictionary")) return next();
       const messages = await loadAppMessages(locale);
       const markup = renderToStaticMarkup(
        <NextIntlClientProvider locale={locale} messages={messages}>
         {await DictionarySrsPage({
          searchParams: Promise.resolve({ q: url.searchParams.get("q") ?? "" }),
         })}
        </NextIntlClientProvider>,
       );
       response.setHeader("Content-Type", "text/html; charset=utf-8");
       response.end(
        `<!doctype html><html lang="${locale}"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${markup}<script type="module" src="/src/app/globals.css"></script></body></html>`,
       );
      });
     },
    },
   ],
  });
  await server.listen();
  try {
   const origin = server.resolvedUrls?.local[0];
   if (!origin) throw new Error("Missing collection fixture URL");
   const browser = await chromium.launch({ headless: true });
   try {
    for (const currentLocale of ["vi", "en", "zh-CN"] satisfies ReadonlyArray<AppLocale>) {
     locale = currentLocale;
     const messages = await loadAppMessages(locale);
     for (const viewport of [
      { width: 1440, height: 900 },
      { width: 820, height: 1180 },
      { width: 412, height: 915 },
     ]) {
      const context = await browser.newContext({ viewport });
      try {
       const page = await context.newPage();
       const errors: string[] = [];
       page.on("pageerror", (error) => errors.push(error.message));
       readStatus = 503;
       const before = reads.length;
       const term = " HỌC & học ";
       await page.goto(`${origin}${locale}/dictionary?q=${encodeURIComponent(term)}`);
       await browserExpect(page.getByRole("alert")).toContainText(
        messages.Dictionary.srs.loadErrorTitle,
       );
       await browserExpect(page.getByText(messages.Dictionary.srs.emptySearchTitle)).toHaveCount(0);
       await browserExpect(page.getByText("private database detail")).toHaveCount(0);
       expect(reads).toHaveLength(before + 1);
       await page.waitForFunction(() => {
        const button = document.querySelector("[data-slot=button]");
        return button !== null && getComputedStyle(button).display === "inline-flex";
       });
       await page.screenshot({
        path: `/tmp/chines-app-srs-collection-${locale}-${viewport.width}-error-20261010.png`,
       });
       await page.keyboard.press("Tab");
       const retry = page.getByRole("button", { name: messages.Common.actions.retry, exact: true });
       await browserExpect(retry).toBeFocused();
       readStatus = 200;
       await page.keyboard.press("Enter");
       await browserExpect(page.getByRole("alert")).toHaveCount(0);
       await browserExpect(
        page.getByRole("textbox", { name: messages.Dictionary.srs.searchAria }),
       ).toHaveValue(term);
       expect(new URL(page.url()).searchParams.get("q")).toBe(term);
       // The query still includes '&', so this acknowledgement is a true empty
       // search result. Submitting a simpler term then resolves the saved word.
       await browserExpect(page.getByText(messages.Dictionary.srs.emptySearchTitle)).toBeVisible();
       expect(reads).toHaveLength(before + 3);
       const search = page.getByRole("textbox", { name: messages.Dictionary.srs.searchAria });
       await search.fill("học");
       await search.press("Enter");
       const words = page.getByRole("region", { name: messages.Dictionary.srs.savedWordsAria });
       await browserExpect(words.getByRole("heading", { name: "学习", exact: true })).toBeVisible();
       await browserExpect(words.getByRole("heading", { name: "再见", exact: true })).toHaveCount(
        0,
       );
       await browserExpect(words.getByRole("link")).toHaveAttribute(
        "href",
        "/dictionary/%E5%AD%A6%E4%B9%A0",
       );
       expect(reads).toHaveLength(before + 5);
       expect(
        reads
         .slice(before)
         .every(
          (read) =>
           !read.pathname.endsWith("/user_vocab_progress") ||
           (read.searchParams.get("user_id") === `eq.${user.id}` &&
            read.searchParams.get("is_favorited") === "eq.true"),
         ),
       ).toBe(true);
       expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
       ).toBe(true);
       expect(errors).toEqual([]);
      } finally {
       await context.close();
      }
     }
    }
   } finally {
    await browser.close();
   }
  } finally {
   await server.close();
  }
 },
 30_000,
);
