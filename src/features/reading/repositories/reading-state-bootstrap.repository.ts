import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";

import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";
import type { ReaderPronunciationOverrideRow } from "@/features/reading/model/reading-pronunciation.schemas";
import type { ReaderProgressRow } from "@/features/reading/model/reading-progress.schemas";
import { getReaderProgress } from "@/features/reading/repositories/reading-progress.repository";
import { listReaderAnnotations } from "@/features/reading/repositories/reading-annotation.repository";
import { listReaderPronunciationOverrides } from "@/features/reading/repositories/reading-pronunciation.repository";

export async function getReaderStateBootstrap(
 documentId: string,
 context: AuthenticatedRouteContext,
): Promise<{
 progress: ReaderProgressRow | null;
 annotations: ReaderAnnotationRow[];
 overrides: ReaderPronunciationOverrideRow[];
}> {
 const [progress, annotations, overrides] = await Promise.all([
  getReaderProgress(documentId, context),
  listReaderAnnotations(documentId, context),
  listReaderPronunciationOverrides(documentId, context),
 ]);
 return { progress, annotations, overrides };
}
