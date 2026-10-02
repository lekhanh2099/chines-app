"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { Copy, FolderPlus, Loader2, PlugZap, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { JsonFieldValue } from "@/types/json";
import type {
 HtmlArtifact,
 HtmlArtifactFolder,
 HtmlArtifactFolderColor,
} from "../html-artifact.schema";
import { htmlArtifactFolderSchema, htmlArtifactSummarySchema } from "../html-artifact.schema";

const NullableStringSchema = z.string().nullable();
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

const PublishConnectionInfoSchema = z.object({
 sessionUserId: NullableStringSchema,
 publishTokenEnabled: z.boolean(),
 publishOwnerId: NullableStringSchema,
 serviceRoleEnabled: z.boolean(),
});

export type DeleteDialogState = z.infer<
 z.ZodDiscriminatedUnion<
  [
   z.ZodObject<{
    kind: z.ZodLiteral<"artifact">;
    artifact: typeof htmlArtifactSummarySchema;
   }>,
   z.ZodObject<{
    kind: z.ZodLiteral<"folder">;
    folder: typeof htmlArtifactFolderSchema;
   }>,
  ],
  "kind"
 >
>;

type FolderColorSwatchStyle = {
 backgroundColor: CSSProperties["backgroundColor"];
 borderColor: CSSProperties["borderColor"];
};

const folderColorSwatchStyles: Record<HtmlArtifactFolderColor, FolderColorSwatchStyle> = {
 blue: { backgroundColor: "var(--color-info)", borderColor: "var(--color-info)" },
 purple: { backgroundColor: "var(--color-purple)", borderColor: "var(--color-purple)" },
 green: { backgroundColor: "var(--color-success)", borderColor: "var(--color-success)" },
 orange: { backgroundColor: "var(--color-warning)", borderColor: "var(--color-warning)" },
 rose: { backgroundColor: "var(--color-danger)", borderColor: "var(--color-danger)" },
 slate: {
  backgroundColor: "var(--color-text-muted)",
  borderColor: "var(--color-border-default)",
 },
};

export const folderColorSequence: HtmlArtifactFolderColor[] = [
 "blue",
 "purple",
 "green",
 "orange",
 "rose",
 "slate",
];

function maskToken(token: string) {
 if (token.length <= 24) return "••••";
 return `${token.slice(0, 12)}...${token.slice(-8)}`;
}

function parsePublishConnectionInfo(
 value: JsonFieldValue,
): z.infer<z.ZodNullable<typeof PublishConnectionInfoSchema>> {
 const parsed = PublishConnectionInfoSchema.safeParse(value);
 return parsed.success ? parsed.data : null;
}

function KeyValueRow({ label, value }: { label: string; value: string }) {
 return (
  <div className="grid gap-1 rounded-lg border border-border-default bg-bg-subtle px-3 py-2">
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    transform="uppercase"
    scale="relativeSmall"
   >
    {label}
   </StudyInstructionText>
   <StudyInstructionText variant="code" tone="default" weight="bold" wrapping="breakAll">
    {value}
   </StudyInstructionText>
  </div>
 );
}

