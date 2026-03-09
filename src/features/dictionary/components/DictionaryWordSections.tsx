"use client";

import { useState } from "react";
import Link from "next/link";
import {
 BookmarkPlus,
 CheckCircle,
 Loader2,
 Save,
 Sparkles,
 Volume2,
 VolumeOff,
} from "lucide-react";
import { SectionHeader } from "@/components/layout/section-header";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/textarea";
import type {
 DictionaryWordReadyViewModel,
 ExampleItem,
} from "@/features/dictionary/types";
import { useVocabDetail } from "@/features/vocabulary/hooks/useVocabDetail";
import { useTTS } from "@/hooks/useTTS";
import { getNormalizedRadicals } from "@/services/vocab.service";

type DictionarySectionProps = {
 viewModel: DictionaryWordReadyViewModel;
};

function DictionaryHeroSection({ viewModel }: DictionarySectionProps) {
 const { vocabData } = useVocabDetail(viewModel.selectedCharacter);
 const ai = vocabData?.ai_analysis;
 const radicals = getNormalizedRadicals(ai);
 const { speak, stop, isSpeaking, isLoading: isTTSLoading } = useTTS();

 const handleSpeak = () => {
  if (isSpeaking) {
   stop();
   return;
  }
  void speak(viewModel.vocabData.hanzi);
 };

 return (
  <SectionWrapper>
   <div className="flex flex-col gap-4">
    <div className="min-w-0 flex-1">
     <div className="flex flex-wrap items-center gap-3">
      <h1 className="text-4xl font-black tracking-tight text-text-primary sm:text-5xl">
       {viewModel.vocabData.hanzi}
      </h1>
      <IconButton
       onClick={handleSpeak}
       disabled={isTTSLoading}
       title={isSpeaking ? "Dừng phát âm" : "Đọc từ"}
      >
       {isTTSLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
       ) : isSpeaking ? (
        <VolumeOff className="text-accent" />
       ) : (
        <Volume2 />
       )}
      </IconButton>
      {(viewModel.ai?.han_viet || viewModel.vocabData.sino_vietnamese) && (
       <Badge size="md">
        {viewModel.ai?.han_viet || viewModel.vocabData.sino_vietnamese}
       </Badge>
      )}
     </div>

     <div className="flex flex-wrap items-center gap-2.5">
      [
      {viewModel.vocabData.pinyin && (
       <p className="text-lg font-semibold text-accent sm:text-xl">
        {viewModel.vocabData.pinyin}
       </p>
      )}
      {viewModel.ai?.hsk_level && (
       <Badge size="sm" variant="info">
        {viewModel.ai.hsk_level}
       </Badge>
      )}
      {viewModel.ai?.tocfl_level && (
       <Badge size="sm" variant="purple">
        {viewModel.ai.tocfl_level}
       </Badge>
      )}
      ]
     </div>
     <div>
      {radicals.length > 0 && (
       <div className="flex flex-col gap-2">
        {radicals.map((radical, index) => (
         <div key={`${radical.char || radical.meaning || "radical"}-${index}`}>
          <div className="flex items-start gap-1">
           <span className="shrink-0 text-2xl font-black text-text-primary">
            {radical.char}
           </span>
           <div className="min-w-0 flex gap-1">
            {radical.pinyin && (
             <p className="text-xs font-semibold text-accent">
              {radical.pinyin}
             </p>
            )}
            {radical.meaning && (
             <p className="text-sm leading-relaxed text-text-primary">
              {radical.meaning}
             </p>
            )}
           </div>
          </div>
         </div>
        ))}
       </div>
      )}
     </div>

     {viewModel.meaningSummary && (
      <p className="max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base">
       [{viewModel.meaningSummary}]
      </p>
     )}
    </div>

    <Button
     onClick={viewModel.handleSave}
     disabled={viewModel.isSaving || viewModel.isSaved === true}
    >
     {viewModel.isSaving ? (
      <Loader2 className="h-4 w-4 animate-spin" />
     ) : viewModel.isSaved === true ? (
      <CheckCircle className="h-4 w-4" />
     ) : (
      <BookmarkPlus className="h-4 w-4" />
     )}
     {viewModel.isSaved === true ? "Đã lưu" : "Lưu vào SRS"}
    </Button>
   </div>
  </SectionWrapper>
 );
}

