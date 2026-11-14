export const DAILY_READING_TIME_ZONE = "Asia/Ho_Chi_Minh";
export const DAILY_READING_PUBLISH_HOUR = 10;

type DailyReadingCaptureTime = {
 hour: number;
 minute: number;
};

type DailyReadingReleaseState = {
 dateKey: string;
 isDue: boolean;
 releaseAt: Date;
 remainingMilliseconds: number;
};

type DailyReadingAutoCaptureDecision = {
 autoCaptureEnabled: boolean;
 isVisible: boolean;
 releaseIsDue: boolean;
 hasScheduledArticle: boolean;
 hasBlockingAttempt: boolean;
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

export function resolveDailyReadingReleaseState(
 now = new Date(),
 captureTime: DailyReadingCaptureTime = { hour: DAILY_READING_PUBLISH_HOUR, minute: 0 },
): DailyReadingReleaseState {
 const parts = resolveDateParts(now);
 const releaseAt = new Date(
  Date.UTC(parts.year, parts.month - 1, parts.day, captureTime.hour - 7, captureTime.minute),
 );
 return {
  dateKey: vietnamDailyReadingDateKey(now),
  isDue: now.getTime() >= releaseAt.getTime(),
  releaseAt,
  remainingMilliseconds: Math.max(0, releaseAt.getTime() - now.getTime()),
 };
}

export function shouldAutoCaptureDailyReading(input: DailyReadingAutoCaptureDecision) {
 return (
  input.autoCaptureEnabled &&
  input.isVisible &&
  input.releaseIsDue &&
  !input.hasScheduledArticle &&
  !input.hasBlockingAttempt
 );
}
