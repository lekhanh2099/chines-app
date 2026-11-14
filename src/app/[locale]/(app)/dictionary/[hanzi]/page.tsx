"use client";

import { DictionarySentenceView } from "@/features/dictionary/components/DictionarySentenceView";
import { DictionaryWordView } from "@/features/dictionary/components/DictionaryWordView";
import { useDictionaryPageViewModel } from "@/features/dictionary/hooks/useDictionaryPageViewModel";

export default function DictionaryPage() {
 const viewModel = useDictionaryPageViewModel();

 if (viewModel.mode === "sentence") {
  return <DictionarySentenceView viewModel={viewModel} />;
 }

 return <DictionaryWordView viewModel={viewModel} />;
}
