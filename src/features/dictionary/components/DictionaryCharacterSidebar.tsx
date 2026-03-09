"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useVocabDetail } from "@/features/vocabulary/hooks/useVocabDetail";
import { SectionHeader } from "@/components/layout/section-header";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getNormalizedRadicals } from "@/services/vocab.service";
import { CharacterWriterCard } from "@/features/dictionary/components/CharacterWriterCard";
import type { StructureComponent } from "@/features/dictionary/types";

type DictionaryCharacterSidebarProps = {
 characters: string[];
 selectedCharacter: string;
 onSelectCharacter: (character: string) => void;
 parentText: string;
};

function DictionaryCharacterSidebar({
 characters,
 selectedCharacter,
 onSelectCharacter,
 parentText,
}: DictionaryCharacterSidebarProps) {
 const { vocabData, isLoading, isAiLoading, triggerAi, hasDeepAiData } =
  useVocabDetail(selectedCharacter);

 useEffect(() => {
  if (!isLoading && !isAiLoading && vocabData && !hasDeepAiData()) {
   triggerAi();
  }
 }, [hasDeepAiData, isAiLoading, isLoading, triggerAi, vocabData]);

 if (isLoading || !vocabData) {
  return (
   <Card variant="elevated" padding="md" className="text-sm text-text-muted">
    <div className="flex items-center gap-2">
     <Loader2 className="h-4 w-4 animate-spin text-accent" />
     Đang tải cấu tạo chữ...
    </div>
   </Card>
  );
 }

 const ai = vocabData.ai_analysis;
 const radicals = getNormalizedRadicals(ai);
 const etymologyType =
  typeof ai?.etymology === "object" ? ai.etymology.type : undefined;
 const etymologyText =
  typeof ai?.etymology === "object" ? ai.etymology.explanation : ai?.etymology;

 return (
  <div className="flex flex-col gap-4">
   <SectionWrapper>
    <SectionHeader
     title="Chữ và nét viết"
     description="Theo dõi cách viết, phiên âm và các thông số cốt lõi của chữ."
     trailing={
      parentText !== selectedCharacter ? (
       <Link
        href={`/dictionary/${encodeURIComponent(selectedCharacter)}`}
        className="text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
       >
        Tra riêng
       </Link>
      ) : null
     }
    />

    {characters.length > 1 && (
     <div className="flex flex-wrap gap-2">
      {characters.map((character) => (
       <Button
        key={character}
        variant={selectedCharacter === character ? "default" : "outline"}
        size="sm"
        className="min-w-10 px-3"
        onClick={() => onSelectCharacter(character)}
       >
        {character}
       </Button>
      ))}
     </div>
    )}

    <div className="flex justify-center">
     <CharacterWriterCard character={selectedCharacter} />
    </div>

    <AnatomyOverview
     character={selectedCharacter}
     radicals={radicals}
     components={ai?.components || []}
    />
    <SectionWrapper>
     <SectionHeader
      title="Nguồn gốc"
      description="Giải thích lịch sử hoặc logic hình thành của chữ."
     />
     <Card variant="subtle" padding="sm">
      <div className="flex flex-col gap-2">
       {etymologyType && (
        <Badge variant="purple" size="sm">
         {etymologyType}
        </Badge>
       )}
       <p className="text-sm leading-relaxed text-text-secondary">
        {etymologyText || "Chưa có phân tích nguồn gốc."}
       </p>
      </div>
     </Card>
    </SectionWrapper>

    {(etymologyType || etymologyText) && (
     <Card variant="subtle" padding="sm">
      <div className="flex flex-col gap-2">
       <SectionHeader title="Chiết tự" />
       {etymologyType && (
        <Badge variant="purple" size="sm">
         {etymologyType}
        </Badge>
       )}
       <p className="text-sm leading-relaxed text-text-secondary">
        {etymologyText}
       </p>
      </div>
     </Card>
    )}

    {/* <div className="grid grid-cols-2 gap-2">
     <MetricCard label="Pinyin" value={vocabData.pinyin || "Chưa rõ"} wide />
     <MetricCard
      label="Số nét"
      value={ai?.stroke_count ? String(ai.stroke_count) : "?"}
     />
     <MetricCard label="Thanh điệu" value={getToneLabel(vocabData.pinyin)} />
    </div> */}
   </SectionWrapper>
  </div>
 );
}

function AnatomyOverview({
 character,
 radicals,
 components,
}: {
 character: string;
 radicals: Array<{ char?: string; pinyin?: string; meaning?: string }>;
 components: StructureComponent[];
}) {
 const structureItems = (
  components.length > 0
   ? components.map((component) => ({
      symbol: component.part || "?",
      label: component.name || component.meaning || "",
     }))
   : radicals.slice(0, 3).map((radical) => ({
      symbol: radical.char || "?",
      label: radical.meaning || radical.pinyin || "",
     }))
 ).filter((item) => item.symbol || item.label);

 return (
  <div className="flex flex-col gap-4">
   <Card variant="subtle" padding="sm">
    <div className="flex flex-col gap-3">
     <SectionHeader title="Sơ đồ cấu tạo" />
     {structureItems.length > 0 ? (
      <div className="flex flex-wrap items-center gap-2">
       {structureItems.map((item, index) => (
        <div
         key={`${item.symbol}-${item.label}-${index}`}
         className="flex items-center gap-2"
        >
         <Card variant="default" padding="sm" className="rounded-xl">
          <div className="text-center">
           <p className="text-lg font-black text-text-primary">{item.symbol}</p>
           {item.label && (
            <p className="text-xs leading-tight text-text-muted">
             {item.label}
            </p>
           )}
          </div>
         </Card>
         {index < structureItems.length - 1 && (
          <span className="text-sm font-bold text-text-muted">+</span>
         )}
        </div>
       ))}
       <span className="text-sm font-bold text-text-muted">=</span>
       <Card
        variant="subtle"
        padding="sm"
        className="border-accent/20 bg-accent/10 text-center"
       >
        <p className="text-lg font-black text-accent">{character}</p>
        <p className="text-xs leading-tight text-accent/80">kết quả</p>
       </Card>
      </div>
     ) : (
      <p className="text-sm text-text-muted">
       Chưa có dữ liệu cấu tạo chi tiết.
      </p>
     )}
    </div>
   </Card>

   {components.length > 0 && (
    <Card variant="subtle" padding="sm">
     <div className="flex flex-col gap-2">
      <SectionHeader title="Thành phần" />
      {components.map((component, index) => (
       <Card
        key={`${component.part || "component"}-${index}`}
        variant="default"
        padding="sm"
        className="rounded-2xl"
       >
        <div className="flex items-start gap-3">
         <span className="min-w-6 text-lg font-black text-text-primary">
          {component.part || "?"}
         </span>
         <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
           {component.name || component.meaning || "Thành phần phụ"}
          </p>
          {component.name && component.meaning && (
           <p className="text-xs text-text-muted">{component.meaning}</p>
          )}
         </div>
        </div>
       </Card>
      ))}
     </div>
    </Card>
   )}
  </div>
 );
}

function MetricCard({
 label,
 value,
 wide = false,
}: {
 label: string;
 value: string;
 wide?: boolean;
}) {
 return (
  <Card
   variant="subtle"
   padding="sm"
   className={wide ? "col-span-2" : undefined}
  >
   <div className="flex flex-col gap-1">
    <SectionHeader title={label} />
    <p className="text-sm font-semibold leading-relaxed text-text-primary">
     {value}
    </p>
   </div>
  </Card>
 );
}

export { DictionaryCharacterSidebar };
