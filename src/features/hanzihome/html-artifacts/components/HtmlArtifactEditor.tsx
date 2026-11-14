"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { Code2, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/actions/button";
import { focusWithinRingClassName } from "@/components/ui/focus-ring";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { Typography } from "@/components/ui/display/typography";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { cn } from "@/lib/utils";
import { formatHtmlSource } from "../html-artifact-display-utils";
import {
 getArtifactFormSaveKey,
 getDraftSaveLabel,
 toArtifactFormState,
 type ArtifactFormState,
 type DraftSaveStatus,
} from "../html-artifact-page-utils";
import type { HtmlArtifact, HtmlArtifactFolder, HtmlArtifactType } from "../html-artifact.schema";
import { htmlArtifactTypeSchema } from "../html-artifact.schema";

export type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

export type ArtifactSaveOptions = {
 silent?: boolean;
};

export type ArtifactSubmitHandler = (
 formState: ArtifactFormState,
 options?: ArtifactSaveOptions,
) => Promise<void>;

export const artifactTypeLabels: Record<HtmlArtifactType, string> = {
 practice_page: "Trang luyện tập",
 mock_exam: "Đề thử",
 grammar_drill: "Luyện ngữ pháp",
 reference: "Tài liệu tham khảo",
 other: "Khác",
};

export const artifactTypes = htmlArtifactTypeSchema.options;
export const noFolderValue = "__none__";
const htmlEditorExtensions = [html({ autoCloseTags: true, matchClosingTags: true })];

export function EditorPane(props: {
 artifact: Nullable<HtmlArtifact>;
 defaultFolderId: Nullable<string>;
 embedded?: boolean;
 folders: HtmlArtifactFolder[];
 htmlOnly?: boolean;
 isSaving: boolean;
 isDeleting: boolean;
 onDraftChange: (formState: ArtifactFormState) => void;
 onSubmit: ArtifactSubmitHandler;
 onDelete: () => void;
}) {
 const { embedded = false, ...formProps } = props;
 return (
  <aside
   className={cn(
    "h-full min-h-0 bg-bg-subtle p-4",
    props.htmlOnly ? "overflow-hidden" : "overflow-y-auto scrollbar-soft",
    !embedded && "border-l border-border-default",
   )}
  >
   <ArtifactForm {...formProps} />
  </aside>
 );
}

