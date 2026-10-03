/**
 * Serial queue for AI-powered selection lookups.
 *
 * Ensures only ONE request runs at a time.  New requests wait
 * for the current one to complete before starting, preventing
 * concurrent AI / DB hits when the user rapidly selects text.
 *
 * Works as a simple mutex: each `enqueue` call chains behind
 * the previous one so execution is strictly sequential.
 */

let lock: Promise<void> = Promise.resolve();

export function enqueueSelectionLookup<T>(fn: () => Promise<T>): Promise<T> {
 const prevLock = lock;
 let release: () => void;
 lock = new Promise<void>((resolve) => {
  release = resolve;
 });

 return prevLock.then(() => fn()).finally(() => release());
}
