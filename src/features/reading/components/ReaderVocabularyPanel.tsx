"use client";

import { useMemo, useState } from "react";

import { VocabPreviewRow } from "@/features/hanzihome/components/lesson-overview/overview/VocabPreviewRow";
import { VocabularyCardList } from "@/features/hanzihome/components/lesson-overview/overview/VocabularyCardList";
import { matchesVocabularyQuery } from "@/features/hanzihome/components/lesson-overview/overview/vocabulary-search";

import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";

type ReaderVocabulary = ReaderDocumentResource["vocabulary"];

export function ReaderVocabularyPanel({ vocabulary }: { vocabulary: ReaderVocabulary }) {
 const [query, setQuery] = useState("");
 const filteredVocabulary = useMemo(
  () =>
   vocabulary.filter((item) =>
    matchesVocabularyQuery(query, [item.word, item.pinyin, item.meaning]),
   ),
  [query, vocabulary],
 );

 return (
  <VocabularyCardList
   totalCount={vocabulary.length}
   query={query}
   onQueryChange={setQuery}
   resultCount={filteredVocabulary.length}
   actions={null}
  >
   {filteredVocabulary.map((item) => (
    <VocabPreviewRow
     key={item.id}
     hanzi={item.word}
     pinyin={item.pinyin}
     hanviet=""
     category=""
     meaning={item.meaning}
    />
   ))}
  </VocabularyCardList>
 );
}
