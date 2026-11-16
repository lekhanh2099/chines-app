import { VocabularyStoreLoading } from "@/features/hanzihome/vocabulary-index/VocabularyStoreLoading";

export default function InspectorLoading() {
 return (
  <div className="hanzihome-static-page hanzihome-workspace-page min-w-0">
   <div className="hanzihome-workspace-shell flex w-full max-w-full flex-col">
    <VocabularyStoreLoading />
   </div>
  </div>
 );
}
