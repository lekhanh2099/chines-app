"use client";

import { useMemo, useState } from "react";

import type { ArtifactFormState } from "./html-artifact-page-utils";
import type { HtmlArtifact } from "./html-artifact.schema";
import { buildHtmlArtifactPreview } from "./html-artifacts-page-model";
import type { Nullable } from "./components/HtmlArtifactEditor";

export function useHtmlArtifactDraftPreview(
 selectedArtifact: Nullable<HtmlArtifact>,
 selectedId: Nullable<string>,
) {
 const [draftPreview, setDraftPreview] = useState<
  Nullable<{
   targetId: string;
   form: ArtifactFormState;
  }>
 >(null);

 const draftPreviewTargetId = selectedArtifact?.id ?? (selectedId === "new" ? "new" : null);
 const activeDraftPreviewForm =
  draftPreviewTargetId && draftPreview?.targetId === draftPreviewTargetId
   ? draftPreview.form
   : null;
 const updateDraftPreview = (form: ArtifactFormState) => {
  if (!draftPreviewTargetId) return;
  setDraftPreview({ targetId: draftPreviewTargetId, form });
 };

 const previewArtifact = useMemo(
  () => buildHtmlArtifactPreview(selectedArtifact, activeDraftPreviewForm),
  [activeDraftPreviewForm, selectedArtifact],
 );

 return { previewArtifact, updateDraftPreview };
}
