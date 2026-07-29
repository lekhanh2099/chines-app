"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "@tanstack/react-store";
import { BookmarkPlus, Check, Loader2, Save, Volume2, VolumeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Badge } from "@/components/ui/badge";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { getHanziFontFamily } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { HanziReaderFont } from "@/features/hanzihome/components/lesson-overview/types";
import { useSmartSelectionInsights } from "@/hooks/useSmartSelectionInsights";
import { useTTS } from "@/hooks/useTTS";
import { extractChinese } from "@/lib/chinese-utils";
import {
 getNormalizedAntonyms,
 getNormalizedDefinitions,
 getNormalizedRelatedCompounds,
 getNormalizedRadicals,
 getNormalizedSynonyms,
} from "@/services/vocab.service";
import { vocabDetailDrawerStore } from "@/stores/vocab-detail-drawer-store";
import type { SmartSelectionMode } from "@/types/database";

const HANZI_CHAR_REGEX = /[\u4e00-\u9fff]/;
const drawerFontOptions: Array<{ value: HanziReaderFont; label: string }> = [
 { value: "system", label: "Hệ thống" },
 { value: "songti", label: "Songti" },
 { value: "pinyin", label: "Kai" },
];

type HanziWriterModule = (typeof import("hanzi-writer"))["default"];
type HanziWriterInstance = ReturnType<HanziWriterModule["create"]>;

