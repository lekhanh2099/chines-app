import "server-only";

import type { JsonObject } from "@/types/json";
import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";

import {
 personalLearningStateRowSchema,
 type PersonalLearningStateRow,
} from "@/features/personal-learning/personal-learning-state.schemas";

export async function getPersonalLearningState(
 nodeId: string,
 context: AuthenticatedRouteContext,
): Promise<PersonalLearningStateRow | null> {
 const { data, error } = await createServiceRoleSupabaseClient()
  .from("hanzihome_personal_learning_state")
  .select("*")
  .eq("user_id", context.user.id)
  .eq("node_id", nodeId)
  .maybeSingle();
 if (error) throw new Error(error.message);
 return data === null ? null : personalLearningStateRowSchema.parse(data);
}

export async function savePersonalLearningState(
 input: {
  nodeId: string;
  state: JsonObject;
  expectedRevision: number;
 },
 context: AuthenticatedRouteContext,
): Promise<PersonalLearningStateRow> {
 const { data, error } = await createServiceRoleSupabaseClient().rpc(
  "hanzihome_upsert_personal_learning_state_as_server",
  {
   p_user_id: context.user.id,
   p_node_id: input.nodeId,
   p_state: input.state,
   p_expected_revision: input.expectedRevision,
  },
 );
 if (error) throw new Error(error.message);
 return personalLearningStateRowSchema.parse(data);
}
