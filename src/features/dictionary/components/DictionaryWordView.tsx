"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { DictionaryCharacterSidebar } from "@/features/dictionary/components/DictionaryCharacterSidebar";
import {
 DictionaryHeroSection,
 DictionaryLearningInsightsSection,
 DictionaryMeaningSection,
 DictionaryPersonalNoteSection,
 DictionaryRelatedSection,
} from "@/features/dictionary/components/DictionaryWordSections";
import type { DictionaryWordViewModel } from "@/features/dictionary/types";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/layout/section-header";

type DictionaryWordViewProps = {
 viewModel: DictionaryWordViewModel;
};

function DictionaryWordView({ viewModel }: DictionaryWordViewProps) {
 if (viewModel.state === "loading") {
  return (
   <PageContainer>
    <div className="flex h-full flex-col items-center justify-center gap-4">
     <Loader2 className="h-8 w-8 animate-spin text-accent" />
     <p className="text-sm text-text-muted">Đang tải dữ liệu từ điển...</p>
    </div>
   </PageContainer>
  );
 }

 if (viewModel.state === "not-found") {
  return (
   <PageContainer>
    <div className="flex h-full flex-col items-center justify-center gap-4">
     <p className="text-text-muted">Không tìm thấy từ vựng.</p>
     <Link
      href="/vocabulary"
      className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
     >
      Quay về kho từ vựng
     </Link>
    </div>
   </PageContainer>
  );
 }

 return (
  <PageContainer>
   <div className="mx-auto flex w-full flex-col gap-4">
    <Link
     href="/vocabulary"
     className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-text-primary"
    >
     <ArrowLeft className="h-3.5 w-3.5" />
     Kho từ vựng
    </Link>

    <div className="grid grid-cols-12 gap-5">
     <div className="col-span-4 self-start flex flex-col gap-3 lg:sticky lg:col-span-3">
      <DictionaryHeroSection viewModel={viewModel} />
      <DictionaryLearningInsightsSection viewModel={viewModel} />
      {(viewModel.ai?.vn_trap ||
       viewModel.ai?.common_mistakes ||
       viewModel.ai?.confusion) && (
       <Card
        variant="subtle"
        padding="sm"
        className="border-danger/30 bg-danger-subtle"
       >
        <div className="flex flex-col gap-2">
         <SectionHeader title="Dễ nhầm" />
         <p className="text-sm leading-relaxed text-danger-text">
          {viewModel.ai?.confusion ||
           viewModel.ai?.vn_trap ||
           viewModel.ai?.common_mistakes}
         </p>
        </div>
       </Card>
      )}
      <DictionaryPersonalNoteSection viewModel={viewModel} />
     </div>

     <div className="col-span-4 flex flex-col gap-3 lg:col-span-5">
      <DictionaryMeaningSection viewModel={viewModel} />
      <DictionaryRelatedSection viewModel={viewModel} />
     </div>

     <div className="col-span-4 self-start gap-3 lg:sticky lg:col-span-4">
      <DictionaryCharacterSidebar
       characters={viewModel.chineseCharacters}
       selectedCharacter={viewModel.selectedCharacter}
       onSelectCharacter={viewModel.setActiveCharacter}
       parentText={viewModel.vocabData.hanzi}
      />
     </div>
    </div>
   </div>
  </PageContainer>
 );
}

export { DictionaryWordView };
