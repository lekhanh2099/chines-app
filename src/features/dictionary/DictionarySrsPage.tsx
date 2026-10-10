import { BookOpen, Search, Sparkles } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { PageContainer } from "@/components/layout/workspace/page-container";
import { EmptyState } from "@/components/patterns/empty-state";
import { LearnerHanziText } from "@/components/patterns/learner-text";
import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import { PageHeader } from "@/components/ui/layout/page-header";
import { Typography } from "@/components/ui/display/typography";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionarySrsCollection } from "./dictionary-srs-api";
import { matchesQuery } from "./dictionary-srs-utils";

type DictionarySrsPageProps = {
 searchParams?: Promise<{
  q?: string;
 }>;
};

export async function DictionarySrsPage({ searchParams }: DictionarySrsPageProps) {
 const locale = await getLocale();
 const t = await getTranslations("Dictionary.srs");
 const resolvedSearchParams = await searchParams;
 const query = (resolvedSearchParams?.q ?? "").trim().toLocaleLowerCase(locale);
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  redirect({ href: "/login", locale });
  return null;
 }

 let collection: Awaited<ReturnType<typeof getDictionarySrsCollection>>;
 try {
  collection = await getDictionarySrsCollection(supabase, user.id);
 } catch {
  const common = await getTranslations("Common");
  return (
   <PageContainer>
    <div className="grid gap-5">
     <PageHeader title={t("title")} eyebrow={t("eyebrow")} description={t("description")} />
     <Card role="alert" variant="subtle" padding="md" className="grid gap-3">
      <Typography as="h2" variant="sectionTitle" weight="bold">
       {t("loadErrorTitle")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="secondary">
       {t("loadErrorDescription")}
      </Typography>
      <form method="get">
       <Input type="hidden" name="q" value={resolvedSearchParams?.q ?? ""} />
       <Button type="submit">{common("actions.retry")}</Button>
      </form>
     </Card>
    </div>
   </PageContainer>
  );
 }
 const missingSchema = collection.missingSchema;
 const savedItems = collection.savedItems.filter((item) => matchesQuery(item, query, locale));

 return (
  <PageContainer>
   <div className="grid w-full min-w-0 gap-5">
    <PageHeader
     eyebrow={t("eyebrow")}
     title={t("title")}
     description={t("description")}
     meta={
      <Typography variant="caption" tone="muted" weight="bold">
       {t("showing", { count: savedItems.length })}
      </Typography>
     }
     actions={
      <Button asChild variant="outline" size="toolbar">
       <Link href="/vocab">
        <BookOpen data-icon="inline-start" />
        {t("allVocab")}
       </Link>
      </Button>
     }
    />

    <Card variant="section" padding="sm">
     <form className="flex min-w-0 items-center gap-2">
      <div className="relative min-w-0 flex-1">
       <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
       <Input
        name="q"
        defaultValue={resolvedSearchParams?.q ?? ""}
        aria-label={t("searchAria")}
        placeholder={t("searchPlaceholder")}
        density="compact"
        adornment="start"
       />
      </div>
      <Button type="submit" size="toolbar">
       {t("search")}
      </Button>
     </form>
    </Card>

    {missingSchema ? (
     <Card variant="subtle" padding="md">
      <Typography as="p" variant="bodySmall" tone="warning" weight="bold">
       {t("missingSchema")}
      </Typography>
     </Card>
    ) : null}

    {!missingSchema && savedItems.length === 0 ? (
     <EmptyState
      surface="subtle"
      size="spacious"
      icon={<Sparkles />}
      title={query ? t("emptySearchTitle") : t("emptyTitle")}
      description={query ? t("emptySearchDescription") : t("emptyDescription")}
     />
    ) : null}

    {savedItems.length > 0 ? (
     <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-label={t("savedWordsAria")}>
      {savedItems.map((item) => (
       <Card
        key={`${item.id}:${item.dictionaryId ?? "legacy"}`}
        asChild
        variant="interactive"
        padding="md"
       >
        <Link href={`/dictionary/${encodeURIComponent(item.hanzi)}`} className="grid gap-3">
         <div className="flex items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
           <LearnerHanziText
            as="h2"
            variant="sectionTitle"
            tone="default"
            weight="black"
            leading="none"
           >
            {item.hanzi}
           </LearnerHanziText>
           <Typography as="p" tone="accent" weight="black" clamp="one">
            {item.pinyin || t("missingPinyin")}
           </Typography>
          </div>
          <Badge variant={item.saved ? "success" : "default"}>
           {t(
            item.level <= 0
             ? "levels.new"
             : item.level <= 2
               ? "levels.reviewing"
               : item.level <= 4
                 ? "levels.good"
                 : "levels.mastered",
           )}
          </Badge>
         </div>

         <div className="grid gap-1">
          {item.hanViet ? (
           <Typography as="p" variant="overline" tone="default" weight="black" tracking="wide">
            {item.hanViet}
           </Typography>
          ) : null}
          <Typography as="p" variant="bodySmall" tone="secondary" weight="semibold" clamp="two">
           {item.meaning || t("missingMeaning")}
          </Typography>
          {item.note ? (
           <Card variant="subtle" padding="sm">
            <Typography as="p" variant="caption" tone="muted" weight="bold" clamp="two">
             {item.note}
            </Typography>
           </Card>
          ) : null}
         </div>
        </Link>
       </Card>
      ))}
     </section>
    ) : null}
   </div>
  </PageContainer>
 );
}
