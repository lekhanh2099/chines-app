"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
 BookmarkPlus,
 CheckCircle,
 Globe2,
 Layers3,
 ListChecks,
 Loader2,
 Save,
 Sparkles,
 Volume2,
 VolumeOff,
} from "lucide-react";

import { SectionHeader } from "@/components/layout/section-header";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { LearnerHanziText } from "@/components/patterns/learner-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useVocabDetail } from "@/features/dictionary/hooks/useVocabDetail";
import type { DictionaryWordReadyViewModel, ExampleItem } from "@/features/dictionary/types";
import { useTTS } from "@/hooks/useTTS";
import { getNormalizedRadicals } from "@/services/vocab.service";

type DictionarySectionProps = {
 viewModel: DictionaryWordReadyViewModel;
};

function DictionaryHeroSection({ viewModel }: DictionarySectionProps) {
 const { vocabData } = useVocabDetail(viewModel.selectedCharacter);
 const radicals = getNormalizedRadicals(vocabData?.ai_analysis);
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
   <div className="grid gap-4">
    <div className="grid min-w-0 gap-2">
     <div className="flex flex-wrap items-center gap-3">
      <LearnerHanziText as="h2" size="display" weight="black" leading="tight">
       {viewModel.vocabData.hanzi}
      </LearnerHanziText>
      <IconButton
       onClick={handleSpeak}
       disabled={isTTSLoading}
       title={isSpeaking ? "Dừng phát âm" : "Đọc từ"}
      >
       {isTTSLoading ? (
        <Loader2 className="animate-spin" />
       ) : isSpeaking ? (
        <VolumeOff />
       ) : (
        <Volume2 />
       )}
      </IconButton>
      {(viewModel.ai?.han_viet || viewModel.vocabData.sino_vietnamese) && (
       <Badge size="md">{viewModel.ai?.han_viet || viewModel.vocabData.sino_vietnamese}</Badge>
      )}
      {viewModel.ai?.word_type && <Badge size="md">{viewModel.ai.word_type}</Badge>}
     </div>

     <div className="flex flex-wrap items-center gap-2.5">
      {viewModel.vocabData.pinyin && (
       <Typography as="p" variant="sectionTitle" tone="accent" weight="semibold">
        {viewModel.vocabData.pinyin}
       </Typography>
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
     </div>

     {radicals.length > 0 && (
      <div className="grid gap-2">
       {radicals.map((radical, index) => (
        <div
         key={`${radical.char || radical.meaning || "radical"}-${index}`}
         className="flex items-start gap-2"
        >
         <div className="shrink-0">
          <LearnerHanziText size="title" weight="black">
           {radical.char}
          </LearnerHanziText>
         </div>
         <div className="min-w-0">
          {radical.pinyin && (
           <Typography as="p" variant="caption" weight="semibold">
            {radical.pinyin}
           </Typography>
          )}
          {radical.meaning && (
           <Typography as="p" tone="secondary" leading="relaxed">
            {radical.meaning}
           </Typography>
          )}
         </div>
        </div>
       ))}
      </div>
     )}

     {viewModel.meaningSummary && (
      <Typography as="p" tone="secondary" leading="relaxed" className="max-w-3xl">
       {viewModel.meaningSummary}
      </Typography>
     )}
     {viewModel.ai?.source_metadata && (
      <Typography
       as="p"
       variant="overline"
       tone="muted"
       weight="bold"
       tracking="wide"
       transform="uppercase"
      >
       {viewModel.ai.source_metadata.lesson_title || viewModel.ai.source_metadata.lesson_key}
       {viewModel.ai.source_metadata.category ? ` · ${viewModel.ai.source_metadata.category}` : ""}
      </Typography>
     )}
    </div>

    <div>
     <Button
      onClick={viewModel.handleSave}
      disabled={viewModel.isSaving || viewModel.isSaved === true}
     >
      {viewModel.isSaving ? (
       <Loader2 data-icon="inline-start" className="animate-spin" />
      ) : viewModel.isSaved === true ? (
       <CheckCircle data-icon="inline-start" />
      ) : (
       <BookmarkPlus data-icon="inline-start" />
      )}
      {viewModel.isSaved === true ? "Đã lưu" : "Lưu vào SRS"}
     </Button>
    </div>
   </div>
  </SectionWrapper>
 );
}

function DictionaryDocStructureSection({ viewModel }: DictionarySectionProps) {
 const ai = viewModel.ai || {};
 const hanViet = ai.han_viet || ai.sino_vietnamese || viewModel.vocabData.sino_vietnamese || "";
 const meaningDetail =
  ai.meaning_detail ||
  viewModel.meaningItems[0]?.meaning ||
  viewModel.meaningSummary ||
  viewModel.vocabData.meaning;

 return (
  <SectionWrapper>
   <SectionHeader
    title="Bản học theo file docs"
    description="Giữ đúng 7 phần để học sâu, ôn ví dụ và tránh nhầm."
   />

   <div className="grid gap-3">
    <DocSection index={1} title="Hán Việt & Liên hệ Tiếng Việt">
     <div className="grid gap-2">
      {hanViet && (
       <Typography as="p" tone="secondary" leading="relaxed">
        <Typography as="span" tone="default" weight="bold">
         Âm Hán Việt:
        </Typography>{" "}
        {hanViet}
       </Typography>
      )}
      {ai.han_viet_note && (
       <Typography as="p" tone="secondary" leading="relaxed">
        {ai.han_viet_note}
       </Typography>
      )}
      <Typography as="p" tone="secondary" leading="relaxed">
       <Typography as="span" tone="default" weight="bold">
        Nghĩa:
       </Typography>{" "}
       {meaningDetail || "Chưa có nghĩa chi tiết."}
      </Typography>
     </div>
    </DocSection>

    <DocSection index={2} title="Chiết tự">
     <Typography as="p" tone="secondary" leading="relaxed" wrapping="preLine">
      {ai.decomposition || "Chưa có chiết tự."}
     </Typography>
    </DocSection>

    <DocSection index={3} title="So sánh từ gần nghĩa">
     {ai.comparisons?.length ? <BulletList items={ai.comparisons} /> : <EmptyDocText />}
    </DocSection>

    <DocSection index={4} title="Cụm từ cố định">
     {ai.collocations?.length ? <CompactTextGrid items={ai.collocations} /> : <EmptyDocText />}
    </DocSection>

    <DocSection index={5} title="Ví dụ">
     {viewModel.extraExamples.length ? (
      <div className="grid gap-3">
       {viewModel.extraExamples.map((example, index) => (
        <ExampleCard key={`${example.zh}-${example.pinyin}-doc-${index}`} example={example} />
       ))}
      </div>
     ) : (
      <EmptyDocText />
     )}
    </DocSection>

    <DocSection index={6} title="Trung Việt / văn hóa">
     <Typography as="p" tone="secondary" leading="relaxed" wrapping="preLine">
      {ai.cultural_note || "Chưa có ghi chú văn hóa."}
     </Typography>
    </DocSection>

    <DocSection index={7} title="Lưu ý">
     <Typography as="p" tone="secondary" leading="relaxed" wrapping="preLine">
      {ai.usage_note || "Chưa có lưu ý riêng."}
     </Typography>
    </DocSection>
   </div>
  </SectionWrapper>
 );
}

function DocSection({
 index,
 title,
 children,
}: {
 index: number;
 title: string;
 children: ReactNode;
}) {
 return (
  <Card variant="subtle" padding="md">
   <div className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center gap-2">
     <Badge variant="accent" size="sm">
      {index}
     </Badge>
     <Typography
      as="h3"
      variant="overline"
      tone="default"
      weight="black"
      tracking="wide"
      transform="uppercase"
     >
      {title}
     </Typography>
    </div>
    {children}
   </div>
  </Card>
 );
}

function EmptyDocText() {
 return (
  <Typography as="p" tone="muted">
   Chưa có dữ liệu cho phần này.
  </Typography>
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
        <Card key={`${meaning.meaning}-${index}`} variant="subtle" padding="md">
         <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
           <Badge variant="accent" size="sm">
            {index + 1}
           </Badge>
           {meaning.pos && <Badge size="sm">{meaning.pos}</Badge>}
          </div>

          <Typography as="p" tone="default" weight="semibold" leading="relaxed">
           {meaning.meaning}
          </Typography>

          {meaning.examples.length > 0 && (
           <div className="flex flex-col gap-2 border-l border-accent/20 pl-3">
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
      <Card variant="subtle" padding="md">
       <Typography as="p" tone="muted">
        Chưa có dữ liệu nghĩa để hiển thị.
       </Typography>
      </Card>
     )}

     {viewModel.extraExamples.length > 0 && (
      <div className="flex flex-col gap-2">
       <SectionHeader title="Ví dụ mở rộng" />
       <div className="grid gap-3">
        {viewModel.extraExamples.slice(0, 8).map((example, index) => (
         <ExampleCard key={`${example.zh}-${example.pinyin}-extra-${index}`} example={example} />
        ))}
       </div>
      </div>
     )}
    </div>
   ) : (
    <NoDataPlaceholder onRequest={viewModel.requestAiAnalysis} loading={viewModel.isAiLoading} />
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
       {viewModel.relatedCompounds.length + viewModel.synonyms.length + viewModel.antonyms.length}{" "}
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
    <Card variant="subtle" padding="md">
     <Typography as="p" tone="muted">
      Chưa có dữ liệu từ liên quan.
     </Typography>
    </Card>
   )}
  </SectionWrapper>
 );
}

