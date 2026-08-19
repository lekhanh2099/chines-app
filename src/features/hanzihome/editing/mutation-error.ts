import type { JsonFieldValue } from "@/types/json";
import type { ErrorInput } from "@/types/error";

export class HanziHomeMutationError extends Error {
 constructor(
  message: string,
  readonly status: number,
  readonly details?: JsonFieldValue,
 ) {
  super(message);
  this.name = "HanziHomeMutationError";
 }
}

export function isHanziHomeMutationConflict(error: ErrorInput): error is HanziHomeMutationError {
 return error instanceof HanziHomeMutationError && error.status === 409;
}
