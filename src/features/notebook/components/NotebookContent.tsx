import { NotebookComparePanel } from "@/features/notebook/components/NotebookComparePanel";
import { NotebookEmptyState } from "@/features/notebook/components/NotebookEmptyState";
import { NotebookMatrixView } from "@/features/notebook/components/NotebookMatrixView";
import { NotebookTermCard } from "@/features/notebook/components/NotebookTermCard";
import type {
 NotebookComparisonItem,
 NotebookItem,
 NotebookViewMode,
} from "@/features/notebook/types";

export function NotebookContent({
 items,
 comparisons,
 viewMode,
}: {
 items: NotebookItem[];
 comparisons: NotebookComparisonItem[];
 viewMode: NotebookViewMode;
}) {
 if (viewMode === "compare") {
  return comparisons.length > 0 ? (
   <NotebookComparePanel comparisons={comparisons} items={items} />
  ) : (
   <NotebookEmptyState />
  );
 }

 if (items.length === 0) return <NotebookEmptyState />;
 if (viewMode === "matrix") return <NotebookMatrixView items={items} />;

 return (
  <div className="grid gap-4 xl:grid-cols-2">
   {items.map((item) => (
    <NotebookTermCard key={item.id} item={item} />
   ))}
  </div>
 );
}
