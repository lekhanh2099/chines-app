"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSelector } from "@tanstack/react-store";
import { BookmarkPlus, Check, Loader2, Save, Volume2, VolumeOff } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import {
 HanziAwareText,
 HanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
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
 if (mode === "sentence") return data.translation || data.entry.meaning || "";

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
  enabled: isOpen && Boolean(text),
  mode,
 });
 const smartData = detailQuery.data;
 const displayMeaning = getDisplayMeaning(mode, smartData);
 const { speak, stop, isSpeaking, isLoading: isTTSLoading } = useTTS();

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

 if (!isOpen) return null;

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
   <div className="border-b border-border-default px-4 py-3 sm:px-5">
    <div className="grid min-w-0 gap-1">
     <div className="flex items-center gap-2">
      <HanziText as="p" size="review" tone="default" weight="black" clamp="one" leading="tight">
       {smartData?.entry.hanzi || text}
      </HanziText>
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
     {smartData?.entry.pinyin ? (
      <PinyinText as="p" tone="accent" weight="semibold">
       {smartData.entry.pinyin}
      </PinyinText>
     ) : null}
     {smartData?.runtimeReceipt ? (
      <div className="flex flex-wrap gap-1.5">
       <Badge variant="default" size="sm" casing="natural">
        {smartData.runtimeReceipt.provider}
       </Badge>
       <Badge variant="default" size="sm" casing="natural">
        {smartData.runtimeReceipt.model}
       </Badge>
       <Badge variant="default" size="sm" casing="natural">
        {smartData.runtimeReceipt.keyLabel}
       </Badge>
      </div>
     ) : null}
    </div>
   </div>

   <SheetBody>
    {detailQuery.isLoading ? (
     <Card
      variant="subtle"
      padding="lg"
      className="flex min-h-40 items-center justify-center gap-2"
     >
      <Loader2 className="animate-spin" />
      <Typography tone="muted">Đang tải chi tiết từ vựng...</Typography>
     </Card>
    ) : detailQuery.isError ? (
     <Card variant="subtle" padding="md" role="alert">
      <Typography as="p" variant="bodySmall" tone="danger" weight="semibold">
       {detailQuery.error instanceof Error
        ? detailQuery.error.message
        : "Không thể tải dữ liệu chi tiết"}
      </Typography>
     </Card>
    ) : !smartData ? (
     <Card variant="subtle" padding="lg">
      <Typography as="p" tone="muted" align="center">
       Không có dữ liệu để hiển thị.
      </Typography>
     </Card>
    ) : mode === "sentence" ? (
     <SentenceDetailPanel
      key={`${smartData.selection}-sentence`}
      text={text}
      smartData={smartData}
      onCharacterSelect={(character) =>
       openDetailDrawer({ text: character, contextSentence: text, mode: "word" })
      }
      onSave={handleSave}
      isSaving={detailQuery.isSaving}
     />
    ) : (
     <WordDetailPanel
      key={`${smartData.selection}-word`}
      smartData={smartData}
      onDrillCharacter={(character) =>
       openDetailDrawer({ text: character, contextSentence: text, mode: "word" })
      }
      onSave={handleSave}
      isSaving={detailQuery.isSaving}
      displayMeaning={displayMeaning}
     />
    )}
   </SheetBody>
  </Sheet>
 );
}

function DetailSection({
 title,
 actions,
 children,
}: {
 title: string;
 actions?: ReactNode;
 children: ReactNode;
}) {
 return (
  <Card asChild variant="section" padding="md">
   <section className="grid gap-3">
    <div className="flex items-center justify-between gap-3">
     <Typography
      as="h3"
      variant="overline"
      tone="muted"
      weight="bold"
      tracking="extraLoose"
      transform="uppercase"
     >
      {title}
     </Typography>
     {actions}
    </div>
    {children}
   </section>
  </Card>
 );
}

