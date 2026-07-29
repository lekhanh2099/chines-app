"use client";

import { Typography } from "@/components/ui/typography";
import Link from "next/link";
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
    className="grid animate-pulse gap-4 rounded-2xl"
    aria-busy="true"
    aria-live="polite"
   >
    <div className="h-5 w-36 rounded-md bg-bg-card" />
    <div className="mx-auto size-48 rounded-2xl bg-bg-card" />
    <div className="grid gap-2">
     <div className="h-4 w-full rounded-md bg-bg-card" />
     <div className="h-4 w-3/4 rounded-md bg-bg-card" />
    </div>
    <span className="sr-only">Đang tải cấu tạo chữ</span>
   </Card>
  );
 }

 const ai = vocabData.ai_analysis;
 const radicals = getNormalizedRadicals(ai);
 const etymologyType = typeof ai?.etymology === "object" ? ai.etymology.type : undefined;
 const etymologyText = typeof ai?.etymology === "object" ? ai.etymology.explanation : ai?.etymology;
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
        className=" font-semibold   transition-colors hover: -hover"
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
        className="min-w-10"
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
       <Typography as="p" tone="secondary" leading="relaxed">
        {mnemonic_story || etymologyText}
       </Typography>
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
        <div key={`${item.symbol}-${item.label}-${index}`} className="flex items-center gap-2">
         <Card variant="default" padding="sm" className="rounded-2xl ">
          <div className="text-center">
           <Typography as="p" variant="sectionTitle" tone="default" weight="black">
            {item.symbol}
           </Typography>
           {item.label && (
            <Typography as="p" variant="caption" tone="muted" leading="tight">
             {item.label}
            </Typography>
           )}
          </div>
         </Card>
         {index < structureItems.length - 1 && (
          <Typography tone="muted" weight="bold">
           +
          </Typography>
         )}
        </div>
       ))}
       <Typography tone="muted" weight="bold">
        =
       </Typography>
       <Card
        variant="subtle"
        padding="sm"
        className="rounded-2xl  border-accent/20 bg-accent/10 text-center"
       >
        <Typography as="p" variant="sectionTitle" weight="black">
         {character}
        </Typography>
        <Typography as="p" variant="caption" leading="tight">
         kết quả
        </Typography>
       </Card>
      </div>
     ) : (
      <Typography as="p" tone="muted">
       Chưa có dữ liệu cấu tạo chi tiết.
      </Typography>
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
         <Typography variant="sectionTitle" tone="default" weight="black" className="min-w-6">
          {component.part || "?"}
         </Typography>
         <div className="min-w-0">
          <Typography as="p" tone="default" weight="semibold">
           {component.name || component.meaning || "Thành phần phụ"}
          </Typography>
          {component.name && component.meaning && (
           <Typography as="p" variant="caption" tone="muted">
            {component.meaning}
           </Typography>
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