export function ArtifactForm({
 artifact,
 defaultFolderId,
 folders,
 isSaving,
 isDeleting,
 onDraftChange,
 onSubmit,
 onDelete,
 htmlOnly = false,
}: {
 artifact: Nullable<HtmlArtifact>;
 defaultFolderId: Nullable<string>;
 folders: HtmlArtifactFolder[];
 isSaving: boolean;
 isDeleting: boolean;
 onDraftChange: (formState: ArtifactFormState) => void;
 onSubmit: ArtifactSubmitHandler;
 onDelete: () => void;
 htmlOnly?: boolean;
}) {
 const [form, setForm] = useState<ArtifactFormState>(() =>
  toArtifactFormState(artifact, defaultFolderId),
 );
 const [isFormattingHtml, setIsFormattingHtml] = useState(false);
 const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>("idle");
 const latestFormRef = useRef(form);
 const updateForm = (updater: (current: ArtifactFormState) => ArtifactFormState) => {
  const next = updater(latestFormRef.current);
  setSaveStatus(
   getArtifactFormSaveKey(next) ===
    getArtifactFormSaveKey(toArtifactFormState(artifact, defaultFolderId))
    ? "idle"
    : "dirty",
  );
  latestFormRef.current = next;
  setForm(next);
  onDraftChange(next);
 };
 useEffect(() => {
  latestFormRef.current = form;
 }, [form]);
 const submitForm = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (!form.html.trim()) {
   toast.error("Paste HTML trước khi lưu.");
   return;
  }
  void Promise.resolve(onSubmit(form))
   .then(() => setSaveStatus("saved"))
   .catch(() => setSaveStatus("error"));
 };
 const formatHtml = async () => {
  if (!form.html.trim()) {
   toast.error("Paste HTML trước khi format.");
   return;
  }
  setIsFormattingHtml(true);
  try {
   const formattedHtml = await formatHtmlSource(form.html);
   updateForm((current) => ({ ...current, html: formattedHtml }));
   toast.success("Đã format HTML");
  } catch {
   toast.error("Không format được HTML. Kiểm tra lại cú pháp file.");
  } finally {
   setIsFormattingHtml(false);
  }
 };
 return (
  <form
   className={cn(
    "flex min-h-full flex-col rounded-xl border border-border-default bg-bg-card",
    htmlOnly ? "h-full gap-3 overflow-hidden p-3" : "gap-4 p-4",
   )}
   onSubmit={submitForm}
  >
   <div className="flex items-center justify-between gap-2">
    <div className="min-w-0 flex-1">
     {htmlOnly ? (
      <Input
       value={form.title}
       onChange={(event) => updateForm((current) => ({ ...current, title: event.target.value }))}
       aria-label="Tiêu đề tệp HTML"
       placeholder="Tên tệp HTML"
       required
      />
     ) : (
      <Typography as="h2" variant="sectionTitle" tone="default" weight="black" clamp="one">
       {artifact ? "Sửa tệp" : "Tạo tệp"}
      </Typography>
     )}
     {htmlOnly ? (
      <StudyInstructionText
       variant="caption"
       tone={saveStatus === "error" ? "dangerStrong" : "muted"}
       weight="bold"
      >
       {getDraftSaveLabel(saveStatus, Boolean(artifact))}
      </StudyInstructionText>
     ) : null}
    </div>
    <div className="flex gap-2">
     {artifact && !htmlOnly ? (
      <Button
       type="button"
       variant="destructive"
       size="toolbar"
       disabled={isDeleting || isSaving}
       onClick={onDelete}
      >
       <Trash2 />
       Xóa
      </Button>
     ) : null}
     {htmlOnly ? (
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       disabled={isSaving || isDeleting || isFormattingHtml || !form.html.trim()}
       onClick={formatHtml}
      >
       {isFormattingHtml ? <Loader2 className="animate-spin" /> : <Code2 />}Định dạng
      </Button>
     ) : null}
     <Button type="submit" size="toolbar" disabled={isSaving || isDeleting}>
      {isSaving ? <Loader2 className="animate-spin" /> : <Save />}Lưu DB
     </Button>
    </div>
   </div>
   {!htmlOnly ? (
    <>
     <Label variant="label" tone="default" weight="bold" className="grid gap-1.5">
      Tiêu đề
      <Input
       value={form.title}
       onChange={(event) => updateForm((current) => ({ ...current, title: event.target.value }))}
       aria-label="Tiêu đề tệp HTML"
       placeholder="SC3 Mock Exam 03"
       required
      />
     </Label>
     <div className="grid gap-1.5">
      <Typography as="span" variant="label" weight="bold">
       Thư mục
      </Typography>
      <Select
       value={form.folderId ?? noFolderValue}
       onValueChange={(value) =>
        updateForm((current) => ({ ...current, folderId: value === noFolderValue ? null : value }))
       }
      >
       <SelectTrigger width="full" aria-label="Chọn thư mục cho tệp HTML">
        <SelectValue placeholder="Chọn thư mục" />
       </SelectTrigger>
       <SelectContent align="start">
        <SelectGroup>
         <SelectItem value={noFolderValue}>Chưa phân loại</SelectItem>
         {folders.map((folder) => (
          <SelectItem key={folder.id} value={folder.id}>
           {folder.name}
          </SelectItem>
         ))}
        </SelectGroup>
       </SelectContent>
      </Select>
     </div>
     <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[150px_minmax(0,1fr)]">
      <div className="grid gap-1.5">
       <Typography as="span" variant="label" weight="bold">
        Loại tệp
       </Typography>
       <Select
        value={form.artifactType}
        onValueChange={(value) => {
         const parsedArtifactType = htmlArtifactTypeSchema.safeParse(value);
         if (!parsedArtifactType.success) return;
         updateForm((current) => ({ ...current, artifactType: parsedArtifactType.data }));
        }}
       >
        <SelectTrigger width="full" aria-label="Chọn loại tệp HTML">
         <SelectValue placeholder="Chọn loại" />
        </SelectTrigger>
        <SelectContent align="start">
         <SelectGroup>
          {artifactTypes.map((type) => (
           <SelectItem key={type} value={type}>
            {artifactTypeLabels[type]}
           </SelectItem>
          ))}
         </SelectGroup>
        </SelectContent>
       </Select>
      </div>
      <Label variant="label" tone="default" weight="bold" className="grid gap-1.5">
       Tag
       <Input
        value={form.tagsInput}
        onChange={(event) =>
         updateForm((current) => ({ ...current, tagsInput: event.target.value }))
        }
        aria-label="Tag của tệp HTML"
        placeholder="SC3, mock, bổ ngữ"
       />
      </Label>
     </div>
    </>
   ) : null}
   <div className="flex min-h-0 flex-1 flex-col gap-1.5">
    {!htmlOnly ? (
     <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
       <StudyInstructionText id="html-source-label" variant="label" tone="default" weight="bold">
        HTML
       </StudyInstructionText>
       <StudyInstructionText
        variant="caption"
        tone={saveStatus === "error" ? "dangerStrong" : "muted"}
        weight="bold"
       >
        {getDraftSaveLabel(saveStatus, Boolean(artifact))}
       </StudyInstructionText>
      </div>
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       disabled={isSaving || isDeleting || isFormattingHtml || !form.html.trim()}
       onClick={formatHtml}
      >
       {isFormattingHtml ? <Loader2 className="animate-spin" /> : <Code2 />}Định dạng
      </Button>
     </div>
    ) : (
     <span id="html-source-label" className="sr-only">
      HTML
     </span>
    )}
    <HtmlSourceEditor
     ariaLabelledBy="html-source-label"
     fullHeight={htmlOnly}
     value={form.html}
     onChange={(htmlValue) => updateForm((current) => ({ ...current, html: htmlValue }))}
    />
   </div>
  </form>
 );
}

