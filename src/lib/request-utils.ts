import { z } from "zod";

const ErrorNameSchema = z.object({
 name: z.string(),
});
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;
const ServerTimingHeaderValueSchema = z.union([
 z.string(),
 z.number(),
 z.boolean(),
 z.null(),
 z.undefined(),
]);

export type ServerTimingMetric = {
 name: string;
 durationMs: number;
};

export function isAbortError(error: Parameters<typeof ErrorNameSchema.safeParse>[0]): boolean {
 if (error instanceof DOMException) {
  return error.name === "AbortError";
 }

 const parsed = ErrorNameSchema.safeParse(error);
 return parsed.success && parsed.data.name === "AbortError";
}

export function throwIfAborted(signal?: Nullable<AbortSignal>): void {
 if (!signal?.aborted) {
  return;
 }

 throw new DOMException("The operation was aborted.", "AbortError");
}

export function createRequestSignal(
 timeoutMs: number,
 signal?: Nullable<AbortSignal>,
): AbortSignal {
 const timeoutSignal = AbortSignal.timeout(timeoutMs);
 if (!signal) {
  return timeoutSignal;
 }

 if (typeof AbortSignal.any === "function") {
  return AbortSignal.any([signal, timeoutSignal]);
 }

 return signal.aborted ? signal : timeoutSignal;
}

export function applyServerTimingHeaders(
 headers: Headers,
 metrics: ServerTimingMetric[],
 extraHeaders?: Record<string, z.infer<typeof ServerTimingHeaderValueSchema>>,
) {
 const timingValue = metrics
  .filter((metric) => Number.isFinite(metric.durationMs) && metric.durationMs >= 0)
  .map((metric) => `${metric.name};dur=${Math.round(metric.durationMs * 100) / 100}`)
  .join(", ");

 if (timingValue) {
  headers.set("Server-Timing", timingValue);
 }

 Object.entries(extraHeaders || {}).forEach(([key, value]) => {
  if (value === undefined || value === null) {
   return;
  }

  headers.set(key, String(value));
 });
}
