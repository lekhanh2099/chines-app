"use client";

import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/patterns/empty-state";
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
    <div className="flex h-full items-center justify-center">
     <EmptyState
      title="Không tìm thấy từ vựng"
      description="Từ này chưa có trong dữ liệu hiện tại."
      actions={
       <Button asChild variant="outline">
        <Link href="/hanzihome">Quay về HanziHome</Link>
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
       HanziHome
      </Link>
     </Button>

     <Button
      variant="outline"
      size="toolbar"
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
      {viewModel.ai?.vn_trap || viewModel.ai?.common_mistakes || viewModel.ai?.confusion ? (
       <Card variant="subtle" padding="md">
        <div className="flex flex-col gap-2">
         <SectionHeader title="Dễ nhầm" />
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