function DictionaryMeaningSection({ viewModel }: DictionarySectionProps) {
 return (
  <SectionWrapper>
   <SectionHeader
    title="Định nghĩa và ví dụ"
    description="Học nghĩa trước, nhìn ví dụ ngay bên dưới từng nghĩa."
    trailing={
     viewModel.meaningItems.length > 0 ? (
      <Badge size="sm">{viewModel.meaningItems.length} nghĩa</Badge>
     ) : null
    }
   />

   {viewModel.isAiLoading ? (
    <AiLoadingState />
   ) : viewModel.canRenderDashboard ? (
    <div className="flex flex-col gap-4">
     {viewModel.meaningItems.length > 0 ? (
      <div className="flex flex-col gap-3">
       {viewModel.meaningItems.map((meaning, index) => (
        <Card
         key={`${meaning.meaning}-${index}`}
         variant="subtle"
         padding="sm"
         className="rounded-2xl"
        >
         <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
           <Badge variant="accent" size="sm">
            {index + 1}
           </Badge>
           {meaning.pos && <Badge size="sm">{meaning.pos}</Badge>}
          </div>

          <p className="text-sm font-semibold leading-relaxed text-text-primary sm:text-base">
           {meaning.meaning}
          </p>

          {meaning.examples.length > 0 && (
           <div className="flex flex-col gap-2 border-l-2 border-accent/20 pl-3">
            {meaning.examples.map((example, exampleIndex) => (
             <ExampleRow
              key={`${example.zh}-${example.pinyin}-${exampleIndex}`}
              example={example}
             />
            ))}
           </div>
          )}
         </div>
        </Card>
       ))}
      </div>
     ) : (
      <Card variant="subtle" padding="sm">
       <p className="text-sm text-text-muted">
        Chưa có dữ liệu nghĩa để hiển thị.
       </p>
      </Card>
     )}

     {viewModel.extraExamples.length > 0 && (
      <div className="flex flex-col gap-2">
       <SectionHeader title="Ví dụ mở rộng" />
       <div className="grid gap-2 md:grid-cols-2">
        {viewModel.extraExamples.slice(0, 6).map((example, index) => (
         <ExampleCard
          key={`${example.zh}-${example.pinyin}-extra-${index}`}
          example={example}
         />
        ))}
       </div>
      </div>
     )}
    </div>
   ) : (
    <NoDataPlaceholder
     onRequest={viewModel.requestAiAnalysis}
     loading={viewModel.isAiLoading}
    />
   )}
  </SectionWrapper>
 );
}

function DictionaryRelatedSection({ viewModel }: DictionarySectionProps) {
 const hasAnyRelation =
  viewModel.relatedCompounds.length > 0 ||
  viewModel.synonyms.length > 0 ||
  viewModel.antonyms.length > 0;

 return (
  <SectionWrapper>
   <SectionHeader
    title="Liên hệ từ vựng"
    description="Mở rộng vốn từ qua từ ghép, đồng nghĩa và trái nghĩa cơ bản."
    trailing={
     hasAnyRelation ? (
      <Badge size="sm">
       {viewModel.relatedCompounds.length +
        viewModel.synonyms.length +
        viewModel.antonyms.length}{" "}
       mục
      </Badge>
     ) : null
    }
   />

   {hasAnyRelation ? (
    <div className="flex flex-col gap-4">
     <WordRelationGrid
      title="Từ ghép thông dụng"
      items={viewModel.relatedCompounds}
      emptyText="Chưa có từ ghép liên quan."
     />
     <WordRelationGrid
      title="Đồng nghĩa"
      items={viewModel.synonyms}
      emptyText="Chưa có từ đồng nghĩa cơ bản."
     />
     <WordRelationGrid
      title="Trái nghĩa"
      items={viewModel.antonyms}
      emptyText="Chưa có từ trái nghĩa cơ bản."
     />
    </div>
   ) : (
    <Card variant="subtle" padding="sm">
     <p className="text-sm text-text-muted">Chưa có dữ liệu từ liên quan.</p>
    </Card>
   )}
  </SectionWrapper>
 );
}

function DictionaryLearningInsightsSection({
 viewModel,
}: DictionarySectionProps) {
 if (!viewModel.hasLearningInsights) {
  return null;
 }

 return (
  <SectionWrapper>
   <SectionHeader
    title="Gợi nhớ và lưu ý"
    description="Tập trung vào mẹo nhớ, lỗi dễ nhầm và logic sử dụng."
   />

   <div className="">
    {viewModel.ai?.notes && (
     <Card variant="subtle" padding="sm" className="rounded-2xl">
      <div className="flex flex-col gap-2">
       <SectionHeader title="Ghi chú dùng từ" />
       <p className="text-sm leading-relaxed text-text-secondary">
        {viewModel.ai.notes}
       </p>
      </div>
     </Card>
    )}
   </div>

   {viewModel.ai?.usage_logic && viewModel.ai.usage_logic.length > 0 && (
    <Card variant="subtle" padding="sm">
     <div className="flex flex-col gap-2">
      <SectionHeader title="Tư duy cốt lõi" />
      {viewModel.ai.usage_logic.map((item, index) => (
       <Card
        key={`${item}-${index}`}
        variant="default"
        padding="sm"
        className="rounded-xl"
       >
        <div className="flex items-start gap-2">
         <span className="mt-0.5 text-xs text-accent">●</span>
         <span className="text-sm leading-relaxed text-text-secondary">
          {item}
         </span>
        </div>
       </Card>
      ))}
     </div>
    </Card>
   )}
  </SectionWrapper>
 );
}

