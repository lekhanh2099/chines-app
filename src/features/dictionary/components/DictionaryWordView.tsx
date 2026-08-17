"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { DictionaryCharacterSidebar } from "@/features/dictionary/components/DictionaryCharacterSidebar";
import { DictionaryWordSkeleton } from "@/features/dictionary/components/DictionarySkeletons";
import {
 DictionaryDocStructureSection,
 DictionaryHeroSection,
 DictionaryPersonalNoteSection,
 DictionaryRelatedSection,
} from "@/features/dictionary/components/DictionaryWordSections";
import type { DictionaryWordViewModel } from "@/features/dictionary/types";
import { Link } from "@/i18n/navigation";

type DictionaryWordViewProps = {
 viewModel: DictionaryWordViewModel;
};

function DictionaryWordView({ viewModel }: DictionaryWordViewProps) {
 const t = useTranslations("Dictionary.word");

 if (viewModel.state === "loading") return <DictionaryWordSkeleton />;

 if (viewModel.state === "not-found") {
  return (
   <PageContainer>
    <div className="flex h-full items-center justify-center">
     <EmptyState
      title={t("notFoundTitle")}
      description={t("notFoundDescription")}
      actions={
       <Button asChild variant="outline">
        <Link href="/hanzihome">{t("backHome")}</Link>
       </Button>
      }
     />
    </div>
   </PageContainer>
  );
 }

 return (
  <PageContainer>
   <div className="flex w-full min-w-0 flex-col gap-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <Button asChild variant="outline" size="toolbar">
      <Link href="/hanzihome">
       <ArrowLeft data-icon="inline-start" />
       {t("home")}
      </Link>
     </Button>

     <Button
      variant="outline"
      size="toolbar"
      onClick={viewModel.requestAiAnalysis}
      disabled={viewModel.isAiLoading}
      title={t("supplementTitle")}
     >
      {viewModel.isAiLoading ? (
       <Spinner data-icon="inline-start" />
      ) : (
       <Sparkles data-icon="inline-start" />
      )}
      {t("supplement")}
     </Button>
    </div>

    <DictionaryHeroSection viewModel={viewModel} />

    <div className="grid w-full min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
     <main className="flex min-w-0 flex-col gap-5">
      <DictionaryDocStructureSection viewModel={viewModel} />
      {viewModel.ai?.vn_trap || viewModel.ai?.common_mistakes || viewModel.ai?.confusion ? (
       <Card variant="subtle" padding="md">
        <div className="flex flex-col gap-2">
         <SectionHeader title={t("confusion")} />
         <Typography as="p" tone="danger" leading="relaxed">
          {viewModel.ai?.confusion || viewModel.ai?.vn_trap || viewModel.ai?.common_mistakes}
         </Typography>
        </div>
       </Card>
      ) : null}
      <DictionaryPersonalNoteSection viewModel={viewModel} />
     </main>

     <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-5 lg:self-start">
      <DictionaryCharacterSidebar
       characters={viewModel.chineseCharacters}
       selectedCharacter={viewModel.selectedCharacter}
       onSelectCharacter={viewModel.setActiveCharacter}
       parentText={viewModel.vocabData.hanzi}
      />
      <DictionaryRelatedSection viewModel={viewModel} />
     </aside>
    </div>
   </div>
  </PageContainer>
 );
}

export { DictionaryWordView };
