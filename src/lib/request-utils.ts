export type ServerTimingMetric = {
 name: string;
 durationMs: number;
};

export function isAbortError(error: unknown): boolean {
 if (error instanceof DOMException) {
  return error.name === "AbortError";
 }

 return (
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  String((error as { name?: unknown }).name || "") === "AbortError"
 );
}

export function throwIfAborted(signal?: AbortSignal | null): void {
 if (!signal?.aborted) {
  return;
 }

 throw new DOMException("The operation was aborted.", "AbortError");
}

export function createRequestSignal(
 timeoutMs: number,
 signal?: AbortSignal | null,
): AbortSignal {
 const timeoutSignal = AbortSignal.timeout(timeoutMs);
 if (!signal) {
  return timeoutSignal;
 }

 const abortSignalWithAny = AbortSignal as typeof AbortSignal & {
  any?: (signals: AbortSignal[]) => AbortSignal;
 };

 if (typeof abortSignalWithAny.any === "function") {
  return abortSignalWithAny.any([signal, timeoutSignal]);
 }

 return signal.aborted ? signal : timeoutSignal;
}

export function applyServerTimingHeaders(
 headers: Headers,
 metrics: ServerTimingMetric[],
 extraHeaders?: Record<string, string | number | boolean | null | undefined>,
) {
 const timingValue = metrics
  .filter(
   (metric) => Number.isFinite(metric.durationMs) && metric.durationMs >= 0,
  )
  .map(
   (metric) =>
    `${metric.name};dur=${Math.round(metric.durationMs * 100) / 100}`,
  )
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
