import "server-only";

import type { JsonObject } from "@/types/json";
import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";

import {
 dailyReadingStateRowSchema,
 type DailyReadingStateRow,
} from "@/features/daily-reading/daily-reading-state.schemas";

export async function getDailyReadingState(
 publishedDate: string,
 context: AuthenticatedRouteContext,
): Promise<DailyReadingStateRow | null> {
 const { data, error } = await createServiceRoleSupabaseClient()
  .from("hanzihome_daily_reading_state")
  .select("*")
  .eq("user_id", context.user.id)
  .eq("published_date", publishedDate)
  .maybeSingle();
 if (error) throw new Error(error.message);
 return data === null ? null : dailyReadingStateRowSchema.parse(data);
}

export async function saveDailyReadingState(
 input: {
  publishedDate: string;
  state: JsonObject;
  expectedRevision: number;
 },
 context: AuthenticatedRouteContext,
): Promise<DailyReadingStateRow> {
 const { data, error } = await createServiceRoleSupabaseClient().rpc(
  "hanzihome_upsert_daily_reading_state_as_server",
  {
   p_user_id: context.user.id,
   p_published_date: input.publishedDate,
   p_state: input.state,
   p_expected_revision: input.expectedRevision,
  },
 );
 if (error) throw new Error(error.message);
 return dailyReadingStateRowSchema.parse(data);
}
