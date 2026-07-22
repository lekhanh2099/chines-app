import type {
 HtmlArtifact,
 HtmlArtifactFolder,
 HtmlArtifactSummary,
 HtmlArtifactType,
} from "./html-artifact.schema";

export type FolderFilter = "all" | "unfiled" | string;

export type ArtifactFormState = {
 title: string;
 folderId: string | null;
 artifactType: HtmlArtifactType;
 tagsInput: string;
 html: string;
};

export type DraftSaveStatus = "idle" | "dirty" | "saved" | "error";

export type FolderTreeNode = HtmlArtifactFolder & { children: FolderTreeNode[] };

const emptyArtifactForm: ArtifactFormState = {
 title: "Tệp HTML mới",
 folderId: null,
 artifactType: "practice_page",
 tagsInput: "",
 html: "",
};

export function parseTags(input: string): string[] {
 const seen = new Set<string>();
 const tags: string[] = [];

 for (const rawTag of input.split(",")) {
  const tag = rawTag.trim();
  if (!tag || seen.has(tag)) continue;
  seen.add(tag);
  tags.push(tag);
 }

 return tags;
}

export function toArtifactFormState(
 artifact: HtmlArtifact | null,
 defaultFolderId: string | null,
): ArtifactFormState {
 if (!artifact) return { ...emptyArtifactForm, folderId: defaultFolderId };

 return {
  title: artifact.title,
  folderId: artifact.folderId,
  artifactType: artifact.artifactType,
  tagsInput: artifact.tags.join(", "),
  html: artifact.html,
 };
}

export function getArtifactFormSaveKey(formState: ArtifactFormState): string {
 return JSON.stringify({
  title: formState.title.trim(),
  folderId: formState.folderId,
  artifactType: formState.artifactType,
  tags: parseTags(formState.tagsInput),
  html: formState.html.trim(),
 });
}

export function getDraftSaveLabel(status: DraftSaveStatus, hasArtifact: boolean) {
 if (!hasArtifact) return "Chưa tạo DB";
 if (status === "dirty") return "Có thay đổi chưa lưu";
 if (status === "error") return "Lỗi lưu DB";
 return "Đã lưu DB";
}

export function getFolderCount(artifacts: HtmlArtifactSummary[], folderId: FolderFilter): number {
 if (folderId === "all") return artifacts.length;
 if (folderId === "unfiled") return artifacts.filter((artifact) => !artifact.folderId).length;
 return artifacts.filter((artifact) => artifact.folderId === folderId).length;
}

export function buildFolderTree(folders: HtmlArtifactFolder[]): FolderTreeNode[] {
 const nodeById = new Map<string, FolderTreeNode>();
 const roots: FolderTreeNode[] = [];

 for (const folder of folders) nodeById.set(folder.id, { ...folder, children: [] });

 for (const folder of folders) {
  const node = nodeById.get(folder.id);
  if (!node) continue;
  const parent = folder.parentFolderId ? nodeById.get(folder.parentFolderId) : null;
  if (parent) parent.children.push(node);
  else roots.push(node);
 }

 return roots;
}

export function hasFolderDescendant(
 folders: HtmlArtifactFolder[],
 folderId: string,
 possibleDescendantId: string,
) {
 const childrenByParentId = new Map<string, string[]>();

 for (const folder of folders) {
  if (!folder.parentFolderId) continue;
  const children = childrenByParentId.get(folder.parentFolderId) ?? [];
  children.push(folder.id);
  childrenByParentId.set(folder.parentFolderId, children);
 }

 const stack = [...(childrenByParentId.get(folderId) ?? [])];
 const visited = new Set<string>();

 while (stack.length > 0) {
  const current = stack.pop();
  if (!current || visited.has(current)) continue;
  if (current === possibleDescendantId) return true;
  visited.add(current);
  stack.push(...(childrenByParentId.get(current) ?? []));
 }

 return false;
}