export function HtmlSourceEditor({
 ariaLabelledBy,
 fullHeight = false,
 value,
 onChange,
}: {
 ariaLabelledBy: string;
 fullHeight?: boolean;
 value: string;
 onChange: (value: string) => void;
}) {
 return (
  <div
   className={cn(
    "html-source-editor overflow-hidden rounded-xl border border-border-default bg-bg-primary shadow-inner [&_.cm-activeLine]:bg-primary/5 [&_.cm-activeLineGutter]:bg-primary/10 [&_.cm-content]:min-h-full [&_.cm-content]:py-3 [&_.cm-editor]:h-full [&_.cm-editor]:bg-bg-primary [&_.cm-focused]:outline-none [&_.cm-gutters]:border-border-default [&_.cm-gutters]:bg-bg-elevated/70 [&_.cm-line]:px-3 [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-xs [&_.cm-theme-light]:h-full",
    focusWithinRingClassName,
    fullHeight ? "min-h-0 flex-1" : "h-[clamp(18rem,48dvh,34rem)]",
   )}
  >
   <CodeMirror
    aria-labelledby={ariaLabelledBy}
    value={value}
    height="100%"
    basicSetup={{
     autocompletion: true,
     bracketMatching: true,
     closeBrackets: true,
     foldGutter: true,
     highlightActiveLine: true,
     highlightActiveLineGutter: true,
     lineNumbers: true,
    }}
    extensions={htmlEditorExtensions}
    placeholder="Paste nguyên file HTML vào đây..."
    theme="light"
    onChange={onChange}
   />
  </div>
 );
}
