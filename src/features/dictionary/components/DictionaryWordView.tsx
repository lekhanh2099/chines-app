"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
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
  <PageContainer className="bg-white">
   <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <Link
      href="/vocabulary"
      className="inline-flex h-12 items-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-700 shadow-theme-sm transition-colors hover:bg-stone-50"
     >
      <ArrowLeft className="h-4 w-4" />
      Kho từ vựng
     </Link>

     <Button
      variant="outline"
      size="sm"
      className="h-12 rounded-2xl border-2 border-stone-200 font-black shadow-theme-sm"
      onClick={viewModel.requestAiAnalysis}
      disabled={viewModel.isAiLoading}
      isLoading={viewModel.isAiLoading}
      loadingText="Đang phân tích..."
      title="Chỉ bổ sung phần còn thiếu, không ghi đè dữ liệu đã import"
     >
      <Sparkles className="h-4 w-4" />
      Bổ sung phần thiếu
     </Button>
    </div>

    <DictionaryHeroSection viewModel={viewModel} />

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
     <main className="flex min-w-0 flex-col gap-5">
      <DictionaryDocStructureSection viewModel={viewModel} />
      {(viewModel.ai?.vn_trap ||
       viewModel.ai?.common_mistakes ||
       viewModel.ai?.confusion) && (
       <Card
        variant="subtle"
        padding="md"
        className="rounded border-danger/30 bg-danger-subtle"
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