function WordDetailPanel({
 smartData,
 onDrillCharacter,
 onSave,
 isSaving,
 displayMeaning,
}: {
 smartData: NonNullable<ReturnType<typeof useSmartSelectionInsights>["data"]>;
 onDrillCharacter: (character: string) => void;
 onSave: (noteDraft: string) => void;
 isSaving: boolean;
 displayMeaning: string;
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
  <div className="grid gap-4">
   <DetailSection
    title="Tóm tắt"
    actions={
     <Button
      type="button"
      onClick={() => onSave(noteDraft)}
      disabled={isSaving}
      variant="outline"
      size="toolbar"
     >
      {isSaving ? (
       <Loader2 data-icon="inline-start" className="animate-spin" />
      ) : smartData.isSaved ? (
       <Check data-icon="inline-start" className="text-success-text" />
      ) : (
       <BookmarkPlus data-icon="inline-start" />
      )}
      {smartData.isSaved ? "Đã lưu" : "Lưu"}
     </Button>
    }
   >
    <Typography as="p" tone="default" weight="semibold" leading="standard">
     {displayMeaning || "Chưa có nghĩa tóm tắt."}
    </Typography>
   </DetailSection>

   <DetailSection
    title="Giải phẫu"
    actions={
     visualCharacter && visualCharacter !== smartData.entry.hanzi ? (
      <Button
       type="button"
       onClick={() => onDrillCharacter(visualCharacter)}
       variant="outline"
       size="toolbar"
      >
       Tra riêng chữ này
      </Button>
     ) : undefined
    }
   >
    {characters.length > 1 ? (
     <div className="flex flex-wrap gap-2">
      {characters.map((character) => (
       <Chip
        key={character}
        size="sm"
        pressed={visualCharacter === character}
        variant={visualCharacter === character ? "accent" : "default"}
        onClick={() => setActiveCharacter(character)}
       >
        <HanziText as="span" size="medium" leading="none">
         {character}
        </HanziText>
       </Chip>
      ))}
     </div>
    ) : null}

    <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
     <CharacterWriterCard character={visualCharacter} />
     <div className="grid gap-4 md:grid-cols-2">
      <section className="grid gap-2">
       <Typography as="h4" variant="cardTitle" tone="default" weight="bold">
        Bộ thủ
       </Typography>
       {radicals.length > 0 ? (
        <div className="grid gap-2">
         {radicals.slice(0, 4).map((radical, index) => (
          <div
           key={`${radical.char || radical.meaning || "radical"}-${index}`}
           className="grid gap-0.5"
          >
           <HanziText as="p" size="medium" tone="default" weight="bold">
            {radical.char || "?"}
           </HanziText>
           {radical.pinyin ? (
            <PinyinText as="p" variant="caption" tone="accent" weight="semibold">
             {radical.pinyin}
            </PinyinText>
           ) : null}
           {radical.meaning ? (
            <Typography as="p" variant="caption" tone="secondary">
             {radical.meaning}
            </Typography>
           ) : null}
          </div>
         ))}
        </div>
       ) : (
        <Typography as="p" tone="muted">
         Chưa có dữ liệu bộ thủ.
        </Typography>
       )}
      </section>

      <section className="grid content-start gap-2">
       <Typography as="h4" variant="cardTitle" tone="default" weight="bold">
        Lục thư
       </Typography>
       {etymologyType ? <Badge variant="accent">{etymologyType}</Badge> : null}
       <Typography as="p" tone="secondary" leading="relaxed">
        {etymologyText || "Chưa có phân tích nguồn gốc."}
       </Typography>
      </section>
     </div>
    </div>

    {ai?.mnemonic_story ? (
     <Card variant="subtle" padding="sm" className="grid gap-1">
      <Typography as="p" variant="caption" tone="warning" weight="bold">
       AI gợi ý mẹo nhớ
      </Typography>
      <HanziAwareText text={ai.mnemonic_story} tone="default" leading="relaxed" />
     </Card>
    ) : null}
   </DetailSection>

   <DetailSection title="Ngữ nghĩa & ví dụ">
    {definitions.length > 0 ? (
     <div className="grid gap-4">
      {definitions.map((definition, index) => {
       const definitionExamples =
        definition.examples
         ?.filter((example) => example.cn || example.vi)
         .map((example) => ({
          zh: example.cn || "",
          pinyin: example.pinyin || example.py || "",
          vi: example.vi || "",
         })) || [];

       return (
        <section
         key={`${definition.text || definition.meaning || "definition"}-${index}`}
         className="grid gap-2"
        >
         {index > 0 ? <Separator /> : null}
         <div className="flex items-center gap-2">
          <Typography variant="overline" tone="accent" weight="black">
           Nghĩa {index + 1}
          </Typography>
          {definition.pos ? <Badge variant="info">{definition.pos}</Badge> : null}
         </div>
         <HanziAwareText
          text={definition.meaning || definition.text || ""}
          tone="default"
          weight="semibold"
         />
         {definitionExamples.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2">
           {definitionExamples.map((example, exampleIndex) => (
            <ExampleCard key={`${example.zh}-${exampleIndex}`} example={example} />
           ))}
          </div>
         ) : null}
        </section>
       );
      })}
     </div>
    ) : (
     <Typography as="p" tone="muted">
      {displayMeaning || "Chưa có dữ liệu nghĩa."}
     </Typography>
    )}

    {examples.length > 0 ? (
     <>
      <Separator />
      <section className="grid gap-2">
       <Typography as="h4" variant="cardTitle" tone="default" weight="bold">
        Ví dụ nổi bật
       </Typography>
       <div className="grid gap-2 md:grid-cols-2">
        {examples.slice(0, 4).map((example, index) => (
         <ExampleCard key={`${example.zh}-${index}`} example={example} />
        ))}
       </div>
      </section>
     </>
    ) : null}

    <Separator />
    <div className="grid gap-4">
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
   </DetailSection>

   <DetailSection
    title="Ghi chú cá nhân"
    actions={
     <Button
      type="button"
      onClick={() => onSave(noteDraft)}
      disabled={isSaving}
      variant="outline"
      size="toolbar"
     >
      {isSaving ? (
       <Loader2 data-icon="inline-start" className="animate-spin" />
      ) : (
       <Save data-icon="inline-start" />
      )}
      Lưu note
     </Button>
    }
   >
    <Textarea
     value={noteDraft}
     onChange={(event) => setNoteDraft(event.target.value)}
     placeholder="Tự ghi cách nhớ, ngữ cảnh dùng, điểm dễ nhầm..."
     density="comfortable"
     className="w-full"
    />
   </DetailSection>
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
  <div className="grid gap-4">
   <DetailSection title="Dịch nghĩa">
    <Typography as="p" tone="default" leading="relaxed">
     {smartData.translation || smartData.entry.meaning || "Chưa có bản dịch."}
    </Typography>
   </DetailSection>

   {smartData.grammar_points.length > 0 ? (
    <DetailSection title="Ghi chú ngữ pháp">
     <div className="grid gap-3">
      {smartData.grammar_points.map((point, index) => (
       <section key={`${point.pattern || "grammar"}-${index}`} className="grid gap-1">
        {index > 0 ? <Separator /> : null}
        <HanziAwareText
         as="h4"
         text={point.pattern || `Điểm ${index + 1}`}
         variant="cardTitle"
         tone="accent"
         weight="bold"
        />
        {point.explanation ? (
         <HanziAwareText text={point.explanation} tone="secondary" leading="relaxed" />
        ) : null}
       </section>
      ))}
     </div>
    </DetailSection>
   ) : null}

   <DetailSection title="Bấm từng hán tự để học sâu">
    <div className="flex flex-wrap gap-2">
     {Array.from(text).map((char, index) =>
      HANZI_CHAR_REGEX.test(char) ? (
       <Button
        key={`${char}-${index}`}
        type="button"
        onClick={() => onCharacterSelect(char)}
        variant="outline"
        size="icon-toolbar"
        aria-label={`Tra chữ ${char}`}
       >
        <HanziText as="span" size="medium" leading="none">
         {char}
        </HanziText>
       </Button>
      ) : (
       <Typography as="span" key={`${char}-${index}`} tone="muted" className="px-1 py-2">
        {char}
       </Typography>
      ),
     )}
    </div>
   </DetailSection>

   <DetailSection
    title="Ghi chú cá nhân"
    actions={
     <Button
      type="button"
      onClick={() => onSave(noteDraft)}
      disabled={isSaving}
      variant="outline"
      size="toolbar"
     >
      {isSaving ? (
       <Loader2 data-icon="inline-start" className="animate-spin" />
      ) : (
       <Save data-icon="inline-start" />
      )}
      Lưu note
     </Button>
    }
   >
    <Textarea
     value={noteDraft}
     onChange={(event) => setNoteDraft(event.target.value)}
     placeholder="Ghi chú cách hiểu câu, cấu trúc hoặc lỗi dễ mắc..."
     density="comfortable"
     className="w-full"
    />
   </DetailSection>
  </div>
 );
}

