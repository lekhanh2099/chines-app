"use client";

import { useState, type ReactNode } from "react";
import { useSelector } from "@tanstack/react-store";
import { BookmarkPlus, Check, Loader2, Save, Volume2, VolumeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Chip } from "@/components/ui/actions/chip";
import { Separator } from "@/components/ui/layout/separator";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/overlays/sheet";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";
import {
 HanziAwareText,
 HanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useSmartSelectionInsights } from "@/hooks/useSmartSelectionInsights";
import { useTTS } from "@/hooks/useTTS";
import { extractChinese } from "@/lib/text/chinese-utils";
import { CharacterWriterCard } from "@/features/dictionary/components/CharacterWriterCard";
import {
 getNormalizedAntonyms,
 getNormalizedDefinitions,
 getNormalizedRelatedCompounds,
 getNormalizedRadicals,
 getNormalizedSynonyms,
} from "@/services/vocab/vocab.service";
import { vocabDetailDrawerStore } from "@/stores/dictionary/vocab-detail-drawer-store";
import type { SmartSelectionMode } from "@/types/database";

const HANZI_CHAR_REGEX = /[\u4e00-\u9fff]/;

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
 const t = useTranslations("Dictionary.drawer");
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
     ? t("saveSentenceSuccess")
     : t("saveWordSuccess", { word: smartData.entry.hanzi }),
   );
  } catch {
   toast.error(t("saveError"));
  }
 };

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
    title={mode === "sentence" ? t("sentenceDetail") : t("vocabDetail")}
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
       aria-label={isSpeaking ? t("stopSpeak") : t("playSpeak")}
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
      <Typography tone="muted">{t("loading")}</Typography>
     </Card>
    ) : detailQuery.isError ? (
     <Card variant="subtle" padding="md" role="alert">
      <Typography as="p" variant="bodySmall" tone="danger" weight="semibold">
       {detailQuery.error instanceof Error ? detailQuery.error.message : t("error")}
      </Typography>
     </Card>
    ) : !smartData ? (
     <Card variant="subtle" padding="lg">
      <Typography as="p" tone="muted" align="center">
       {t("empty")}
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
 const t = useTranslations("Dictionary.drawer");
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
    title={t("summary")}
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
      {smartData.isSaved ? t("saved") : t("save")}
     </Button>
    }
   >
    <Typography as="p" tone="default" weight="semibold" leading="standard">
     {displayMeaning || t("noSummaryMeaning")}
    </Typography>
   </DetailSection>

   <DetailSection
    title={t("anatomy")}
    actions={
     visualCharacter && visualCharacter !== smartData.entry.hanzi ? (
      <Button
       type="button"
       onClick={() => onDrillCharacter(visualCharacter)}
       variant="outline"
       size="toolbar"
      >
       {t("inspectThisChar")}
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
        {t("radicals")}
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
         {t("noRadicals")}
        </Typography>
       )}
      </section>

      <section className="grid content-start gap-2">
       <Typography as="h4" variant="cardTitle" tone="default" weight="bold">
        {t("etymology")}
       </Typography>
       {etymologyType ? <Badge variant="accent">{etymologyType}</Badge> : null}
       <Typography as="p" tone="secondary" leading="relaxed">
        {etymologyText || t("noEtymology")}
       </Typography>
      </section>
     </div>
    </div>

    {ai?.mnemonic_story ? (
     <Card variant="subtle" padding="sm" className="grid gap-1">
      <Typography as="p" variant="caption" tone="warning" weight="bold">
       {t("aiMnemonic")}
      </Typography>
      <HanziAwareText text={ai.mnemonic_story} tone="default" leading="relaxed" />
     </Card>
    ) : null}
   </DetailSection>

   <DetailSection title={t("semanticsAndExamples")}>
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
           {t("meaningIndex", { index: index + 1 })}
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
      {displayMeaning || t("noMeaningData")}
     </Typography>
    )}

    {examples.length > 0 ? (
     <>
      <Separator />
      <section className="grid gap-2">
       <Typography as="h4" variant="cardTitle" tone="default" weight="bold">
        {t("highlightedExamples")}
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
      title={t("compounds")}
      items={relatedCompounds}
      emptyText={t("noCompounds")}
      onSelect={onDrillCharacter}
     />
     <RelationList
      title={t("synonyms")}
      items={synonyms}
      emptyText={t("noSynonyms")}
      onSelect={onDrillCharacter}
     />
     <RelationList
      title={t("antonyms")}
      items={antonyms}
      emptyText={t("noAntonyms")}
      onSelect={onDrillCharacter}
     />
    </div>
   </DetailSection>

   <DetailSection
    title={t("personalNote")}
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
      {t("saveNote")}
     </Button>
    }
   >
    <Textarea
     value={noteDraft}
     onChange={(event) => setNoteDraft(event.target.value)}
     placeholder={t("notePlaceholderWord")}
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
 const t = useTranslations("Dictionary.drawer");
 const [noteDraft, setNoteDraft] = useState(smartData.personal_note || "");

 return (
  <div className="grid gap-4">
   <DetailSection title={t("translation")}>
    <Typography as="p" tone="default" leading="relaxed">
     {smartData.translation || smartData.entry.meaning || t("noTranslation")}
    </Typography>
   </DetailSection>

   {smartData.grammar_points.length > 0 ? (
    <DetailSection title={t("grammarNotes")}>
     <div className="grid gap-3">
      {smartData.grammar_points.map((point, index) => (
       <section key={`${point.pattern || "grammar"}-${index}`} className="grid gap-1">
        {index > 0 ? <Separator /> : null}
        <HanziAwareText
         as="h4"
         text={point.pattern || t("grammarPoint", { index: index + 1 })}
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

   <DetailSection title={t("deepLearningChars")}>
    <div className="flex flex-wrap gap-2">
     {Array.from(text).map((char, index) =>
      HANZI_CHAR_REGEX.test(char) ? (
       <Button
        key={`${char}-${index}`}
        type="button"
        onClick={() => onCharacterSelect(char)}
        variant="outline"
        size="icon-toolbar"
        aria-label={t("inspectChar", { char })}
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
    title={t("personalNote")}
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
      {t("saveNote")}
     </Button>
    }
   >
    <Textarea
     value={noteDraft}
     onChange={(event) => setNoteDraft(event.target.value)}
     placeholder={t("notePlaceholderSentence")}
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
 const t = useTranslations("Dictionary.drawer");

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
          {item.meaning || t("noMeaning")}
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
