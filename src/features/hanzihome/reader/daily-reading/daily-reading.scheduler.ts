export const DAILY_READING_TIME_ZONE = "Asia/Ho_Chi_Minh";
export const DAILY_READING_PUBLISH_HOUR = 10;

export type DailyReadingReleaseState = {
 dateKey: string;
 isDue: boolean;
 releaseAt: Date;
 remainingMilliseconds: number;
};

const vietnamDateFormatter = new Intl.DateTimeFormat("en-CA", {
 day: "2-digit",
 month: "2-digit",
 timeZone: DAILY_READING_TIME_ZONE,
 year: "numeric",
});

function resolveDateParts(now: Date) {
 const values = new Map(
  vietnamDateFormatter
   .formatToParts(now)
   .filter((part) => part.type !== "literal")
   .map((part) => [part.type, Number(part.value)]),
 );
 return {
  day: values.get("day") ?? 1,
  month: values.get("month") ?? 1,
  year: values.get("year") ?? 1970,
 };
}

export function vietnamDailyReadingDateKey(now = new Date()): string {
 const parts = resolveDateParts(now);
 return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function resolveDailyReadingReleaseState(now = new Date()): DailyReadingReleaseState {
 const parts = resolveDateParts(now);
 const releaseAt = new Date(
  Date.UTC(parts.year, parts.month - 1, parts.day, DAILY_READING_PUBLISH_HOUR - 7),
 );
 return {
  dateKey: vietnamDailyReadingDateKey(now),
  isDue: now.getTime() >= releaseAt.getTime(),
  releaseAt,
  remainingMilliseconds: Math.max(0, releaseAt.getTime() - now.getTime()),
 };
}

export function formatDailyReadingCountdown(milliseconds: number): string {
 const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000));
 const hours = Math.floor(totalMinutes / 60);
 const minutes = totalMinutes % 60;
 return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
