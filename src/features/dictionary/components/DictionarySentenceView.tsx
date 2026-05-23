"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DictionarySentenceViewModel } from "@/features/dictionary/types";
import { HANZI_CHAR_REGEX } from "@/features/dictionary/utils";

type DictionarySentenceViewProps = {
 viewModel: DictionarySentenceViewModel;
};

function DictionarySentenceView({ viewModel }: DictionarySentenceViewProps) {
 return (
  <PageContainer>
   <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <Link
     href="/hanzihome"
     className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-text-primary"
    >
     <ArrowLeft className="h-3.5 w-3.5" />
     HanziHome
    </Link>

    <SectionWrapper>
     <SectionHeader
      title="Dịch câu"
      description="Ưu tiên hiểu toàn câu trước, sau đó bóc tách từng hán tự khi cần."
     />

     <h1 className="break-words text-3xl font-black leading-snug text-text-primary">
      {viewModel.text}
     </h1>

     {viewModel.pinyin && (
      <Card variant="subtle" padding="sm">
       <div className="flex flex-col gap-1">
        <SectionHeader title="Pinyin" />
        <p className="break-words text-sm font-semibold  ">
         {viewModel.pinyin}
        </p>
       </div>
      </Card>
     )}

     <Card variant="subtle" padding="sm">
      <div className="flex flex-col gap-2">
       <SectionHeader title="Bản dịch" />
       {viewModel.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-text-muted">
         <Loader2 className="h-4 w-4 animate-spin  " />
         Đang dịch câu...
        </div>
       ) : viewModel.translation ? (
        <p className="break-words text-sm leading-relaxed text-text-primary">
         {viewModel.translation}
        </p>
       ) : (
        <p className="text-sm text-text-muted">
         {viewModel.error || "Chưa có bản dịch cho câu này."}
        </p>
       )}
      </div>
     </Card>

     {viewModel.characters.length > 0 && (
      <Card variant="subtle" padding="sm">
       <div className="flex flex-col gap-3">
        <SectionHeader
         title="Tra từng hán tự"
         description="Mỗi ký tự dẫn tới một trang tra cứu riêng."
        />

        <div className="flex flex-wrap gap-2">
         {Array.from(viewModel.text).map((character, index) =>
          HANZI_CHAR_REGEX.test(character) ? (
           <Link
            key={`${character}-${index}`}
            href={`/dictionary/${encodeURIComponent(character)}`}
            className={cn(
             buttonVariants({ variant: "outline", size: "sm" }),
             "min-w-9 px-3 font-bold",
            )}
           >
            {character}
           </Link>
          ) : (
           <span
            key={`${character}-${index}`}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded bg-bg-subtle px-3 text-sm text-text-muted"
           >
            {character}
           </span>
          ),
         )}
        </div>
       </div>
      </Card>
     )}
    </SectionWrapper>
   </div>
  </PageContainer>
 );
}

export { DictionarySentenceView };
