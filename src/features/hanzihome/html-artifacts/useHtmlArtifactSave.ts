"use client";

import { toast } from "sonner";

import { getHtmlArtifactApiErrorMessage as getApiErrorMessage } from "./html-artifact-display-utils";
import { parseTags, type ArtifactFormState } from "./html-artifact-page-utils";
import type { HtmlArtifact } from "./html-artifact.schema";
import { useCreateHtmlArtifactMutation, useUpdateHtmlArtifactMutation } from "./useHtmlArtifacts";
import type { ArtifactSaveOptions, Nullable } from "./components/HtmlArtifactEditor";

export function useHtmlArtifactSave({
 selectedArtifact,
 onArtifactSaved,
 onShowSavedPreview,
}: {
 selectedArtifact: Nullable<HtmlArtifact>;
 onArtifactSaved: (artifactId: string) => void;
 onShowSavedPreview: () => void;
}) {
 const createMutation = useCreateHtmlArtifactMutation();
 const updateMutation = useUpdateHtmlArtifactMutation();
 const isSaving = createMutation.isPending || updateMutation.isPending;

 const saveArtifact = async (formState: ArtifactFormState, options: ArtifactSaveOptions = {}) => {
  const payload = {
   title: formState.title.trim() || "Tệp HTML mới",
   folderId: formState.folderId,
   artifactType: formState.artifactType,
   tags: parseTags(formState.tagsInput),
   html: formState.html,
  };
  try {
   if (selectedArtifact) {
    const nextArtifact = await updateMutation.mutateAsync({
     artifactId: selectedArtifact.id,
     input: payload,
    });
    onArtifactSaved(nextArtifact.id);
    if (!options.silent) {
     onShowSavedPreview();
     toast.success("Đã lưu tệp HTML");
    }
    return;
   }
   if (options.silent) return;
   const nextArtifact = await createMutation.mutateAsync(payload);
   onArtifactSaved(nextArtifact.id);
   onShowSavedPreview();
   toast.success("Đã tạo tệp HTML");
  } catch (error) {
   if (!options.silent) toast.error(getApiErrorMessage(error, "Không thể lưu tệp HTML"));
   throw error;
  }
 };

 return { isSaving, saveArtifact, updateMutation };
}
