"use client";

import { useTranslations } from "next-intl";

import { SectionHeader } from "@/components/layout/section-header";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { CharacterWriterCard } from "@/features/dictionary/components/CharacterWriterCard";
import { useVocabDetail } from "@/features/dictionary/hooks/useVocabDetail";
import type { StructureComponent } from "@/features/dictionary/types";
import { Link } from "@/i18n/navigation";
import { getNormalizedRadicals } from "@/services/vocab.service";

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
 const t = useTranslations("Dictionary.sidebar");
 const { vocabData, isLoading } = useVocabDetail(selectedCharacter);

 if (isLoading || !vocabData) {
  return (
   <Card
    variant="subtle"
    padding="md"
    className="grid animate-pulse gap-4"
    aria-busy="true"
    aria-live="polite"
   >
    <div className="h-5 w-36 rounded-md bg-bg-card" />
    <div className="mx-auto size-48 rounded-xl bg-bg-card" />
    <div className="grid gap-2">
     <div className="h-4 w-full rounded-md bg-bg-card" />
     <div className="h-4 w-3/4 rounded-md bg-bg-card" />
    </div>
    <span className="sr-only">{t("loading")}</span>
   </Card>
  );
 }

 const ai = vocabData.ai_analysis;
 const radicals = getNormalizedRadicals(ai);
 const etymologyType = typeof ai?.etymology === "object" ? ai.etymology.type : undefined;
 const etymologyText = typeof ai?.etymology === "object" ? ai.etymology.explanation : ai?.etymology;
 const mnemonicStory = ai?.mnemonic_story;

 return (
  <SectionWrapper>
   <SectionHeader
    title={t("writing")}
    description={t("writingDescription")}
    trailing={
     parentText !== selectedCharacter ? (
      <Button asChild variant="outline" size="toolbar">
       <Link href={`/dictionary/${encodeURIComponent(selectedCharacter)}`}>{t("inspect")}</Link>
      </Button>
     ) : null
    }
   />

   {characters.length > 1 ? (
    <SegmentedControl<string>
     value={selectedCharacter}
     items={characters.map((character) => ({ key: character, label: character }))}
     onChange={onSelectCharacter}
     density="touch"
     aria-label={t("selectCharacter")}
    />
   ) : null}

   <div className="flex justify-center">
    <CharacterWriterCard character={selectedCharacter} />
   </div>

   {radicals.length > 0 || ai?.components?.length || etymologyText ? (
    <AnatomyOverview
     character={selectedCharacter}
     radicals={radicals}
     components={ai?.components || []}
    />
   ) : null}

   {etymologyText || mnemonicStory ? (
    <Card variant="subtle" padding="sm">
     <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
       <SectionHeader title={mnemonicStory ? t("mnemonic") : t("origin")} />
       {etymologyType ? (
        <Badge variant="purple" size="sm">
         {etymologyType}
        </Badge>
       ) : null}
      </div>
      <Typography as="p" tone="secondary" leading="relaxed">
       {mnemonicStory || etymologyText}
      </Typography>
     </div>
    </Card>
   ) : null}
  </SectionWrapper>
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
 const t = useTranslations("Dictionary.sidebar");
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
  <div className="grid gap-4">
   <section className="grid gap-3" aria-label={t("structureAria")}>
    <SectionHeader title={t("structure")} />
    {structureItems.length > 0 ? (
     <div className="flex flex-wrap items-center gap-2">
      {structureItems.map((item, index) => (
       <div key={`${item.symbol}-${item.label}-${index}`} className="flex items-center gap-2">
        <Card variant="subtle" padding="sm" className="text-center">
         <Typography as="p" variant="sectionTitle" tone="default" weight="black">
          {item.symbol}
         </Typography>
         {item.label ? (
          <Typography as="p" variant="caption" tone="muted" leading="tight">
           {item.label}
          </Typography>
         ) : null}
        </Card>
        {index < structureItems.length - 1 ? (
         <Typography tone="muted" weight="bold">
          +
         </Typography>
        ) : null}
       </div>
      ))}
      <Typography tone="muted" weight="bold">
       =
      </Typography>
      <Card variant="subtle" padding="sm" className="text-center">
       <Typography as="p" variant="sectionTitle" tone="accent" weight="black">
        {character}
       </Typography>
       <Typography as="p" variant="caption" tone="muted" leading="tight">
        {t("result")}
       </Typography>
      </Card>
     </div>
    ) : (
     <Typography as="p" tone="muted">
      {t("missingStructure")}
     </Typography>
    )}
   </section>

   {components.length > 0 ? (
    <>
     <Separator />
     <section className="grid gap-3" aria-label={t("componentsAria")}>
      <SectionHeader title={t("components")} />
      <div className="grid gap-3">
       {components.map((component, index) => (
        <div key={`${component.part || "component"}-${index}`} className="flex items-start gap-3">
         <Typography variant="sectionTitle" tone="default" weight="black" className="min-w-6">
          {component.part || "?"}
         </Typography>
         <div className="min-w-0">
          <Typography as="p" tone="default" weight="semibold">
           {component.name || component.meaning || t("secondaryComponent")}
          </Typography>
          {component.name && component.meaning ? (
           <Typography as="p" variant="caption" tone="muted">
            {component.meaning}
           </Typography>
          ) : null}
         </div>
        </div>
       ))}
      </div>
     </section>
    </>
   ) : null}
  </div>
 );
}

export { DictionaryCharacterSidebar };
