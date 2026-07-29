import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { GlassPanel } from "@/components/ui/glass-panel";

export function NotebookEmptyState() {
 return (
  <GlassPanel className="grid min-h-72 content-center justify-items-center gap-4 p-8 text-center">
   <EmptyState
    size="spacious"
    icon={<SearchX />}
    title="Không tìm thấy mục phù hợp"
    description="Thử đổi từ khóa hoặc chọn một nhóm chức năng khác."
   />
  </GlassPanel>
 );
}
