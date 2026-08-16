"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

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

import type { ReaderDocumentResource } from "./reader-content-api";

type ReaderVocabulary = ReaderDocumentResource["vocabulary"];

function normalizeSearch(value: string) {
 return value.normalize("NFC").trim().toLocaleLowerCase("vi");
}

export function ReaderVocabularyPanel({ vocabulary }: { vocabulary: ReaderVocabulary }) {
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
       Từ vựng bài đọc
      </Typography>
      <Typography variant="caption" tone="muted">
       Tra nhanh theo chữ Hán, pinyin hoặc nghĩa trong bài.
      </Typography>
     </div>
     <Badge casing="natural">{vocabulary.length} từ</Badge>
    </div>
    {vocabulary.length > 0 ? (
     <label className="relative block max-w-md">
      <span className="sr-only">Tìm từ vựng</span>
      <Search
       aria-hidden="true"
       className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground-muted"
      />
      <Input
       value={query}
       onChange={(event) => setQuery(event.target.value)}
       placeholder="Tìm chữ Hán, pinyin hoặc nghĩa…"
       className="pl-9"
       autoComplete="off"
      />
     </label>
    ) : null}
   </div>

   {vocabulary.length === 0 ? (
    <div className="px-4 pb-4 sm:px-5">
     <Typography variant="bodySmall" tone="muted">
      Bài này chưa có từ vựng liên kết.
     </Typography>
    </div>
   ) : filteredVocabulary.length === 0 ? (
    <div className="px-4 pb-4 sm:px-5">
     <Typography variant="bodySmall" tone="muted">
      Không có từ nào khớp với tìm kiếm này.
     </Typography>
    </div>
   ) : (
    <DataTable aria-label="Từ vựng bài đọc">
     <DataTableHeader>
      <DataTableRow>
       <DataTableHead>Từ / cụm từ</DataTableHead>
       <DataTableHead>Pinyin</DataTableHead>
       <DataTableHead>Nghĩa trong bài</DataTableHead>
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
          {item.pinyin || "Chưa có pinyin"}
         </PinyinText>
        </DataTableCell>
        <DataTableCell>
         <Typography as="span" variant="bodySmall" tone="muted">
          {item.meaning || "Chưa có nghĩa"}
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