function DictionaryLearningInsightsSection({ viewModel }: DictionarySectionProps) {
 if (!viewModel.hasLearningInsights) return null;

 return (
  <SectionWrapper>
   <SectionHeader
    title="Gợi nhớ và lưu ý"
    description="Tập trung vào mẹo nhớ, lỗi dễ nhầm và logic sử dụng."
   />

   <div className="grid gap-3">
    {viewModel.ai?.decomposition && (
     <InsightSection title="Chiết tự" icon={<Layers3 />}>
      <Typography as="p" tone="secondary" leading="relaxed" wrapping="preLine">
       {viewModel.ai.decomposition}
      </Typography>
     </InsightSection>
    )}

    {viewModel.ai?.comparisons && viewModel.ai.comparisons.length > 0 && (
     <InsightSection title="So sánh từ gần nghĩa" icon={<ListChecks />}>
      <BulletList items={viewModel.ai.comparisons} />
     </InsightSection>
    )}

    {viewModel.ai?.collocations && viewModel.ai.collocations.length > 0 && (
     <InsightSection title="Cụm từ cố định">
      <CompactTextGrid items={viewModel.ai.collocations} />
     </InsightSection>
    )}

    {viewModel.ai?.cultural_note && (
     <InsightSection title="Trung Việt" icon={<Globe2 />}>
      <Typography as="p" tone="secondary" leading="relaxed" wrapping="preLine">
       {viewModel.ai.cultural_note}
      </Typography>
     </InsightSection>
    )}

    {viewModel.ai?.usage_note && (
     <InsightSection title="Lưu ý">
      <Typography as="p" tone="secondary" leading="relaxed" wrapping="preLine">
       {viewModel.ai.usage_note}
      </Typography>
     </InsightSection>
    )}

    {viewModel.ai?.notes && (
     <InsightSection title="Ghi chú dùng từ">
      <Typography as="p" tone="secondary" leading="relaxed">
       {viewModel.ai.notes}
      </Typography>
     </InsightSection>
    )}

    {viewModel.ai?.usage_logic && viewModel.ai.usage_logic.length > 0 && (
     <InsightSection title="Tư duy cốt lõi">
      <BulletList items={viewModel.ai.usage_logic} />
     </InsightSection>
    )}
   </div>
  </SectionWrapper>
 );
}

