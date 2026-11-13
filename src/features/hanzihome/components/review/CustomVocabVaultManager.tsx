"use client";

import { useMemo, useState } from "react";
import {
 Check,
 ChevronDown,
 ChevronUp,
 ClipboardPaste,
 Pencil,
 Plus,
 Search,
 Trash2,
 Volume2,
 X,
} from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import { Input } from "@/components/ui/forms/input";
import { Textarea } from "@/components/ui/forms/textarea";
import { Card } from "@/components/ui/layout/card";
import {
 HanziText,
 PinyinText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useFastMandarinSpeech } from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import type { CustomVocabItem } from "@/features/hanzihome/types";
import { parseBulkCustomVocabInput } from "./vocab-hub-custom";

export type CustomVocabVaultManagerProps = {
 readonly items: readonly CustomVocabItem[];
 readonly onAddItems: (items: readonly Omit<CustomVocabItem, "id" | "createdAt">[]) => void;
 readonly onUpdateItem: (
  id: string,
  patch: Partial<Omit<CustomVocabItem, "id" | "createdAt">>,
 ) => void;
 readonly onRemoveItem: (id: string) => void;
};

export function CustomVocabVaultManager({
 items,
 onAddItems,
 onUpdateItem,
 onRemoveItem,
}: CustomVocabVaultManagerProps) {
 const [hanzi, setHanzi] = useState("");
 const [pinyin, setPinyin] = useState("");
 const [meaning, setMeaning] = useState("");
 const [isDrawerOpen, setIsDrawerOpen] = useState(false);
 const [isBulkOpen, setIsBulkOpen] = useState(false);
 const [bulkText, setBulkText] = useState("");
 const [searchQuery, setSearchQuery] = useState("");

 const [editingId, setEditingId] = useState<string | null>(null);
 const [editHanzi, setEditHanzi] = useState("");
 const [editPinyin, setEditPinyin] = useState("");
 const [editMeaning, setEditMeaning] = useState("");
 const [editExampleZh, setEditExampleZh] = useState("");

 const { speak } = useFastMandarinSpeech();

 const parsedBulkPreview = useMemo(() => parseBulkCustomVocabInput(bulkText), [bulkText]);

 const filteredItems = useMemo(() => {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
   (item) =>
    item.hanzi.toLowerCase().includes(q) ||
    item.pinyin.toLowerCase().includes(q) ||
    item.meaning.toLowerCase().includes(q) ||
    (item.exampleZh ?? "").toLowerCase().includes(q),
  );
 }, [items, searchQuery]);

 const handleQuickSubmit = (event: React.FormEvent) => {
  event.preventDefault();
  if (!hanzi.trim() || !meaning.trim()) return;
  onAddItems([
   {
    hanzi: hanzi.trim(),
    pinyin: pinyin.trim(),
    meaning: meaning.trim(),
   },
  ]);
  setHanzi("");
  setPinyin("");
  setMeaning("");
 };

 const handleBulkSubmit = () => {
  if (parsedBulkPreview.length === 0) return;
  onAddItems(parsedBulkPreview);
  setBulkText("");
  setIsBulkOpen(false);
 };

 const handleStartEdit = (item: CustomVocabItem) => {
  setEditingId(item.id);
  setEditHanzi(item.hanzi);
  setEditPinyin(item.pinyin);
  setEditMeaning(item.meaning);
  setEditExampleZh(item.exampleZh ?? "");
 };

 const handleSaveEdit = (id: string) => {
  if (!editHanzi.trim() || !editMeaning.trim()) return;
  onUpdateItem(id, {
   hanzi: editHanzi.trim(),
   pinyin: editPinyin.trim(),
   meaning: editMeaning.trim(),
   exampleZh: editExampleZh.trim(),
  });
  setEditingId(null);
 };

 return (
  <div className="grid min-w-0 gap-2.5">
   {/* Single-line Quick Add & Vault Toggle Bar */}
   <form onSubmit={handleQuickSubmit} className="flex flex-wrap items-center justify-between gap-2">
    <div className="grid min-w-0 flex-1 gap-1.5 sm:grid-cols-3">
     <Input
      density="compact"
      value={hanzi}
      onChange={(e) => setHanzi(e.target.value)}
      placeholder="Chữ Hán (VD: 排期) *"
      aria-label="Chữ Hán"
     />
     <Input
      density="compact"
      value={pinyin}
      onChange={(e) => setPinyin(e.target.value)}
      placeholder="Pinyin (tùy chọn)"
      aria-label="Pinyin"
     />
     <Input
      density="compact"
      value={meaning}
      onChange={(e) => setMeaning(e.target.value)}
      placeholder="Nghĩa tiếng Việt *"
      aria-label="Nghĩa tiếng Việt"
     />
    </div>

    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
     <Button type="submit" size="compact" disabled={!hanzi.trim() || !meaning.trim()}>
      <Plus className="size-3.5" />
      <span>Lưu vào kho</span>
     </Button>

     <Button
      type="button"
      size="compact"
      variant={isBulkOpen ? "active" : "outline"}
      onClick={() => setIsBulkOpen((prev) => !prev)}
     >
      <ClipboardPaste className="size-3.5" />
      <span>Dán hàng loạt</span>
     </Button>

     {items.length > 0 ? (
      <Button
       type="button"
       size="compact"
       variant={isDrawerOpen ? "active" : "ghost"}
       onClick={() => setIsDrawerOpen((prev) => !prev)}
      >
       <span>{`Danh sách (${items.length})`}</span>
       {isDrawerOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </Button>
     ) : null}
    </div>
   </form>

   {/* Optional Collapsible Bulk Import Box */}
   {isBulkOpen ? (
    <Card variant="subtle" padding="sm" className="grid min-w-0 gap-2">
     <Textarea
      density="compact"
      value={bulkText}
      onChange={(e) => setBulkText(e.target.value)}
      placeholder={
       "Dán nhiều dòng (hỗ trợ dấu '-', ':' hoặc bảng '|'):\n需求 - xūqiú - yêu cầu tính năng\n联调 - liántiáo - tích hợp FE và BE"
      }
      aria-label="Dán danh sách từ vựng hàng loạt"
     />
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography variant="caption" tone="muted">
       {parsedBulkPreview.length > 0
        ? `Phát hiện ${parsedBulkPreview.length} từ hợp lệ sẵn sàng lưu`
        : "Mỗi dòng 1 từ: Chữ Hán - Pinyin - Nghĩa (hoặc Chữ Hán - Nghĩa)"}
      </Typography>
      <Button
       type="button"
       size="compact"
       disabled={parsedBulkPreview.length === 0}
       onClick={handleBulkSubmit}
      >
       <ClipboardPaste className="size-3.5" />
       <span>{`Nhập ${parsedBulkPreview.length} từ vào kho`}</span>
      </Button>
     </div>
    </Card>
   ) : null}

   {/* Optional Collapsible Vault Item List */}
   {isDrawerOpen && items.length > 0 ? (
    <Card variant="subtle" padding="sm" className="grid min-w-0 gap-2">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
       <Typography variant="caption" tone="muted" weight="bold">
        Từ vựng trong kho riêng
       </Typography>
       <Badge variant="default" size="sm" casing="natural">
        {`${items.length} từ`}
       </Badge>
      </div>
      {items.length > 3 ? (
       <div className="relative min-w-[180px]">
        <Input
         type="search"
         density="compact"
         adornment="start"
         value={searchQuery}
         onChange={(e) => setSearchQuery(e.target.value)}
         placeholder="Tìm trong kho riêng..."
         aria-label="Tìm trong kho riêng"
        />
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
       </div>
      ) : null}
     </div>

     <div className="grid max-h-52 min-w-0 gap-1.5 overflow-y-auto pr-1">
      {filteredItems.map((item) => {
       const isEditing = editingId === item.id;
       if (isEditing) {
        return (
         <Card key={item.id} variant="default" padding="sm" className="grid gap-2">
          <div className="grid gap-1.5 sm:grid-cols-3">
           <Input
            density="compact"
            value={editHanzi}
            onChange={(e) => setEditHanzi(e.target.value)}
            placeholder="Chữ Hán"
           />
           <Input
            density="compact"
            value={editPinyin}
            onChange={(e) => setEditPinyin(e.target.value)}
            placeholder="Pinyin"
           />
           <Input
            density="compact"
            value={editMeaning}
            onChange={(e) => setEditMeaning(e.target.value)}
            placeholder="Nghĩa tiếng Việt"
           />
          </div>
          <div className="flex items-center gap-2">
           <div className="min-w-0 flex-1">
            <Input
             density="compact"
             value={editExampleZh}
             onChange={(e) => setEditExampleZh(e.target.value)}
             placeholder="Câu ví dụ tiếng Trung (tùy chọn)"
            />
           </div>
           <Button type="button" size="compact" onClick={() => handleSaveEdit(item.id)}>
            <Check className="size-3.5" />
            <span>Lưu</span>
           </Button>
           <Button type="button" variant="ghost" size="compact" onClick={() => setEditingId(null)}>
            <X className="size-3.5" />
           </Button>
          </div>
         </Card>
        );
       }

       return (
        <Card
         key={item.id}
         variant="default"
         padding="sm"
         className="flex min-w-0 items-center justify-between gap-2"
        >
         <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-2">
          <HanziText as="span" size="medium" weight="bold">
           {item.hanzi}
          </HanziText>
          {item.pinyin ? (
           <PinyinText as="span" variant="bodySmall" tone="secondary">
            {item.pinyin}
           </PinyinText>
          ) : null}
          <TranslationText as="span" variant="bodySmall" tone="default" weight="semibold">
           {item.meaning}
          </TranslationText>
         </div>

         <div className="flex shrink-0 items-center gap-1">
          <Button
           type="button"
           variant="ghost"
           size="toolbar"
           onClick={() => speak(item.hanzi, { lang: "zh-CN" })}
           aria-label={`Nghe phát âm ${item.hanzi}`}
          >
           <Volume2 className="size-3.5" />
          </Button>
          <Button
           type="button"
           variant="ghost"
           size="toolbar"
           onClick={() => handleStartEdit(item)}
           aria-label={`Sửa từ ${item.hanzi}`}
          >
           <Pencil className="size-3.5" />
          </Button>
          <Button
           type="button"
           variant="ghost"
           size="toolbar"
           onClick={() => onRemoveItem(item.id)}
           aria-label={`Xóa từ ${item.hanzi}`}
          >
           <Trash2 className="size-3.5" />
          </Button>
         </div>
        </Card>
       );
      })}
     </div>
    </Card>
   ) : null}
  </div>
 );
}
