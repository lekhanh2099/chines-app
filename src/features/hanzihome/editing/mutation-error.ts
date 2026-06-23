export class HanziHomeMutationError extends Error {
 constructor(
  message: string,
  readonly status: number,
  readonly details?: unknown,
 ) {
  super(message);
  this.name = "HanziHomeMutationError";
 }
}

export function isHanziHomeMutationConflict(error: unknown): error is HanziHomeMutationError {
 return error instanceof HanziHomeMutationError && error.status === 409;
}