function InsightSection({
 title,
 icon,
 children,
}: {
 title: string;
 icon?: ReactNode;
 children: ReactNode;
}) {
 return (
  <Card variant="subtle" padding="md">
   <div className="grid gap-2">
    <SectionHeader title={title} trailing={icon} />
    {children}
   </div>
  </Card>
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
      size="toolbar"
      onClick={() => viewModel.handleSavePersonalNote(note)}
      disabled={viewModel.isSaving}
     >
      {viewModel.isSaving ? (
       <Spinner data-icon="inline-start" />
      ) : (
       <Save data-icon="inline-start" />
      )}
      Lưu note
     </Button>
    }
   />

   <Textarea
    value={note}
    onChange={(event) => setNote(event.target.value)}
    placeholder="Tự ghi cách nhớ, ngữ cảnh dùng, điểm dễ nhầm..."
    density="comfortable"
   />
  </SectionWrapper>
 );
}

function ExampleRow({ example }: { example: ExampleItem }) {
 return (
  <div className="flex flex-col gap-1">
   <LearnerHanziText as="p" weight="medium">
    {example.zh}
   </LearnerHanziText>
   {example.pinyin && (
    <Typography as="p" variant="caption" tone="accent" weight="semibold">
     {example.pinyin}
    </Typography>
   )}
   {example.vi && (
    <Typography as="p" variant="caption" tone="muted" emphasis="italic">
     {example.vi}
    </Typography>
   )}
   {example.note && (
    <Typography as="p" variant="caption" tone="secondary" leading="relaxed">
     → {example.note}
    </Typography>
   )}
  </div>
 );
}

