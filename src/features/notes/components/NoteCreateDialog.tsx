"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import { BookOpenText, ChevronDown, FilePlus2, NotebookPen } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";
import { useRouter } from "@/i18n/navigation";
import { EMPTY_LEXICAL_DOCUMENT } from "@/lib/editor-document";
import { cn } from "@/lib/utils";
import type { NoteFolder } from "@/services/notes.service";
import { focusModeStore } from "@/stores/focus-mode-store";
import { NoteCategorySchema, ReadingStatusSchema } from "@/types/database";
import type { NoteCategory, ReadingStatus } from "@/types/database";

type CreateMode = "note" | "reading";

const DEFAULT_NOTE_CATEGORY: NoteCategory = "general";
const DEFAULT_READING_STATUS: ReadingStatus = "reading";
const noteCategoryValues: NoteCategory[] = ["general", "grammar", "vocabulary", "culture"];

function parseTags(value: string): string[] {
 return value
  .split(",")
  .map((tag) => tag.trim())
  .filter(Boolean);
}

export function NoteCreateDialog({
 folders = [],
 triggerClassName,
 compactOnTablet = false,
}: {
 folders?: NoteFolder[];
 triggerClassName?: string;
 compactOnTablet?: boolean;
}) {
 const t = useTranslations("Notes");
 const common = useTranslations("Common");
 const [mode, setMode] = useState<CreateMode | null>(null);
 const router = useRouter();
 const createNoteMutation = useCreateNote();
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);

 const form = useForm({
  defaultValues: {
   title: "",
   tags: "",
   category: DEFAULT_NOTE_CATEGORY,
   folderId: "unfiled",
   readingStatus: DEFAULT_READING_STATUS,
  },
  onSubmit: async ({ value }) => {
   if (!mode) return;
   if (focusModeEnabled) {
    toast.warning(t("create.focusBlocked"));
    return;
   }

   try {
    const emptyDocument = EMPTY_LEXICAL_DOCUMENT;
    const note = await createNoteMutation.mutateAsync({
     title: value.title.trim(),
     tags: parseTags(value.tags),
     category: value.category,
     content: emptyDocument,
     readingContent: mode === "reading" ? emptyDocument : undefined,
     splitViewEnabled: mode === "reading",
     folderId: value.folderId === "unfiled" ? null : value.folderId,
     readingStatus: mode === "reading" ? value.readingStatus : null,
     source: null,
    });

    setMode(null);
    form.reset();
    router.push(`/notes/${note.id}`);
   } catch {
    toast.error(t("create.error"));
   }
  },
 });

 const openMode = (nextMode: CreateMode) => {
  if (focusModeEnabled) return;
  form.reset();
  setMode(nextMode);
 };

 return (
  <>
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      size={compactOnTablet ? "toolbar" : "lg"}
      disabled={focusModeEnabled}
      aria-label={t("create.triggerAria")}
      title={t("create.trigger")}
      className={triggerClassName}
     >
      <FilePlus2 data-icon="inline-start" />
      <span className={cn(compactOnTablet && "hidden 2xl:inline")}>{t("create.trigger")}</span>
      <ChevronDown data-icon="inline-end" className={cn(compactOnTablet && "hidden 2xl:block")} />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" width="md">
     <DropdownMenuItem onSelect={() => openMode("note")}>
      <NotebookPen />
      <span>
       <strong className="block">{t("create.note")}</strong>
       <Typography variant="caption" tone="muted" weight="medium">
        {t("create.noteDescription")}
       </Typography>
      </span>
     </DropdownMenuItem>
     <DropdownMenuItem onSelect={() => openMode("reading")}>
      <BookOpenText />
      <span>
       <strong className="block">{t("create.reading")}</strong>
       <Typography variant="caption" tone="muted" weight="medium">
        {t("create.readingDescription")}
       </Typography>
      </span>
     </DropdownMenuItem>
    </DropdownMenuContent>
   </DropdownMenu>

   <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
    <DialogContent size="md">
     <DialogHeader>
      <DialogTitle icon={mode === "reading" ? <BookOpenText /> : <NotebookPen />}>
       {mode === "reading" ? t("create.readingTitle") : t("create.noteTitle")}
      </DialogTitle>
      <DialogDescription>
       {mode === "reading"
        ? t("create.readingDialogDescription")
        : t("create.noteDialogDescription")}
      </DialogDescription>
     </DialogHeader>

     <form
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      onSubmit={(event) => {
       event.preventDefault();
       event.stopPropagation();
       form.handleSubmit();
      }}
     >
      <DialogBody>
       <FieldGroup>
        <form.Field
         name="title"
         validators={{
          onChange: ({ value }) => (!value.trim() ? t("create.titleRequired") : undefined),
         }}
        >
         {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
           <FieldLabel htmlFor={field.name}>{t("create.title")}</FieldLabel>
           <Input
            id={field.name}
            required
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            placeholder={
             mode === "reading"
              ? t("create.readingTitlePlaceholder")
              : t("create.noteTitlePlaceholder")
            }
            aria-invalid={field.state.meta.errors.length > 0}
           />
           {field.state.meta.errors.length > 0 ? (
            <FieldDescription className="text-danger">
             {field.state.meta.errors.join(", ")}
            </FieldDescription>
           ) : null}
          </Field>
         )}
        </form.Field>

        <div className="grid gap-4 sm:grid-cols-2">
         <form.Field name="folderId">
          {(field) => (
           <Field>
            <FieldLabel>{t("create.folder")}</FieldLabel>
            <Select value={field.state.value} onValueChange={field.handleChange}>
             <SelectTrigger width="full">
              <SelectValue />
             </SelectTrigger>
             <SelectContent>
              <SelectGroup>
               <SelectItem value="unfiled">{t("views.unfiled")}</SelectItem>
               {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                 {folder.parentId ? `↳ ${folder.name}` : folder.name}
                </SelectItem>
               ))}
              </SelectGroup>
             </SelectContent>
            </Select>
           </Field>
          )}
         </form.Field>

         {mode === "reading" ? (
          <form.Field name="readingStatus">
           {(field) => (
            <Field>
             <FieldLabel>{t("create.status")}</FieldLabel>
             <Select
              value={field.state.value}
              onValueChange={(value) => {
               const parsedStatus = ReadingStatusSchema.safeParse(value);
               if (parsedStatus.success) field.handleChange(parsedStatus.data);
              }}
             >
              <SelectTrigger width="full">
               <SelectValue />
              </SelectTrigger>
              <SelectContent>
               <SelectItem value="inbox">{t("readingStatus.inbox")}</SelectItem>
               <SelectItem value="reading">{t("readingStatus.reading")}</SelectItem>
               <SelectItem value="completed">{t("readingStatus.completed")}</SelectItem>
              </SelectContent>
             </Select>
            </Field>
           )}
          </form.Field>
         ) : (
          <form.Field name="category">
           {(field) => (
            <Field>
             <FieldLabel>{t("create.category")}</FieldLabel>
             <Select
              value={field.state.value}
              onValueChange={(value) => {
               const parsedCategory = NoteCategorySchema.safeParse(value);
               if (parsedCategory.success) field.handleChange(parsedCategory.data);
              }}
             >
              <SelectTrigger width="full">
               <SelectValue />
              </SelectTrigger>
              <SelectContent>
               {noteCategoryValues.map((value) => (
                <SelectItem key={value} value={value}>
                 {t(`filters.categories.${value}`)}
                </SelectItem>
               ))}
              </SelectContent>
             </Select>
            </Field>
           )}
          </form.Field>
         )}
        </div>

        {mode !== "reading" ? (
         <form.Field name="tags">
          {(field) => (
           <Field>
            <FieldLabel htmlFor={field.name}>{t("create.tags")}</FieldLabel>
            <Input
             id={field.name}
             value={field.state.value}
             onChange={(event) => field.handleChange(event.target.value)}
             placeholder={t("create.tagsPlaceholder")}
            />
           </Field>
          )}
         </form.Field>
        ) : null}
       </FieldGroup>
      </DialogBody>

      <DialogFooter>
       <Button type="button" variant="outline" onClick={() => setMode(null)}>
        {common("actions.cancel")}
       </Button>
       <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
         <Button type="submit" disabled={!canSubmit || createNoteMutation.isPending}>
          {isSubmitting || createNoteMutation.isPending ? (
           <Spinner data-icon="inline-start" />
          ) : null}
          {mode === "reading" ? t("create.createOpen") : t("create.trigger")}
         </Button>
        )}
       </form.Subscribe>
      </DialogFooter>
     </form>
    </DialogContent>
   </Dialog>
  </>
 );
}
