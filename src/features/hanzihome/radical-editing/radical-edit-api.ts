import { z } from "zod";
import { JsonValueSchema, type JsonObject } from "@/types/json";
import type { StaticRadicalData } from "@/features/hanzihome/types";
import { HanziHomeMutationError } from "./mutation-error";

const radicalMutationResponseSchema = z.object({
 error: z.string().optional(),
 details: JsonValueSchema.optional(),
});
// RPC hanzihome_update_radical_as_user returns { item: the updated DB row }.
const radicalAcknowledgementSchema = z.object({
 item: z.object({ id: z.string(), updated_at: z.string().min(1) }),
});

export async function updateRadical({
 radical,
 changes,
}: {
 radical: StaticRadicalData;
 changes: JsonObject;
}) {
 const expectedUpdatedAt = radical.editMeta?.updatedAt;
 if (!expectedUpdatedAt) throw new Error("Bộ thủ này chưa có DB write target.");

 const response = await fetch(`/api/hanzihome/content/radicals/${encodeURIComponent(radical.id)}`, {
  method: "PATCH",
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({
   reason: `Cập nhật bộ thủ ${radical.radical}`,
   expectedUpdatedAt,
   changes,
  }),
 });
 const payloadValue = JsonValueSchema.parse(await response.json().catch(() => null));
 const payload = radicalMutationResponseSchema.safeParse(payloadValue);
 if (!response.ok) {
  const message =
   payload.success && payload.data.error
    ? payload.data.error
    : `Không thể lưu bộ thủ (${response.status})`;
  const details = payload.success ? payload.data.details : undefined;
  throw new HanziHomeMutationError(message, response.status, details);
 }
 const acknowledgement = radicalAcknowledgementSchema.parse(payloadValue);
 if (acknowledgement.item.id !== radical.id)
  throw new Error("Radical acknowledgement identity does not match");
 return acknowledgement;
}
