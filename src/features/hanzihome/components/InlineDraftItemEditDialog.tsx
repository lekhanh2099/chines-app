"use client";

import { useMemo, useState } from "react";
import { Pencil, Save, Trash2 } from "lucide-react";
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
import { GrammarDraftManualEditor } from "@/features/hanzihome/lesson-drafts/components/GrammarDraftManualEditor";
import { VocabDraftManualEditor } from "@/features/hanzihome/lesson-drafts/components/VocabDraftManualEditor";
import {
 useLessonDraftQuery,
 useUpdateLessonDraftMutation,
} from "@/features/hanzihome/lesson-drafts/use-lesson-drafts";
import {
 grammarDraftItemSchema,
 type GrammarDraftItem,
} from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import {
 vocabDraftItemSchema,
 type VocabDraftItem,
} from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";

type InlineDraftItemEditDialogProps = {
 kind: "vocab" | "grammar";
 draftId?: string;
 itemId?: string;
};

function isVocabDraftItem(value: unknown): value is VocabDraftItem {
 return vocabDraftItemSchema.safeParse(value).success;
}

function isGrammarDraftItem(value: unknown): value is GrammarDraftItem {
 return grammarDraftItemSchema.safeParse(value).success;
}

export function InlineDraftItemEditDialog({
 kind,
 draftId,
 itemId,
}: InlineDraftItemEditDialogProps) {
 const [open, setOpen] = useState(false);
 const [confirmDelete, setConfirmDelete] = useState(false);

 const draftQuery = useLessonDraftQuery(open ? (draftId ?? null) : null);
 const updateMutation = useUpdateLessonDraftMutation();
 const draft = draftQuery.data;

 const sourceVocabItem = useMemo(() => {
  if (!draft || kind !== "vocab" || !itemId) return null;

  return (
   draft.content.vocab.find(
    (item) => isVocabDraftItem(item) && item.id === itemId,
   ) ?? null
  );
 }, [draft, itemId, kind]);

 const sourceGrammarItem = useMemo(() => {
  if (!draft || kind !== "grammar" || !itemId) return null;

  return (
   draft.content.grammarPoints.find(
    (item) => isGrammarDraftItem(item) && item.id === itemId,
   ) ?? null
  );
 }, [draft, itemId, kind]);

 const [vocabItem, setVocabItem] = useState<VocabDraftItem | null>(null);
 const [grammarItem, setGrammarItem] = useState<GrammarDraftItem | null>(null);

 const activeVocabItem =
  vocabItem ??
  (sourceVocabItem && isVocabDraftItem(sourceVocabItem)
   ? sourceVocabItem
   : null);

 const activeGrammarItem =
  grammarItem ??
  (sourceGrammarItem && isGrammarDraftItem(sourceGrammarItem)
   ? sourceGrammarItem
   : null);

 const handleOpenChange = (nextOpen: boolean) => {
  setOpen(nextOpen);

  if (!nextOpen) {
   setConfirmDelete(false);
   setVocabItem(null);
   setGrammarItem(null);
  }
 };

 const handleSave = async () => {
  if (!draft) return;

  if (kind === "vocab") {
   if (!activeVocabItem) {
    toast.error("Không tìm thấy từ vựng để sửa.");
    return;
   }

   const parsedItem = vocabDraftItemSchema.parse(activeVocabItem);
   const nextVocab = draft.content.vocab.map((item) =>
    isVocabDraftItem(item) && item.id === parsedItem.id ? parsedItem : item,
   );

   const vocabIds = nextVocab.filter(isVocabDraftItem).map((item) => item.id);

   await updateMutation.mutateAsync({
    draftId: draft.id,
    input: {
     content: {
      ...draft.content,
      lesson: {
       ...draft.content.lesson,
       vocabIds,
      },
      vocab: nextVocab,
     },
    },
   });

   toast.success("Đã lưu từ vựng");
   setOpen(false);
   return;
  }

  if (!activeGrammarItem) {
   toast.error("Không tìm thấy điểm ngữ pháp để sửa.");
   return;
  }

  const parsedItem = grammarDraftItemSchema.parse(activeGrammarItem);
  const nextGrammarPoints = draft.content.grammarPoints.map((item) =>
   isGrammarDraftItem(item) && item.id === parsedItem.id ? parsedItem : item,
  );

  const grammarPointIds = nextGrammarPoints
   .filter(isGrammarDraftItem)
   .map((item) => item.id);

  await updateMutation.mutateAsync({
   draftId: draft.id,
   input: {
    content: {
     ...draft.content,
     lesson: {
      ...draft.content.lesson,
      grammarPointIds,
     },
     grammarPoints: nextGrammarPoints,
    },
   },
  });

  toast.success("Đã lưu điểm ngữ pháp");
  setOpen(false);
 };

 const handleDelete = async () => {
  if (!draft || !itemId) return;

  if (!confirmDelete) {
   setConfirmDelete(true);
   return;
  }

  if (kind === "vocab") {
   const nextVocab = draft.content.vocab.filter(
    (item) => !(isVocabDraftItem(item) && item.id === itemId),
   );

   const vocabIds = nextVocab.filter(isVocabDraftItem).map((item) => item.id);

   await updateMutation.mutateAsync({
    draftId: draft.id,
    input: {
     content: {
      ...draft.content,
      lesson: {
       ...draft.content.lesson,
       vocabIds,
      },
      vocab: nextVocab,
     },
    },
   });

   toast.success("Đã xoá từ vựng");
   setOpen(false);
   return;
  }

  const nextGrammarPoints = draft.content.grammarPoints.filter(
   (item) => !(isGrammarDraftItem(item) && item.id === itemId),
  );

  const grammarPointIds = nextGrammarPoints
   .filter(isGrammarDraftItem)
   .map((item) => item.id);

  await updateMutation.mutateAsync({
   draftId: draft.id,
   input: {
    content: {
     ...draft.content,
     lesson: {
      ...draft.content.lesson,
      grammarPointIds,
     },
     grammarPoints: nextGrammarPoints,
    },
   },
  });

  toast.success("Đã xoá điểm ngữ pháp");
  setOpen(false);
 };

 const canOpen = Boolean(draftId && itemId);
 const hasEditableItem =
  (kind === "vocab" && Boolean(activeVocabItem)) ||
  (kind === "grammar" && Boolean(activeGrammarItem));

 return (
  <Dialog open={open} onOpenChange={handleOpenChange}>
   <Button
    type="button"
    variant="outline"
    disabled={!canOpen}
    onClick={() => setOpen(true)}
   >
    <Pencil className="h-4 w-4" />
    Sửa
   </Button>

   <DialogContent className="flex h-[92vh] max-w-6xl grid-rows-none flex-col gap-0 overflow-hidden p-0">
    <DialogHeader className="shrink-0 border-b border-border-default px-6 py-5">
     <DialogTitle>
      {kind === "vocab" ? "Sửa từ vựng" : "Sửa điểm ngữ pháp"}
     </DialogTitle>
     <DialogDescription>
      Sửa hoặc xoá trực tiếp item trong draft Supabase.
     </DialogDescription>
    </DialogHeader>

    <DialogBody className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
     {draftQuery.isLoading && (
      <p className="text-sm font-semibold text-text-muted">
       Đang tải dữ liệu draft...
      </p>
     )}

     {!draftQuery.isLoading && kind === "vocab" && activeVocabItem && (
      <VocabDraftManualEditor item={activeVocabItem} onChange={setVocabItem} />
     )}

     {!draftQuery.isLoading && kind === "grammar" && activeGrammarItem && (
      <GrammarDraftManualEditor
       item={activeGrammarItem}
       onChange={setGrammarItem}
      />
     )}

     {!draftQuery.isLoading && !hasEditableItem && (
      <div className="rounded-2xl border border-border-default bg-bg-subtle p-4 text-sm font-semibold text-text-muted">
       Không tìm thấy item trong draft. Có thể bài đã bị sửa ở nơi khác.
      </div>
     )}
    </DialogBody>

    <DialogFooter className="shrink-0 border-t border-border-default bg-bg-card px-6 py-4 sm:justify-between">
     <Button
      type="button"
      variant="destructive"
      disabled={
       updateMutation.isPending || draftQuery.isLoading || !hasEditableItem
      }
      onClick={() => void handleDelete()}
     >
      <Trash2 className="h-4 w-4" />
      {confirmDelete ? "Bấm lần nữa để xoá" : "Xoá mục này"}
     </Button>

     <Button
      type="button"
      disabled={
       updateMutation.isPending || draftQuery.isLoading || !hasEditableItem
      }
      onClick={() => void handleSave()}
     >
      <Save className="h-4 w-4" />
      Lưu thay đổi
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