function ExampleCard({ example }: { example: { zh: string; pinyin: string; vi: string } }) {
 return (
  <Card variant="subtle" padding="sm" className="grid gap-1">
   <HanziText as="p" size="inherit" tone="default" weight="medium">
    {example.zh}
   </HanziText>
   {example.pinyin ? (
    <PinyinText as="p" variant="caption" tone="accent" weight="semibold">
     {example.pinyin}
    </PinyinText>
   ) : null}
   {example.vi ? (
    <Typography as="p" variant="caption" tone="secondary" emphasis="italic">
     {example.vi}
    </Typography>
   ) : null}
  </Card>
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
  <section className="grid gap-2">
   <Typography as="h4" variant="cardTitle" tone="default" weight="bold">
    {title}
   </Typography>
   {items.length > 0 ? (
    <div className="grid gap-2">
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
        wrap="normal"
        className="w-full"
       >
        <span className="grid min-w-0 gap-1">
         <span className="flex flex-wrap items-center gap-2">
          <HanziText as="span" size="medium" tone="default" weight="bold">
           {word}
          </HanziText>
          {item.pinyin ? (
           <PinyinText as="span" variant="caption" tone="accent" weight="semibold">
            {item.pinyin}
           </PinyinText>
          ) : null}
         </span>
         <Typography
          as="span"
          variant="bodySmall"
          tone="secondary"
          leading="relaxed"
          className="block"
         >
          {item.meaning || "Chưa có nghĩa."}
         </Typography>
        </span>
       </Button>
      );
     })}
    </div>
   ) : (
    <Typography as="p" variant="bodySmall" tone="muted">
     {emptyText}
    </Typography>
   )}
  </section>
 );
}

function CharacterWriterCard({ character }: { character: string }) {
 const containerRef = useRef<HTMLDivElement>(null);
 const writerRef = useRef<HanziWriterInstance>(null);

 useEffect(() => {
  if (!containerRef.current || !character || typeof window === "undefined") return;

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
 }, [character]);

 return (
  <Card variant="subtle" padding="sm" className="justify-self-start">
   <div
    ref={containerRef}
    className="font-hanzi"
    lang="zh-CN"
    style={{ width: 160, height: 160, position: "relative" }}
   />
  </Card>
 );
}
