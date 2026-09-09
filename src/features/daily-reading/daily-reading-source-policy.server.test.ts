import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
 canonicalDailyReadingUrl,
 isAllowedDailyReadingDomain,
 isEligibleDailyReadingTitle,
 resolveDailyReadingTopic,
 scoreDailyReadingMetadata,
} from "@/features/daily-reading/daily-reading-source-policy.server";

describe("Daily Reading source policy", () => {
 beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-18T03:00:00.000Z"));
 });

 afterEach(() => {
  vi.useRealTimers();
 });

 it("only accepts the reviewed source-domain allowlist", () => {
  expect(isAllowedDailyReadingDomain("www.chinanews.com.cn")).toBe(true);
  expect(isAllowedDailyReadingDomain("culture.people.com.cn")).toBe(true);
  expect(isAllowedDailyReadingDomain("example.com")).toBe(false);
  expect(isAllowedDailyReadingDomain("people.com.cn.example.com")).toBe(false);
 });

 it("canonicalizes allowed URLs and removes tracking parameters", () => {
  expect(
   canonicalDailyReadingUrl(
    "http://www.chinanews.com.cn/cul/2026/08-18/123.shtml?utm_source=test&from=feed",
   ),
  ).toBe("https://www.chinanews.com.cn/cul/2026/08-18/123.shtml");
  expect(canonicalDailyReadingUrl("https://example.com/article")).toBeNull();
 });

 it("rejects excluded news themes while keeping useful learning topics", () => {
  expect(isEligibleDailyReadingTitle("博物馆推出传统文化暑期新展览")).toBe(true);
  expect(isEligibleDailyReadingTitle("暴雨事故最新通报会议举行")).toBe(false);
  expect(resolveDailyReadingTopic("城市博物馆推出非遗文化展览")).toBe("culture");
  expect(resolveDailyReadingTopic("学校开展汉语阅读课堂活动")).toBe("education");
 });

 it("rewards a fresh diverse official source over a repeated topic", () => {
  const publishedAt = "2026-08-18T02:00:00.000Z";
  const diverse = scoreDailyReadingMetadata(
   "博物馆推出传统文化暑期新展览",
   "culture",
   publishedAt,
   ["science"],
   "official-rss",
  );
  const repeated = scoreDailyReadingMetadata(
   "博物馆推出传统文化暑期新展览",
   "culture",
   publishedAt,
   ["culture"],
   "gdelt",
  );

  expect(diverse).toBeGreaterThan(repeated);
 });
});