function ExampleCard({ example }: { example: ExampleItem }) {
 return (
  <Card variant="subtle" padding="md">
   <ExampleRow example={example} />
  </Card>
 );
}

function BulletList({ items }: { items: string[] }) {
 return (
  <div className="grid gap-2">
   {items.map((item, index) => (
    <div key={`${item}-${index}`} className="flex items-start gap-2">
     <Typography as="span" tone="accent" aria-hidden="true">
      •
     </Typography>
     <Typography as="span" tone="secondary" leading="relaxed">
      {item}
     </Typography>
    </div>
   ))}
  </div>
 );
}

function CompactTextGrid({ items }: { items: string[] }) {
 return (
  <div className="grid gap-2 md:grid-cols-2">
   {items.map((item, index) => (
    <Typography key={`${item}-${index}`} as="p" tone="secondary" weight="semibold">
     {item}
    </Typography>
   ))}
  </div>
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
      if (!word) return null;

      return (
       <Card
        key={`${title}-${word}-${index}`}
        asChild
        variant="interactive"
        padding="md"
        className="h-full"
       >
        <Link href={`/dictionary/${encodeURIComponent(word)}`}>
         <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
           <LearnerHanziText as="p" weight="bold">
            {word}
           </LearnerHanziText>
           {item.pinyin && (
            <Typography as="span" variant="caption" tone="accent" weight="semibold">
             {item.pinyin}
            </Typography>
           )}
          </div>
          <Typography as="p" tone="secondary" leading="relaxed">
           {item.meaning || "Chưa có nghĩa."}
          </Typography>
         </div>
        </Link>
       </Card>
      );
     })}
    </div>
   ) : (
    <Typography as="p" tone="muted">
     {emptyText}
    </Typography>
   )}
  </div>
 );
}

function AiLoadingState() {
 return (
  <Card variant="subtle" padding="md">
   <div className="grid gap-3">
    <div className="flex items-center gap-2">
     <Sparkles className="size-4 animate-pulse text-accent-text" />
     <Typography as="p" variant="bodySmall" weight="bold">
      Đang phân tích dữ liệu chuyên sâu...
     </Typography>
    </div>
    <Separator />
    <div className="grid gap-2.5" aria-hidden="true">
     <div className="h-4 w-4/5 animate-pulse rounded-lg bg-bg-card" />
     <div className="h-3 w-full animate-pulse rounded-lg bg-bg-card" />
     <div className="h-3 w-3/4 animate-pulse rounded-lg bg-bg-card" />
    </div>
   </div>
  </Card>
 );
}

function NoDataPlaceholder({ onRequest, loading }: { onRequest: () => void; loading: boolean }) {
 return (
  <Card variant="subtle" padding="md">
   <div className="flex flex-col items-center gap-4 text-center">
    <div className="grid gap-2">
     <Typography as="p" tone="default" weight="semibold">
      Chưa có phân tích chuyên sâu cho mục này.
     </Typography>
     <Typography as="p" tone="muted">
      Gọi AI để bổ sung nghĩa, ví dụ và các ghi chú học tập.
     </Typography>
    </div>

    <Button variant="outline" size="toolbar" onClick={onRequest} disabled={loading}>
     {loading ? <Spinner data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
     Phân tích bằng AI
    </Button>
   </div>
  </Card>
 );
}

export {
 DictionaryHeroSection,
 DictionaryDocStructureSection,
 DictionaryMeaningSection,
 DictionaryRelatedSection,
 DictionaryLearningInsightsSection,
 DictionaryPersonalNoteSection,
};