export function PublishConnectionDialog({
 selectedArtifact,
 isOpen,
 onOpenChange,
}: {
 selectedArtifact: Nullable<HtmlArtifact>;
 isOpen: boolean;
 onOpenChange: (open: boolean) => void;
}) {
 const endpointPath = "/api/hanzihome/html-artifacts/publish";
 const displayEndpoint = `https://your-domain.com${endpointPath}`;
 const supabase = useMemo(() => createBrowserSupabaseClient(), []);
 const [connectionInfo, setConnectionInfo] =
  useState<z.infer<z.ZodNullable<typeof PublishConnectionInfoSchema>>>(null);
 const [sessionAccessToken, setSessionAccessToken] =
  useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const [isLoadingConnection, setIsLoadingConnection] = useState(false);
 const exampleArtifactId = selectedArtifact?.id ?? "optional-stable-uuid";
 const exampleTitle = selectedArtifact?.title ?? "SC3 Mock Exam 04";
 const exampleType = selectedArtifact?.artifactType ?? "practice_page";
 const exampleTags = selectedArtifact?.tags.length ? selectedArtifact.tags : ["SC3", "mock"];
 const exampleHtml = selectedArtifact?.html
  ? selectedArtifact.html.slice(0, 96).trim()
  : '<!doctype html><html lang="vi"><head><meta charset="utf-8" /></head><body>...</body></html>';
 const buildFetchSnippet = (endpoint: string) =>
  `await fetch("${endpoint}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer <supabase-user-access-token-or-publish-token>"\n  },\n  body: JSON.stringify({\n    mode: "upsert",\n    artifactId: "${exampleArtifactId}",\n    title: ${JSON.stringify(exampleTitle)},\n    artifactType: "${exampleType}",\n    tags: ${JSON.stringify(exampleTags)},\n    folderId: null,\n    html: ${JSON.stringify(exampleHtml)}\n  })\n});`;
 const displayFetchSnippet = buildFetchSnippet(displayEndpoint);
 const getCurrentEndpoint = () =>
  typeof window === "undefined"
   ? displayEndpoint
   : new URL(endpointPath, window.location.origin).toString();
 const tokenPreview = sessionAccessToken ? maskToken(sessionAccessToken) : "Chưa có session token";
 const copyText = async (text: string, successMessage: string) => {
  try {
   await navigator.clipboard.writeText(text);
   toast.success(successMessage);
  } catch {
   toast.error("Không copy được. Chọn text rồi copy thủ công.");
  }
 };

 useEffect(() => {
  if (!isOpen) return;
  let ignore = false;
  const loadConnectionInfo = async () => {
   setIsLoadingConnection(true);
   try {
    const [statusResponse, sessionResult] = await Promise.all([
     fetch(endpointPath, { method: "GET", headers: { Accept: "application/json" } }),
     supabase.auth.getSession(),
    ]);
    const statusJson: JsonFieldValue = await statusResponse.json().catch(() => null);
    if (ignore) return;
    setConnectionInfo(parsePublishConnectionInfo(statusJson));
    setSessionAccessToken(sessionResult.data.session?.access_token ?? null);
   } catch {
    if (!ignore) {
     setConnectionInfo(null);
     setSessionAccessToken(null);
    }
   } finally {
    if (!ignore) setIsLoadingConnection(false);
   }
  };
  void loadConnectionInfo();
  return () => {
   ignore = true;
  };
 }, [isOpen, supabase]);

 return (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
   <DialogContent size="lg">
    <DialogHeader>
     <DialogTitle className="flex items-center gap-2">
      <PlugZap className="h-5 w-5 text-primary" />
      Kết nối publish HTML
     </DialogTitle>
     <DialogDescription>
      Dùng endpoint này để tool khác gửi HTML vào Tệp HTML mà không cần mở app rồi copy paste.
     </DialogDescription>
    </DialogHeader>
    <DialogBody>
     <div className="grid gap-4">
      <section className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
       <StudyInstructionText variant="overline" tone="muted" weight="black" transform="uppercase">
        Endpoint
       </StudyInstructionText>
       <StudyInstructionText variant="code" tone="default" weight="bold" wrapping="breakAll">
        {endpointPath}
       </StudyInstructionText>
       <Button
        type="button"
        variant="outline"
        size="toolbar"
        onClick={() => void copyText(getCurrentEndpoint(), "Đã copy endpoint")}
       >
        <Copy data-icon="inline-start" />
        Copy
       </Button>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
       <KeyValueRow label="Owner" value={connectionInfo?.sessionUserId ?? "Đang đọc..."} />
       <KeyValueRow label="Token" value={isLoadingConnection ? "Đang đọc..." : tokenPreview} />
      </div>
      <section className="grid gap-2">
       <StudyInstructionText variant="label" tone="default" weight="black">
        Ví dụ fetch
       </StudyInstructionText>
       <pre className="max-h-80 overflow-auto rounded-xl border border-border-default bg-bg-primary p-3 text-xs font-semibold text-text-primary scrollbar-soft">
        <code>{displayFetchSnippet}</code>
       </pre>
      </section>
     </div>
    </DialogBody>
    <DialogFooter>
     <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
      Đóng
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}

export function ConfirmDeleteDialog({
 deleteDialog,
 isDeleting,
 onCancel,
 onConfirm,
 onOpenChange,
}: {
 deleteDialog: Nullable<DeleteDialogState>;
 isDeleting: boolean;
 onCancel: () => void;
 onConfirm: () => void;
 onOpenChange: (open: boolean) => void;
}) {
 const isFolder = deleteDialog?.kind === "folder";
 const title = isFolder ? "Xóa thư mục?" : "Xóa tệp HTML?";
 const name = isFolder ? deleteDialog.folder.name : deleteDialog?.artifact.title;
 const description = isFolder
  ? `Tệp trong "${name}" sẽ được chuyển về Chưa phân loại.`
  : `"${name ?? "Tệp này"}" sẽ bị xóa khỏi database.`;

 return (
  <Dialog open={Boolean(deleteDialog)} onOpenChange={onOpenChange}>
   <DialogContent size="sm">
    <DialogHeader>
     <DialogTitle>{title}</DialogTitle>
     <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <DialogFooter>
     <Button type="button" variant="outline" disabled={isDeleting} onClick={onCancel}>
      Hủy
     </Button>
     <Button type="button" variant="destructive" disabled={isDeleting} onClick={onConfirm}>
      {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}Xóa
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}

export function CreateFolderDialog({
 folderDraft,
 folders,
 isOpen,
 isSaving,
 onFolderDraftChange,
 onOpenChange,
 onSubmit,
}: {
 folderDraft: { name: string; parentFolderId: Nullable<string>; color: HtmlArtifactFolderColor };
 folders: HtmlArtifactFolder[];
 isOpen: boolean;
 isSaving: boolean;
 onFolderDraftChange: (draft: {
  name: string;
  parentFolderId: Nullable<string>;
  color: HtmlArtifactFolderColor;
 }) => void;
 onOpenChange: (open: boolean) => void;
 onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
 const parentFolder = folderDraft.parentFolderId
  ? folders.find((folder) => folder.id === folderDraft.parentFolderId)
  : null;

 return (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
   <DialogContent size="sm">
    <form className="grid gap-4" onSubmit={onSubmit}>
     <DialogHeader>
      <DialogTitle>Thư mục mới</DialogTitle>
      <DialogDescription>
       {parentFolder
        ? `Tạo thư mục con trong "${parentFolder.name}".`
        : "Đặt tên và màu để gom tệp HTML theo nhóm."}
      </DialogDescription>
     </DialogHeader>
     <DialogBody>
      <Label variant="label" tone="default" weight="bold" className="grid gap-1.5">
       Tên thư mục
       <Input
        value={folderDraft.name}
        onChange={(event) => onFolderDraftChange({ ...folderDraft, name: event.target.value })}
        placeholder="SC3 mock exams"
        required
        autoFocus
       />
      </Label>
      <fieldset className="grid gap-2">
       <legend className="text-sm font-bold text-text-primary">Màu</legend>
       <div className="flex flex-wrap gap-2">
        {folderColorSequence.map((color) => (
         <Button
          key={color}
          type="button"
          variant="swatch"
          size="icon"
          aria-pressed={folderDraft.color === color}
          style={folderColorSwatchStyles[color]}
          onClick={() => onFolderDraftChange({ ...folderDraft, color })}
          aria-label={`Chọn màu ${color}`}
         />
        ))}
       </div>
      </fieldset>
     </DialogBody>
     <DialogFooter>
      <Button
       type="button"
       variant="outline"
       disabled={isSaving}
       onClick={() => onOpenChange(false)}
      >
       Hủy
      </Button>
      <Button type="submit" disabled={isSaving || !folderDraft.name.trim()}>
       {isSaving ? <Loader2 className="animate-spin" /> : <FolderPlus />}Tạo thư mục
      </Button>
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 );
}
