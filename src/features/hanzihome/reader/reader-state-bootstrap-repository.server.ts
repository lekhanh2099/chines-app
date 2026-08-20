import "server-only";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";

import type { ReaderAnnotationRow, ReaderPronunciationOverrideRow } from "./reader.schemas";
import type { ReaderProgressRow } from "./reader-state.schemas";
import { getReaderProgress } from "./reader-progress-repository.server";
import { listReaderAnnotations } from "./reader-annotation-repository.server";
import { listReaderPronunciationOverrides } from "./reader-pronunciation-override-repository.server";

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
