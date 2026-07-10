"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { DictionaryCharacterSidebar } from "@/features/dictionary/components/DictionaryCharacterSidebar";
import {
 DictionaryDocStructureSection,
 DictionaryHeroSection,
 DictionaryPersonalNoteSection,
 DictionaryRelatedSection,
} from "@/features/dictionary/components/DictionaryWordSections";
import type { DictionaryWordViewModel } from "@/features/dictionary/types";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DictionaryWordSkeleton } from "@/features/dictionary/components/DictionarySkeletons";

type DictionaryWordViewProps = {
 viewModel: DictionaryWordViewModel;
};

function DictionaryWordView({ viewModel }: DictionaryWordViewProps) {
 if (viewModel.state === "loading") {
  return <DictionaryWordSkeleton />;
 }

 if (viewModel.state === "not-found") {
  return (
   <PageContainer>
    <div className="flex h-full flex-col items-center justify-center gap-4">
     <p className="text-text-muted">Không tìm thấy từ vựng.</p>
     <Link href="/hanzihome" className=" font-medium  transition-colors hover: -hover">
      Quay về HanziHome
     </Link>
    </div>
   </PageContainer>
  );
 }

 return (
  <PageContainer className="bg-bg-primary">
   <div className="flex w-full min-w-0 flex-col gap-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <Link
      href="/hanzihome"
      className="inline-flex h-12 items-center gap-2 rounded-xl border border-border-default bg-bg-card px-4 font-black text-text-secondary shadow-theme-sm transition-colors hover:bg-bg-subtle"
     >
      <ArrowLeft className="h-4 w-4" />
      HanziHome
     </Link>

     <Button
      variant="outline"
      size="sm"
      className="h-12 rounded-xl font-black shadow-theme-sm"
      onClick={viewModel.requestAiAnalysis}
      disabled={viewModel.isAiLoading}
      title="Chỉ bổ sung phần còn thiếu, không ghi đè dữ liệu đã import"
     >
      {viewModel.isAiLoading ? (
       <Spinner data-icon="inline-start" />
      ) : (
       <Sparkles data-icon="inline-start" />
      )}
      Bổ sung phần thiếu
     </Button>
    </div>

    <DictionaryHeroSection viewModel={viewModel} />

    <div className="grid w-full min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
     <main className="flex min-w-0 flex-col gap-5">
      <DictionaryDocStructureSection viewModel={viewModel} />
      {(viewModel.ai?.vn_trap || viewModel.ai?.common_mistakes || viewModel.ai?.confusion) && (
       <Card
        variant="subtle"
        padding="md"
        className="rounded-2xl border-danger/30 bg-danger-subtle"
       >
        <div className="flex flex-col gap-2">
         <SectionHeader title="Dễ nhầm" />
         <p className=" leading-relaxed text-danger-text">
          {viewModel.ai?.confusion || viewModel.ai?.vn_trap || viewModel.ai?.common_mistakes}
         </p>
        </div>
       </Card>
      )}
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
