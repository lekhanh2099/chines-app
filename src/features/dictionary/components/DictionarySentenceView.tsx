"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type { DictionarySentenceViewModel } from "@/features/dictionary/types";
import { HANZI_CHAR_REGEX } from "@/features/dictionary/utils";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type DictionarySentenceViewProps = {
 viewModel: DictionarySentenceViewModel;
};

function DictionarySentenceView({ viewModel }: DictionarySentenceViewProps) {
 const t = useTranslations("Dictionary.sentence");

 return (
  <PageContainer>
   <div className="w-full min-w-0">
    <div className="mx-auto grid w-full max-w-4xl gap-4">
     <Link
      href="/hanzihome"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-text-primary"
     >
      <ArrowLeft className="h-3.5 w-3.5" />
      {t("backHome")}
     </Link>

     <SectionWrapper>
      <SectionHeader title={t("title")} description={t("description")} />

      <Typography
       as="h1"
       variant="pageTitle"
       tone="default"
       weight="black"
       leading="snug"
       wrapping="breakWords"
      >
       {viewModel.text}
      </Typography>

      {viewModel.pinyin && (
       <Card variant="subtle" padding="sm">
        <div className="flex flex-col gap-1">
         <SectionHeader title={t("pinyin")} />
         <Typography as="p" weight="semibold" wrapping="breakWords">
          {viewModel.pinyin}
         </Typography>
        </div>
       </Card>
      )}

      <Card variant="subtle" padding="sm">
       <div className="flex flex-col gap-2">
        <SectionHeader title={t("translation")} />
        {viewModel.isLoading ? (
         <div className="grid animate-pulse gap-2" aria-busy="true" aria-live="polite">
          <div className="h-4 w-full rounded-md bg-bg-card" />
          <div className="h-4 w-5/6 rounded-md bg-bg-card" />
          <span className="sr-only">{t("translating")}</span>
         </div>
        ) : viewModel.translation ? (
         <Typography as="p" tone="default" leading="relaxed" wrapping="breakWords">
          {viewModel.translation}
         </Typography>
        ) : (
         <Typography as="p" tone="muted">
          {viewModel.error || t("missingTranslation")}
         </Typography>
        )}
       </div>
      </Card>

      {viewModel.characters.length > 0 && (
       <Card variant="subtle" padding="sm">
        <div className="flex flex-col gap-3">
         <SectionHeader title={t("characters")} description={t("charactersDescription")} />

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
            <Typography
             as="span"
             key={`${character}-${index}`}
             tone="muted"
             className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-bg-subtle px-3"
            >
             {character}
            </Typography>
           ),
          )}
         </div>
        </div>
       </Card>
      )}
     </SectionWrapper>
    </div>
   </div>
  </PageContainer>
 );
}

export { DictionarySentenceView };
