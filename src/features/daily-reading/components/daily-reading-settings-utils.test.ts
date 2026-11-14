import { describe, expect, it } from "vitest";

import { dailyReadingTopicSchema } from "@/features/daily-reading/model/daily-reading.schemas";
import { defaultDailyReadingSettings } from "@/features/daily-reading/model/daily-reading.settings";
import {
 formatCaptureTime,
 getTopicTranslationKey,
} from "@/features/daily-reading/components/daily-reading-settings-utils";

describe("daily-reading-settings-utils", () => {
 it("maps every topic to its generated translation key", () => {
  for (const topic of dailyReadingTopicSchema.options) {
   expect(getTopicTranslationKey(topic)).toBe(`generated.topic.${topic}`);
  }
 });

 it("formats the capture time as zero-padded HH:MM", () => {
  expect(
   formatCaptureTime({ ...defaultDailyReadingSettings, captureTime: { hour: 7, minute: 5 } }),
  ).toBe("07:05");
  expect(
   formatCaptureTime({ ...defaultDailyReadingSettings, captureTime: { hour: 21, minute: 30 } }),
  ).toBe("21:30");
 });
});