function getThemeColor(name: string) {
 return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getDisplayMeaning(
 mode: SmartSelectionMode,
 data: ReturnType<typeof useSmartSelectionInsights>["data"],
) {
 if (!data) return "";
 if (mode === "sentence") {
  return data.translation || data.entry.meaning || "";
 }

 return (
  data.meaning_summary ||
  data.definitions[0]?.meaning ||
  data.definitions[0]?.text ||
  data.entry.meaning ||
  ""
 );
}

function getUniqueCharacters(text: string) {
 return Array.from(
  new Set(Array.from(extractChinese(text)).filter((char) => HANZI_CHAR_REGEX.test(char))),
 );
}

export function VocabDetailDrawer() {
 const isOpen = useSelector(vocabDetailDrawerStore, (state) => state.isOpen);
 const text = useSelector(vocabDetailDrawerStore, (state) => state.text);
 const contextSentence = useSelector(vocabDetailDrawerStore, (state) => state.contextSentence);
 const mode = useSelector(vocabDetailDrawerStore, (state) => state.mode);
 const { closeDetailDrawer, openDetailDrawer } = vocabDetailDrawerStore.actions;
 const detailQuery = useSmartSelectionInsights(text, contextSentence, {
  enabled: isOpen && !!text,
  mode,
 });
 const smartData = detailQuery.data;
 const displayMeaning = getDisplayMeaning(mode, smartData);
 const { speak, stop, isSpeaking, isLoading: isTTSLoading } = useTTS();
 const [hanziFont, setHanziFont] = useState<HanziReaderFont>("system");

 const handleSpeak = () => {
  const speechText = mode === "sentence" ? text : smartData?.entry.hanzi || text;
  if (!speechText) return;
  if (isSpeaking) {
   stop();
   return;
  }
  void speak(speechText);
 };

 const handleSave = async (noteDraft: string) => {
  if (!smartData) return;

  try {
   await detailQuery.saveSelection({
    personalNote: noteDraft,
    personalNoteMode: "important",
   });
   toast.success(
    mode === "sentence"
     ? "Đã lưu câu mẫu vào kho ôn tập"
     : `Đã lưu \"${smartData.entry.hanzi}\" vào kho ôn tập`,
   );
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể lưu từ vựng");
  }
 };

 if (!isOpen) {
  return null;
 }

 return (
  <Sheet
   open={isOpen}
   onOpenChange={(open) => {
    if (!open) closeDetailDrawer();
   }}
   side="right"
   className="sm:max-w-[44rem]"
  >
   <SheetHeader
    title={mode === "sentence" ? "Chi tiết câu" : "Chi tiết từ vựng"}
    onClose={closeDetailDrawer}
   />
   <div className="grid gap-3 border-b border-border-default px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
    <div className="min-w-0">
     <div className="flex items-center gap-2">
      <Typography
       as="p"
       variant="display"
       tone="default"
       weight="black"
       clamp="one"
       leading="tight"
       lang="zh-CN"
       style={{ fontFamily: getHanziFontFamily(hanziFont) }}
      >
       {smartData?.entry.hanzi || text}
      </Typography>
      <Button
       type="button"
       variant="ghost"
       size="icon-toolbar"
       onClick={handleSpeak}
       disabled={isTTSLoading}
       aria-label={isSpeaking ? "Dừng phát âm" : "Nghe phát âm"}
      >
       {isTTSLoading ? (
        <Loader2 className="animate-spin" />
       ) : isSpeaking ? (
        <VolumeOff />
       ) : (
        <Volume2 />
       )}
      </Button>
     </div>
     {smartData?.entry.pinyin && (
      <Typography as="p" tone="accent" weight="semibold" className="mt-1">
       {smartData.entry.pinyin}
      </Typography>
     )}
    </div>
    <Label variant="label" className="grid gap-1">
     <Typography variant="caption" tone="muted" weight="bold">
      Kiểu chữ Hán
     </Typography>
     <Select
      value={hanziFont}
      onValueChange={(value) => {
       if (value === "system" || value === "songti" || value === "pinyin") {
        setHanziFont(value);
       }
      }}
     >
      <SelectTrigger size="sm" aria-label="Chọn kiểu chữ Hán">
       <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
       {drawerFontOptions.map((option) => (
        <SelectItem key={option.value} value={option.value}>
         <Typography
          as="span"
          lang="zh-CN"
          variant="sectionTitle"
          style={{ fontFamily: getHanziFontFamily(option.value) }}
         >
          文
         </Typography>
         {option.label}
        </SelectItem>
       ))}
      </SelectContent>
     </Select>
    </Label>
   </div>

   <SheetBody>
    {detailQuery.isLoading ? (
     <div className="flex h-40 items-center justify-center gap-2 text-text-muted">
      <Loader2 className="h-4 w-4 animate-spin " />
      Đang tải chi tiết từ vựng...
     </div>
    ) : detailQuery.isError ? (
     <div className="rounded-2xl border border-danger/30 bg-danger-subtle px-4 py-3 text-danger-text">
      {detailQuery.error instanceof Error
       ? detailQuery.error.message
       : "Không thể tải dữ liệu chi tiết"}
     </div>
    ) : !smartData ? (
     <div className="rounded-2xl border border-border-default bg-bg-card px-4 py-6 text-text-muted">
      Không có dữ liệu để hiển thị.
     </div>
    ) : mode === "sentence" ? (
     <SentenceDetailPanel
      key={`${smartData.selection}-sentence`}
      text={text}
      smartData={smartData}
      onCharacterSelect={(character) =>
       openDetailDrawer({
        text: character,
        contextSentence: text,
        mode: "word",
       })
      }
      onSave={handleSave}
      isSaving={detailQuery.isSaving}
     />
    ) : (
     <WordDetailPanel
      key={`${smartData.selection}-word`}
      smartData={smartData}
      onDrillCharacter={(character) =>
       openDetailDrawer({
        text: character,
        contextSentence: text,
        mode: "word",
       })
      }
      onSave={handleSave}
      isSaving={detailQuery.isSaving}
      displayMeaning={displayMeaning}
      hanziFont={hanziFont}
     />
    )}
   </SheetBody>
  </Sheet>
 );
}

function WordDetailPanel({
 smartData,
 onDrillCharacter,
 onSave,
 isSaving,
 displayMeaning,
 hanziFont,
}: {
 smartData: NonNullable<ReturnType<typeof useSmartSelectionInsights>["data"]>;
 onDrillCharacter: (character: string) => void;
 onSave: (noteDraft: string) => void;
 isSaving: boolean;
 displayMeaning: string;
 hanziFont: HanziReaderFont;
}) {
 const ai = smartData.entry.ai_analysis;
 const radicals = getNormalizedRadicals(ai);
 const definitions = getNormalizedDefinitions(ai, smartData.entry.meaning || "");
 const examples =
  ai?.examples?.filter((example) => example.zh || example.vi) ||
  definitions
   .flatMap((definition) => definition.examples || [])
   .filter((example) => example.cn || example.vi)
   .map((example) => ({
    zh: example.cn || "",
    pinyin: example.pinyin || example.py || "",
    vi: example.vi || "",
   }));
 const relatedCompounds = getNormalizedRelatedCompounds(ai);
 const synonyms = getNormalizedSynonyms(ai);
 const antonyms = getNormalizedAntonyms(ai);
 const characters = getUniqueCharacters(smartData.entry.hanzi);
 const [activeCharacter, setActiveCharacter] = useState(characters[0] || "");
 const visualCharacter =
  characters.includes(activeCharacter) && activeCharacter
   ? activeCharacter
   : characters[0] || smartData.entry.hanzi;
 const [noteDraft, setNoteDraft] = useState(smartData.personal_note || "");
 const etymologyType = typeof ai?.etymology === "object" ? ai.etymology.type : undefined;
 const etymologyText = typeof ai?.etymology === "object" ? ai.etymology.explanation : ai?.etymology;

 return (
  <div className="space-y-5">
   <div className="rounded-2xl border border-border-default bg-bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <div>
      <Typography
       as="p"
       variant="overline"
       tone="muted"
       weight="bold"
       scale="micro"
       tracking="extraLoose"
       transform="uppercase"
      >
       Header
      </Typography>
      <Typography as="p" tone="default" weight="semibold" className="mt-1">
       {displayMeaning}
      </Typography>
     </div>
     <Button
      type="button"
      onClick={() => onSave(noteDraft)}
      disabled={isSaving}
      variant="outline"
      className="inline-flex"
     >
      {isSaving ? (
       <Loader2 className="h-4 w-4 animate-spin" />
      ) : smartData.isSaved ? (
       <Check className="h-4 w-4 text-success" />
      ) : (
       <BookmarkPlus className="h-4 w-4" />
      )}
      {smartData.isSaved ? "Đã lưu" : "Lưu"}
     </Button>
    </div>
   </div>

   <section className="rounded-2xl border border-border-default bg-bg-card p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
     <div>
      <Typography
       as="p"
       variant="overline"
       tone="muted"
       weight="bold"
       scale="micro"
       tracking="extraLoose"
       transform="uppercase"
      >
       Giải phẫu
      </Typography>
      {characters.length > 1 && (
       <div className="mt-2 flex flex-wrap gap-2">
        {characters.map((character) => (
         <Chip
          key={character}
          size="sm"
          pressed={visualCharacter === character}
          variant={visualCharacter === character ? "accent" : "default"}
          onClick={() => setActiveCharacter(character)}
         >
          {character}
         </Chip>
        ))}
       </div>
      )}
     </div>
     {visualCharacter && visualCharacter !== smartData.entry.hanzi && (
      <Button
       type="button"
       onClick={() => onDrillCharacter(visualCharacter)}
       variant="ghost"
       className="-hover"
      >
       Tra riêng chữ này
      </Button>
     )}
    </div>

    <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
     <CharacterWriterCard character={visualCharacter} hanziFont={hanziFont} />

     <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-2xl border border-border-default bg-bg-primary p-3">
       <Typography
        as="p"
        variant="overline"
        tone="muted"
        weight="bold"
        scale="micro"
        tracking="extraLoose"
        transform="uppercase"
        className="mb-2"
       >
        Bộ thủ
       </Typography>
       {radicals.length > 0 ? (
        <div className="space-y-2">
         {radicals.slice(0, 4).map((radical, index) => (
          <div
           key={`${radical.char || radical.meaning || "radical"}-${index}`}
           className="rounded-2xl border border-border-default bg-bg-card px-3 py-2"
          >
           <Typography as="p" tone="default" weight="bold">
            {radical.char || "?"}
           </Typography>
           <Typography as="p" variant="caption" weight="semibold">
            {radical.pinyin}
           </Typography>
           <Typography as="p" variant="caption" tone="secondary">
            {radical.meaning}
           </Typography>
          </div>
         ))}
        </div>
       ) : (
        <Typography as="p" tone="muted">
         Chưa có dữ liệu bộ thủ.
        </Typography>
       )}
      </div>

      <div className="rounded-2xl border border-border-default bg-bg-primary p-3">
       <Typography
        as="p"
        variant="overline"
        tone="muted"
        weight="bold"
        scale="micro"
        tracking="extraLoose"
        transform="uppercase"
        className="mb-2"
       >
        Lục thư
       </Typography>
       {etymologyType && <Badge variant="accent">{etymologyType}</Badge>}
       <Typography as="p" tone="secondary" leading="relaxed" className="mt-2">
        {etymologyText || "Chưa có phân tích nguồn gốc."}
       </Typography>
      </div>
     </div>
    </div>
   </section>
   {ai?.mnemonic_story && (
    <div className="mt-3 rounded-xl bg-warning-subtle p-3">
     <Typography as="p" variant="caption" tone="warning" weight="bold" className="mb-1.5">
      AI gợi ý mẹo nhớ
     </Typography>
     <Typography as="p" tone="default" leading="relaxed">
      {ai.mnemonic_story}
     </Typography>
    </div>
   )}

   <section className="rounded-2xl border border-border-default bg-bg-card p-4">
    <Typography
     as="p"
     variant="overline"
     tone="muted"
     weight="bold"
     scale="micro"
     tracking="extraLoose"
     transform="uppercase"
     className="mb-3"
    >
     Ngữ nghĩa & Ví dụ
    </Typography>
    <div className="space-y-4">
     {definitions.length > 0 ? (
      definitions.map((definition, index) => {
       const definitionExamples =
        definition.examples
         ?.filter((example) => example.cn || example.vi)
         .map((example) => ({
          zh: example.cn || "",
          pinyin: example.pinyin || example.py || "",
          vi: example.vi || "",
         })) || [];

       return (
        <div
         key={`${definition.text || definition.meaning || "definition"}-${index}`}
         className="rounded-2xl border border-border-default bg-bg-primary p-3"
        >
         <div className="flex items-center gap-2">
          <Typography
           variant="caption"
           weight="bold"
           scale="micro"
           className="rounded-full bg-accent px-2 py-1"
          >
           {index + 1}
          </Typography>
          {definition.pos && <Badge variant="info">{definition.pos}</Badge>}
         </div>
         <Typography as="p" tone="default" weight="semibold" className="mt-2">
          {definition.meaning || definition.text}
         </Typography>
         {definitionExamples.length > 0 && (
          <div className="mt-3 space-y-2 border-l-2 border-accent/20 pl-3">
           {definitionExamples.map((example, exampleIndex) => (
            <ExampleCard key={`${example.zh}-${exampleIndex}`} example={example} />
           ))}
          </div>
         )}
        </div>
       );
      })
     ) : (
      <div className="rounded-2xl border border-border-default bg-bg-primary p-3 text-text-muted">
       {displayMeaning || "Chưa có dữ liệu nghĩa."}
      </div>
     )}

     {examples.length > 0 && (
      <div className="space-y-2">
       <Typography
        as="p"
        variant="overline"
        tone="muted"
        weight="bold"
        scale="micro"
        tracking="extraLoose"
        transform="uppercase"
       >
        Ví dụ nổi bật
       </Typography>
       <div className="grid gap-2 md:grid-cols-2">
        {examples.slice(0, 4).map((example, index) => (
         <ExampleCard key={`${example.zh}-${index}`} example={example} />
        ))}
       </div>
      </div>
     )}

     <div className="space-y-2">
      <Typography
       as="p"
       variant="overline"
       tone="muted"
       weight="bold"
       scale="micro"
       tracking="extraLoose"
       transform="uppercase"
      >
       Từ ghép liên quan
      </Typography>
      <div className="space-y-3">
       <RelationList
        title="Từ ghép"
        items={relatedCompounds}
        emptyText="Chưa có từ ghép liên quan."
        onSelect={onDrillCharacter}
       />
       <RelationList
        title="Đồng nghĩa"
        items={synonyms}
        emptyText="Chưa có từ đồng nghĩa cơ bản."
        onSelect={onDrillCharacter}
       />
       <RelationList
        title="Trái nghĩa"
        items={antonyms}
        emptyText="Chưa có từ trái nghĩa cơ bản."
        onSelect={onDrillCharacter}
       />
      </div>
     </div>
    </div>
   </section>

   <section className="rounded-2xl border border-border-default bg-bg-card p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
     <Typography
      as="p"
      variant="overline"
      tone="muted"
      weight="bold"
      scale="micro"
      tracking="extraLoose"
      transform="uppercase"
     >
      Ghi chú cá nhân
     </Typography>
     <Button
      type="button"
      onClick={() => onSave(noteDraft)}
      disabled={isSaving}
      variant="outline"
      className="inline-flex"
     >
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Lưu note
     </Button>
    </div>
    <Textarea
     value={noteDraft}
     onChange={(event) => setNoteDraft(event.target.value)}
     placeholder="Tự ghi cách nhớ, ngữ cảnh dùng, điểm dễ nhầm..."
     density="comfortable"
     className="w-full"
    />
   </section>
  </div>
 );
}

function SentenceDetailPanel({
 text,
 smartData,
 onCharacterSelect,
 onSave,
 isSaving,
}: {
 text: string;
 smartData: NonNullable<ReturnType<typeof useSmartSelectionInsights>["data"]>;
 onCharacterSelect: (character: string) => void;
 onSave: (noteDraft: string) => void;
 isSaving: boolean;
}) {
 const [noteDraft, setNoteDraft] = useState(smartData.personal_note || "");

 return (
  <div className="space-y-5">
   <section className="rounded-2xl border border-border-default bg-bg-card p-4">
    <Typography
     as="p"
     variant="overline"
     tone="muted"
     weight="bold"
     scale="micro"
     tracking="extraLoose"
     transform="uppercase"
     className="mb-2"
    >
     Dịch nghĩa
    </Typography>
    <Typography as="p" tone="default" leading="relaxed">
     {smartData.translation || smartData.entry.meaning || "Chưa có bản dịch."}
    </Typography>
   </section>

   {smartData.grammar_points.length > 0 && (
    <section className="rounded-2xl border border-border-default bg-bg-card p-4">
     <Typography
      as="p"
      variant="overline"
      tone="muted"
      weight="bold"
      scale="micro"
      tracking="extraLoose"
      transform="uppercase"
      className="mb-3"
     >
      Ghi chú ngữ pháp
     </Typography>
     <div className="space-y-2">
      {smartData.grammar_points.map((point, index) => (
       <div
        key={`${point.pattern || "grammar"}-${index}`}
        className="rounded-2xl border border-border-default bg-bg-primary p-3"
       >
        <Typography
         as="p"
         variant="overline"
         weight="semibold"
         tracking="wide"
         transform="uppercase"
        >
         {point.pattern || `Điểm ${index + 1}`}
        </Typography>
        {point.explanation && (
         <Typography as="p" tone="secondary" leading="relaxed" className="mt-1">
          {point.explanation}
         </Typography>
        )}
       </div>
      ))}
     </div>
    </section>
   )}

   <section className="rounded-2xl border border-border-default bg-bg-card p-4">
    <Typography
     as="p"
     variant="overline"
     tone="muted"
     weight="bold"
     scale="micro"
     tracking="extraLoose"
     transform="uppercase"
     className="mb-3"
    >
     Bấm từng hán tự để học sâu
    </Typography>
    <div className="flex flex-wrap gap-2">
     {Array.from(text).map((char, index) =>
      HANZI_CHAR_REGEX.test(char) ? (
       <Button
        key={`${char}-${index}`}
        type="button"
        onClick={() => onCharacterSelect(char)}
        variant="outline"
        size="icon-sm"
        className="inline-flex min-w-10"
       >
        {char}
       </Button>
      ) : (
       <Typography
        as="span"
        key={`${char}-${index}`}
        tone="muted"
        className="inline-flex h-10 min-w-10 items-center justify-center rounded-md bg-bg-subtle px-2"
       >
        {char}
       </Typography>
      ),
     )}
    </div>
   </section>

   <section className="rounded-2xl border border-border-default bg-bg-card p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
     <Typography
      as="p"
      variant="overline"
      tone="muted"
      weight="bold"
      scale="micro"
      tracking="extraLoose"
      transform="uppercase"
     >
      Ghi chú cá nhân
     </Typography>
     <Button
      type="button"
      onClick={() => onSave(noteDraft)}
      disabled={isSaving}
      variant="outline"
      className="inline-flex"
     >
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Lưu note
     </Button>
    </div>
    <Textarea
     value={noteDraft}
     onChange={(event) => setNoteDraft(event.target.value)}
     placeholder="Ghi chú cách hiểu câu, cấu trúc hoặc lỗi dễ mắc..."
     density="comfortable"
     className="w-full"
    />
   </section>
  </div>
 );
}

function ExampleCard({ example }: { example: { zh: string; pinyin: string; vi: string } }) {
 return (
  <div className="rounded-2xl border border-border-default bg-bg-primary p-3">
   <Typography as="p" tone="default" weight="medium">
    {example.zh}
   </Typography>
   {example.pinyin && (
    <Typography as="p" variant="caption" weight="semibold">
     {example.pinyin}
    </Typography>
   )}
   {example.vi && (
    <Typography as="p" variant="caption" tone="secondary" emphasis="italic">
     {example.vi}
    </Typography>
   )}
  </div>
 );
}

function RelationList({
 title,
 items,
 emptyText,
 onSelect,
}: {
 title: string;
 items: Array<{ word?: string; pinyin?: string; meaning?: string }>;
 emptyText: string;
 onSelect: (word: string) => void;
}) {
 return (
  <div className="space-y-2">
   <Typography
    as="p"
    variant="overline"
    tone="muted"
    weight="bold"
    scale="micro"
    tracking="extraLoose"
    transform="uppercase"
   >
    {title}
   </Typography>
   {items.length > 0 ? (
    <div className="space-y-2">
     {items.map((item, index) => {
      const word = item.word?.trim();
      if (!word) return null;

      return (
       <Button
        key={`${title}-${word}-${index}`}
        type="button"
        onClick={() => onSelect(word)}
        variant="outline"
        align="start"
        className="flex w-full"
       >
        <div className="min-w-0">
         <div className="flex flex-wrap items-center gap-2">
          <Typography tone="default" weight="bold">
           {word}
          </Typography>
          {item.pinyin && (
           <Typography variant="caption" weight="semibold">
            {item.pinyin}
           </Typography>
          )}
         </div>
         <Typography as="p" tone="secondary" leading="relaxed" className="mt-1">
          {item.meaning || "Chưa có nghĩa."}
         </Typography>
        </div>
       </Button>
      );
     })}
    </div>
   ) : (
    <div className="rounded-2xl border border-border-default bg-bg-primary p-3 text-text-muted">
     {emptyText}
    </div>
   )}
  </div>
 );
}

function CharacterWriterCard({
 character,
 hanziFont,
}: {
 character: string;
 hanziFont: HanziReaderFont;
}) {
 const containerRef = useRef<HTMLDivElement>(null);
 const writerRef = useRef<HanziWriterInstance>(null);

 useEffect(() => {
  if (!containerRef.current || !character || typeof window === "undefined") {
   return;
  }

  const container = containerRef.current;
  let isActive = true;
  writerRef.current = null;
  container.innerHTML = "";

  const renderFallback = () => {
   container.innerHTML = "";
   container.style.display = "flex";
   container.style.alignItems = "center";
   container.style.justifyContent = "center";
   container.textContent = character;
   container.style.fontSize = "88px";
   container.style.fontWeight = "700";
   container.style.fontFamily = getHanziFontFamily(hanziFont);
   container.style.color = getThemeColor("--foreground");
  };

  const drawGrid = () => {
   const existing = container.querySelector(".hanzi-grid-bg");
   if (existing) return;
   const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
   svg.setAttribute("class", "hanzi-grid-bg");
   svg.setAttribute("width", "160");
   svg.setAttribute("height", "160");
   svg.style.position = "absolute";
   svg.style.top = "0";
   svg.style.left = "0";
   svg.style.zIndex = "0";
   svg.style.pointerEvents = "none";
   svg.style.opacity = "0.15";
   svg.style.color = getThemeColor("--border");
   svg.innerHTML = `
  <rect width="160" height="160" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <line x1="80" y1="0" x2="80" y2="160" stroke="currentColor" stroke-width="0.8" stroke-dasharray="4,3"/>
  <line x1="0" y1="80" x2="160" y2="80" stroke="currentColor" stroke-width="0.8" stroke-dasharray="4,3"/>
  <line x1="0" y1="0" x2="160" y2="160" stroke="currentColor" stroke-width="0.5" stroke-dasharray="4,3"/>
  <line x1="160" y1="0" x2="0" y2="160" stroke="currentColor" stroke-width="0.5" stroke-dasharray="4,3"/>
  `;
   container.insertBefore(svg, container.firstChild);
  };

  void import("hanzi-writer")
   .then(async (module) => {
    if (!isActive) return;
    const HanziWriter = module.default;
    const strokeColor = getThemeColor("--foreground");
    const radicalColor = getThemeColor("--primary");
    const outlineColor = getThemeColor("--border");
    const drawingColor = getThemeColor("--destructive");

    try {
     const charData = await HanziWriter.loadCharacterData(character);
     if (!isActive) return;
     drawGrid();
     const writer = HanziWriter.create(container, character, {
      width: 160,
      height: 160,
      padding: 10,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 200,
      strokeColor,
      radicalColor,
      outlineColor,
      drawingColor,
      showOutline: true,
      showCharacter: true,
      charDataLoader: () => charData,
     });
     writerRef.current = writer;
     requestAnimationFrame(() => {
      if (!isActive) return;
      void writer.hideCharacter?.({ duration: 0 })?.then(() => writer.animateCharacter?.());
     });
    } catch {
     if (!isActive) return;
     renderFallback();
    }
   })
   .catch(() => {
    if (!isActive) return;
    renderFallback();
   });

  return () => {
   isActive = false;
   writerRef.current = null;
   container.innerHTML = "";
  };
 }, [character, hanziFont]);

 return (
  <div className="rounded-2xl border border-border-default bg-bg-primary p-3">
   <div
    ref={containerRef}
    className="mx-auto rounded-xl border border-border-default bg-bg-card"
    style={{ width: 160, height: 160, position: "relative" }}
   />
  </div>
 );
}
