import "server-only";

import { listReaderDocuments } from "@/features/reading/repositories/reading-content.repository";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";

type HomeLearningOverview = {
 learningLoopDueCount: number;
 readerCompletedCount: number;
 readerDocumentCount: number;
};

export async function getHomeLearningOverview(userId: string): Promise<HomeLearningOverview> {
 const authority = createServiceRoleSupabaseClient();
 const now = new Date().toISOString();
 const [learningLoopDueResult, readerCompletedResult, readerDocuments] = await Promise.all([
  authority
   .from("hanzihome_learning_loop_items")
   .select("id", { count: "exact", head: true })
   .eq("user_id", userId)
   .lte("due_at", now),
  authority
   .from("hanzihome_reader_progress")
   .select("document_id", { count: "exact", head: true })
   .eq("user_id", userId)
   .eq("completed", true),
  listReaderDocuments(),
 ]);

 if (learningLoopDueResult.error) throw new Error(learningLoopDueResult.error.message);
 if (readerCompletedResult.error) throw new Error(readerCompletedResult.error.message);

 return {
  learningLoopDueCount: learningLoopDueResult.count ?? 0,
  readerCompletedCount: readerCompletedResult.count ?? 0,
  readerDocumentCount: readerDocuments.length,
 };
}