function DictionaryPersonalNoteSection({ viewModel }: DictionarySectionProps) {
 const [note, setNote] = useState(viewModel.savedPersonalNote);

 return (
  <SectionWrapper>
   <SectionHeader
    title="Ghi chú cá nhân"
    description="Lưu cách nhớ, ngữ cảnh dùng hoặc điểm dễ nhầm của riêng anh."
    trailing={
     <Button
      variant="outline"
      size="sm"
      onClick={() => viewModel.handleSavePersonalNote(note)}
      disabled={viewModel.isSaving}
      isLoading={viewModel.isSaving}
      loadingText="Đang lưu..."
     >
      <Save className="h-4 w-4" />
      Lưu note
     </Button>
    }
   />

   <Textarea
    value={note}
    onChange={(event) => setNote(event.target.value)}
    placeholder="Tự ghi cách nhớ, ngữ cảnh dùng, điểm dễ nhầm..."
    className="min-h-40 rounded-3xl px-6 py-5"
   />
  </SectionWrapper>
 );
}

function ExampleRow({ example }: { example: ExampleItem }) {
 return (
  <div className="flex flex-col gap-1">
   <p className="text-sm font-medium text-text-primary">{example.zh}</p>
   {example.pinyin && (
    <p className="text-xs font-semibold text-accent">{example.pinyin}</p>
   )}
   {example.vi && (
    <p className="text-xs italic text-text-muted">{example.vi}</p>
   )}
  </div>
 );
}

function ExampleCard({ example }: { example: ExampleItem }) {
 return (
  <Card variant="subtle" padding="sm" className="rounded-2xl">
   <ExampleRow example={example} />
  </Card>
 );
}

function WordRelationGrid({
 title,
 items,
 emptyText,
}: {
 title: string;
 items: Array<{ word?: string; pinyin?: string; meaning?: string }>;
 emptyText: string;
}) {
 return (
  <div className="flex flex-col gap-2">
   <SectionHeader
    title={title}
    trailing={items.length > 0 ? <Badge size="sm">{items.length}</Badge> : null}
   />

   {items.length > 0 ? (
    <div className="grid gap-3 md:grid-cols-2">
     {items.map((item, index) => {
      const word = item.word?.trim();

      if (!word) {
       return null;
      }

      return (
       <Link
        key={`${title}-${word}-${index}`}
        href={`/dictionary/${encodeURIComponent(word)}`}
       >
        <Card
         variant="subtle"
         padding="sm"
         className="h-full rounded-2xl transition-colors hover:border-accent/30 hover:bg-bg-card-hover"
        >
         <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
           <p className="text-base font-bold text-text-primary">{word}</p>
           {item.pinyin && (
            <p className="text-xs font-semibold text-accent">{item.pinyin}</p>
           )}
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
           {item.meaning || "Chưa có nghĩa."}
          </p>
         </div>
        </Card>
       </Link>
      );
     })}
    </div>
   ) : (
    <Card variant="subtle" padding="sm">
     <p className="text-sm text-text-muted">{emptyText}</p>
    </Card>
   )}
  </div>
 );
}

function AiLoadingState() {
 return (
  <Card variant="subtle" padding="sm">
   <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2 text-xs font-bold text-accent">
     <Sparkles className="h-4 w-4 animate-pulse" />
     Đang phân tích dữ liệu chuyên sâu...
    </div>
    <div className="space-y-2.5">
     <div className="h-4 w-4/5 animate-pulse rounded bg-bg-subtle" />
     <div className="h-3 w-full animate-pulse rounded bg-bg-subtle" />
     <div className="h-3 w-3/4 animate-pulse rounded bg-bg-subtle" />
     <div className="h-3 w-5/6 animate-pulse rounded bg-bg-subtle" />
    </div>
   </div>
  </Card>
 );
}

function NoDataPlaceholder({
 onRequest,
 loading,
}: {
 onRequest: () => void;
 loading: boolean;
}) {
 return (
  <Card variant="subtle" padding="sm">
   <div className="flex flex-col items-center gap-4 text-center">
    <div className="space-y-2">
     <p className="text-sm font-semibold text-text-primary">
      Chưa có phân tích chuyên sâu cho mục này.
     </p>
     <p className="text-sm text-text-muted">
      Gọi AI để bổ sung nghĩa, ví dụ và các ghi chú học tập.
     </p>
    </div>

    <Button
     variant="outline"
     size="sm"
     onClick={onRequest}
     disabled={loading}
     isLoading={loading}
     loadingText="Đang phân tích..."
    >
     <Sparkles className="h-4 w-4" />
     Phân tích bằng AI
    </Button>
   </div>
  </Card>
 );
}

export {
 DictionaryHeroSection,
 DictionaryMeaningSection,
 DictionaryRelatedSection,
 DictionaryLearningInsightsSection,
 DictionaryPersonalNoteSection,
};
