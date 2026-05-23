"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useVocabDetail } from "@/features/dictionary/hooks/useVocabDetail";
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
 const { vocabData, isLoading } = useVocabDetail(selectedCharacter);

 if (isLoading || !vocabData) {
  return (
   <Card
    variant="subtle"
    padding="md"
    className="rounded-2xl  text-sm text-text-muted"
   >
    <div className="flex items-center gap-2">
     <Loader2 className="h-4 w-4 animate-spin  " />
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
 const mnemonic_story = ai?.mnemonic_story;

 return (
  <div className="flex flex-col gap-4">
   <SectionWrapper className="rounded-2xl ">
    <SectionHeader
     title="Tập viết chữ"
     description="Xem thứ tự nét, chọn từng chữ trong cụm để luyện riêng."
     trailing={
      parentText !== selectedCharacter ? (
       <Link
        href={`/dictionary/${encodeURIComponent(selectedCharacter)}`}
        className="text-sm font-semibold   transition-colors hover: -hover"
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

    {(radicals.length > 0 || ai?.components?.length || etymologyText) && (
     <AnatomyOverview
      character={selectedCharacter}
      radicals={radicals}
      components={ai?.components || []}
     />
    )}

    {(etymologyText || mnemonic_story) && (
     <Card variant="subtle" padding="sm" className="rounded-2xl ">
      <div className="flex flex-col gap-2">
       <div className="flex items-center gap-2">
        <SectionHeader title={mnemonic_story ? "Mẹo nhớ" : "Nguồn gốc"} />
        {etymologyType && (
         <Badge variant="purple" size="sm" className="w-fit">
          {etymologyType}
         </Badge>
        )}
       </div>
       <p className="text-sm leading-relaxed text-text-secondary">
        {mnemonic_story || etymologyText}
       </p>
      </div>
     </Card>
    )}
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
   <Card variant="subtle" padding="sm" className="rounded-2xl ">
    <div className="flex flex-col gap-3">
     <SectionHeader title="Sơ đồ cấu tạo" />
     {structureItems.length > 0 ? (
      <div className="flex flex-wrap items-center gap-2">
       {structureItems.map((item, index) => (
        <div
         key={`${item.symbol}-${item.label}-${index}`}
         className="flex items-center gap-2"
        >
         <Card variant="default" padding="sm" className="rounded-2xl ">
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
        className="rounded-2xl  border-accent/20 bg-accent/10 text-center"
       >
        <p className="text-lg font-black  ">{character}</p>
        <p className="text-xs leading-tight  /80">kết quả</p>
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
    <Card variant="subtle" padding="sm" className="rounded-2xl ">
     <div className="flex flex-col gap-2">
      <SectionHeader title="Thành phần" />
      {components.map((component, index) => (
       <Card
        key={`${component.part || "component"}-${index}`}
        variant="default"
        padding="sm"
        className="rounded-2xl "
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

export { DictionaryCharacterSidebar };
