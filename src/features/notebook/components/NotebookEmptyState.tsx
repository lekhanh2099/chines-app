import { SearchX } from "lucide-react";

import { GlassPanel } from "@/components/ui/glass-panel";

export function NotebookEmptyState() {
 return (
  <GlassPanel className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
   <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle text-accent-text">
    <SearchX className="h-6 w-6" />
   </span>
   <h2 className="mt-4 text-xl font-black text-text-primary">Không tìm thấy mục phù hợp</h2>
   <p className="mt-2 max-w-md text-sm font-medium leading-6 text-text-muted">
    Thử đổi từ khóa hoặc chọn một nhóm chức năng khác.
   </p>
  </GlassPanel>
 );
}
