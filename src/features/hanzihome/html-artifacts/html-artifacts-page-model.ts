import { parseTags, type ArtifactFormState, type FolderFilter } from "./html-artifact-page-utils";
import type { HtmlArtifact, HtmlArtifactFolder, HtmlArtifactSummary } from "./html-artifact.schema";
import type { Nullable } from "./components/HtmlArtifactEditor";
import type { MoveDirection } from "./components/HtmlArtifactDirectory";

export function getConcreteFolderId(folderFilter: FolderFilter): Nullable<string> {
 return folderFilter !== "all" && folderFilter !== "unfiled" ? folderFilter : null;
}

export function filterHtmlArtifactSummaries(
 artifacts: HtmlArtifactSummary[],
 activeFolderId: FolderFilter,
 searchQuery: string,
): HtmlArtifactSummary[] {
 const normalizedSearch = searchQuery.trim().toLowerCase();

 return artifacts.filter((artifact) => {
  if (activeFolderId === "unfiled" && artifact.folderId) return false;
  if (activeFolderId !== "all" && activeFolderId !== "unfiled") {
   if (artifact.folderId !== activeFolderId) return false;
  }
  if (!normalizedSearch) return true;

  return [artifact.title, artifact.artifactType, ...artifact.tags]
   .join(" ")
   .toLowerCase()
   .includes(normalizedSearch);
 });
}

export function buildHtmlArtifactPreview(
 selectedArtifact: Nullable<HtmlArtifact>,
 draftForm: Nullable<ArtifactFormState>,
): Nullable<HtmlArtifact> {
 if (!draftForm) return selectedArtifact;
 if (!selectedArtifact && !draftForm.html.trim()) return null;

 const timestamp = selectedArtifact?.updatedAt ?? new Date().toISOString();

 return {
  id: selectedArtifact?.id ?? "draft-preview",
  ownerId: selectedArtifact?.ownerId ?? "draft",
  folderId: draftForm.folderId,
  title: draftForm.title,
  artifactType: draftForm.artifactType,
  tags: parseTags(draftForm.tagsInput),
  html: draftForm.html,
  createdAt: selectedArtifact?.createdAt ?? timestamp,
  updatedAt: timestamp,
 };
}

export function reorderHtmlArtifactFolderSiblings(
 folders: HtmlArtifactFolder[],
 folder: HtmlArtifactFolder,
 direction: MoveDirection,
): Nullable<HtmlArtifactFolder[]> {
 const siblings = folders
  .filter((item) => item.parentFolderId === folder.parentFolderId)
  .slice()
  .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
 const currentIndex = siblings.findIndex((item) => item.id === folder.id);
 const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
 if (currentIndex < 0 || nextIndex < 0 || nextIndex >= siblings.length) return null;
 const reordered = siblings.slice();
 const [movedFolder] = reordered.splice(currentIndex, 1);
 reordered.splice(nextIndex, 0, movedFolder);
 return reordered;
}
