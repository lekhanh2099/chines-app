import { z } from "zod";

import { HanziHomeMutationError } from "@/features/hanzihome/editing/mutation-error";
import { JsonValueSchema } from "@/types/json";
import {
 libraryCollectionIdSchema,
 libraryCoverResponseSchema,
 libraryCoversResponseSchema,
 resetLibraryCoverPayloadSchema,
 resetLibraryCoverResponseSchema,
 saveLibraryCoverPayloadSchema,
 type ResetLibraryCoverPayload,
 type SaveLibraryCoverPayload,
} from "./library-cover.schema";

const apiErrorSchema = z.object({
 error: z.string().optional(),
 details: JsonValueSchema.optional(),
});

async function readCoverResponse(response: Response) {
 const value = JsonValueSchema.parse(await response.json().catch(() => null));
 if (!response.ok) {
  const error = apiErrorSchema.safeParse(value);
  throw new HanziHomeMutationError(
   error.success && error.data.error
    ? error.data.error
    : `Library cover request failed (${response.status})`,
   response.status,
   error.success ? error.data.details : undefined,
  );
 }
 return value;
}

export async function getLibraryCovers() {
 const response = await fetch("/api/hanzihome/library-covers", {
  headers: { Accept: "application/json" },
 });
 return libraryCoversResponseSchema.parse(await readCoverResponse(response)).items;
}

export async function saveLibraryCover({
 collectionId,
 input,
}: {
 collectionId: string;
 input: SaveLibraryCoverPayload;
}) {
 const id = libraryCollectionIdSchema.parse(collectionId);
 const response = await fetch(`/api/hanzihome/library-covers/${encodeURIComponent(id)}`, {
  method: "PUT",
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify(saveLibraryCoverPayloadSchema.parse(input)),
 });
 const acknowledgement = libraryCoverResponseSchema.parse(await readCoverResponse(response));
 if (acknowledgement.item.collectionId !== id)
  throw new Error("Library cover acknowledgement identity does not match");
 return acknowledgement.item;
}

export async function resetLibraryCover({
 collectionId,
 input,
}: {
 collectionId: string;
 input: ResetLibraryCoverPayload;
}) {
 const id = libraryCollectionIdSchema.parse(collectionId);
 const response = await fetch(`/api/hanzihome/library-covers/${encodeURIComponent(id)}`, {
  method: "DELETE",
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify(resetLibraryCoverPayloadSchema.parse(input)),
 });
 const acknowledgement = resetLibraryCoverResponseSchema.parse(await readCoverResponse(response));
 if (acknowledgement.collectionId !== id)
  throw new Error("Library cover reset acknowledgement identity does not match");
 return acknowledgement;
}
