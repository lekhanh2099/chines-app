"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
 DataTable,
 DataTableBody,
 DataTableCell,
 DataTableHead,
 DataTableHeader,
 DataTableRow,
} from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { PinyinText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";

type ReaderVocabulary = ReaderDocumentResource["vocabulary"];

function normalizeSearch(value: string) {
 return value.normalize("NFC").trim().toLocaleLowerCase("vi");
}

export function ReaderVocabularyPanel({ vocabulary }: { vocabulary: ReaderVocabulary }) {
 const t = useTranslations("Reader.study.vocabulary");
 const [query, setQuery] = useState("");
 const normalizedQuery = normalizeSearch(query);
 const filteredVocabulary = useMemo(() => {
  if (!normalizedQuery) return vocabulary;
  return vocabulary.filter((item) =>
   normalizeSearch(`${item.word} ${item.pinyin} ${item.meaning}`).includes(normalizedQuery),
  );
 }, [normalizedQuery, vocabulary]);

 return (
  <Card variant="section" padding="none" className="overflow-hidden">
   <div className="grid gap-3 px-4 py-4 sm:px-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-1">
      <Typography as="h3" variant="sectionTitle" weight="black">
       {t("title")}
      </Typography>
      <Typography variant="caption" tone="muted">
       {t("description")}
      </Typography>
     </div>
     <Badge casing="natural">{t("count", { count: vocabulary.length })}</Badge>
    </div>
    {vocabulary.length > 0 ? (
     <label className="block max-w-md">
      <span className="sr-only">{t("searchLabel")}</span>
      <Input
       value={query}
       onChange={(event) => setQuery(event.target.value)}
       placeholder={t("searchPlaceholder")}
       autoComplete="off"
      />
     </label>
    ) : null}
   </div>

   {vocabulary.length === 0 ? (
    <div className="px-4 pb-4 sm:px-5">
     <Typography variant="bodySmall" tone="muted">
      {t("empty")}
     </Typography>
    </div>
   ) : filteredVocabulary.length === 0 ? (
    <div className="px-4 pb-4 sm:px-5">
     <Typography variant="bodySmall" tone="muted">
      {t("noResults")}
     </Typography>
    </div>
   ) : (
    <DataTable aria-label={t("tableAria")}>
     <DataTableHeader>
      <DataTableRow>
       <DataTableHead>{t("word")}</DataTableHead>
       <DataTableHead>{t("pinyin")}</DataTableHead>
       <DataTableHead>{t("meaning")}</DataTableHead>
      </DataTableRow>
     </DataTableHeader>
     <DataTableBody>
      {filteredVocabulary.map((item) => (
       <DataTableRow key={item.id}>
        <DataTableCell lang="zh-CN">
         <Typography as="span" variant="body" weight="black">
          {item.word}
         </Typography>
        </DataTableCell>
        <DataTableCell>
         <PinyinText variant="bodySmall" tone="accent">
          {item.pinyin || t("missingPinyin")}
         </PinyinText>
        </DataTableCell>
        <DataTableCell>
         <Typography as="span" variant="bodySmall" tone="muted">
          {item.meaning || t("missingMeaning")}
         </Typography>
        </DataTableCell>
       </DataTableRow>
      ))}
     </DataTableBody>
    </DataTable>
   )}
  </Card>
 );
}
